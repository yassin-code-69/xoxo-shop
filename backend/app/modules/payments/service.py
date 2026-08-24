import json

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError
from app.core.logging import logger
from app.integrations.payments.manager import (
    GatewayCallbackResult,
    gateway_manager,
)
from app.modules.audit.service import AuditService
from app.modules.orders.model import Order, OrderStatusHistory
from app.modules.payments.model import Payment, PaymentAttempt
from app.modules.payments.schema import (
    GatewayInitiateResponse,
    ManualPaymentSubmitRequest,
    PaymentAdminRead,
    PaymentApproveRequest,
    PaymentRejectRequest,
)
from app.modules.users.model import Profile
from app.shared.enums import AuditAction, FulfillmentStatus, OrderStatus, PaymentStatus
from app.shared.pagination import PaginatedResponse, PaginationParams
from app.shared.time import utcnow
from app.workers.tasks import enqueue_fulfillment


class PaymentService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.audit_service = AuditService(db)

    async def submit_manual_payment(
        self,
        public_order_id: str,
        user_id: str,
        data: ManualPaymentSubmitRequest,
    ) -> Payment:
        # Load order with payment
        query = select(Order).options(selectinload(Order.payment)).where(Order.public_order_id == public_order_id)
        res = await self.db.execute(query)
        order = res.scalars().first()
        if not order:
            raise NotFoundError(message=f"Order '{public_order_id}' not found", code="ORDER_NOT_FOUND")

        # Verify ownership
        if order.user_id != user_id:
            raise ForbiddenError(
                message="You cannot submit payment for another user's order", code="ORDER_ACCESS_DENIED"
            )

        # Verify state
        if order.payment_status in (PaymentStatus.VERIFIED.value, PaymentStatus.VERIFYING.value):
            raise ConflictError(
                message=f"Payment for this order has already been {order.payment_status}",
                code="PAYMENT_ALREADY_PROCESSED",
            )
        if order.order_status in (OrderStatus.COMPLETED.value, OrderStatus.CANCELLED.value):
            raise ConflictError(
                message=f"Cannot submit payment for order with status '{order.order_status}'",
                code="ORDER_INVALID_STATE",
            )

        # Check duplicate TrxID across verified payments
        clean_trx_id = data.transaction_id.strip().upper()
        dup_check = await self.db.execute(
            select(Payment).where(
                (Payment.transaction_id == clean_trx_id)
                & (Payment.status.in_([PaymentStatus.VERIFIED.value, PaymentStatus.SUBMITTED.value]))
                & (Payment.order_id != order.id)
            )
        )
        if dup_check.scalars().first():
            raise ConflictError(
                message="This Transaction ID has already been submitted for another order. Please check and try again.",
                code="DUPLICATE_TRANSACTION_ID",
            )

        # Load or update payment
        payment = order.payment
        if not payment:
            payment = Payment(
                order_id=order.id,
                payment_type="MANUAL",
                payment_method=order.payment_method_code,
                amount=order.total_amount,
                currency=order.currency,
                status=PaymentStatus.PENDING.value,
            )
            self.db.add(payment)

        if data.payment_method:
            payment.payment_method = data.payment_method.upper()
            order.payment_method_code = data.payment_method.upper()

        payment.transaction_id = clean_trx_id
        payment.sender_number = data.sender_number.strip() if data.sender_number else None
        if data.proof_path:
            payment.proof_path = data.proof_path.strip()

        payment.status = PaymentStatus.SUBMITTED.value
        payment.submitted_at = utcnow()

        # Update order state
        order.payment_status = PaymentStatus.SUBMITTED.value
        order.order_status = OrderStatus.PAYMENT_SUBMITTED.value

        # Record history
        self.db.add(
            OrderStatusHistory(
                order_id=order.id,
                status_type="PAYMENT",
                previous_status=PaymentStatus.PENDING.value,
                new_status=PaymentStatus.SUBMITTED.value,
                reason=f"Customer submitted manual payment TrxID: {clean_trx_id}",
                changed_by=user_id,
            )
        )

        await self.db.commit()
        await self.db.refresh(payment)
        return payment

    async def list_admin_payments(
        self,
        params: PaginationParams,
        status_filter: str | None = None,
        method_filter: str | None = None,
        search: str | None = None,
    ) -> PaginatedResponse[PaymentAdminRead]:
        query = (
            select(Payment)
            .join(Payment.order)
            .join(Order.user)
            .options(
                selectinload(Payment.order).selectinload(Order.user),
            )
        )
        if status_filter:
            query = query.where(Payment.status == status_filter)
        if method_filter:
            query = query.where(Payment.payment_method == method_filter.upper())
        if search:
            search_pat = f"%{search}%"
            query = query.where(
                (Payment.transaction_id.ilike(search_pat))
                | (Payment.sender_number.ilike(search_pat))
                | (Order.public_order_id.ilike(search_pat))
                | (Profile.email.ilike(search_pat))
            )

        count_query = select(func.count()).select_from(query.subquery())
        total = (await self.db.execute(count_query)).scalar() or 0

        query = query.order_by(Payment.created_at.desc()).offset(params.offset).limit(params.page_size)
        payments = (await self.db.execute(query)).scalars().all()

        items = []
        for p in payments:
            items.append(
                PaymentAdminRead(
                    id=p.id,
                    order_id=p.order_id,
                    public_order_id=p.order.public_order_id if p.order else None,
                    customer_email=p.order.user.email if p.order and p.order.user else None,
                    customer_name=p.order.user.full_name if p.order and p.order.user else None,
                    payment_type=p.payment_type,
                    payment_method=p.payment_method,
                    amount=p.amount,
                    currency=p.currency,
                    transaction_id=p.transaction_id,
                    sender_number=p.sender_number,
                    proof_path=p.proof_path,
                    status=p.status,
                    submitted_at=p.submitted_at,
                    verified_at=p.verified_at,
                    verified_by=p.verified_by,
                    rejection_reason=p.rejection_reason,
                    created_at=p.created_at,
                    updated_at=p.updated_at,
                )
            )

        return PaginatedResponse.create(items=items, total=total, page=params.page, page_size=params.page_size)

    async def approve_manual_payment(
        self,
        payment_id: str,
        admin_id: str,
        admin_email: str,
        data: PaymentApproveRequest | None = None,
    ) -> Payment:
        query = (
            select(Payment)
            .options(selectinload(Payment.order))
            .where((Payment.id == payment_id) | (Payment.order_id == payment_id))
        )
        res = await self.db.execute(query)
        payment = res.scalars().first()
        if not payment:
            raise NotFoundError(message=f"Payment '{payment_id}' not found", code="PAYMENT_NOT_FOUND")

        # Concurrency safety: check state
        if payment.status == PaymentStatus.VERIFIED.value:
            raise ConflictError(message="Payment is already verified", code="PAYMENT_ALREADY_VERIFIED")

        payment.status = PaymentStatus.VERIFIED.value
        payment.verified_at = utcnow()
        payment.verified_by = admin_email

        order = payment.order
        order.payment_status = PaymentStatus.VERIFIED.value
        order.order_status = OrderStatus.PAYMENT_VERIFIED.value
        order.fulfillment_status = FulfillmentStatus.QUEUED.value

        # Record history
        self.db.add(
            OrderStatusHistory(
                order_id=order.id,
                status_type="PAYMENT",
                previous_status=PaymentStatus.SUBMITTED.value,
                new_status=PaymentStatus.VERIFIED.value,
                reason=f"Payment approved by admin {admin_email}",
                changed_by=admin_id,
            )
        )

        # Audit log
        await self.audit_service.log_event(
            action=AuditAction.PAYMENT_APPROVED,
            entity_type="PAYMENT",
            entity_id=payment.id,
            actor_id=admin_id,
            actor_email=admin_email,
            metadata={
                "public_order_id": order.public_order_id,
                "amount": str(payment.amount),
                "transaction_id": payment.transaction_id,
            },
        )

        await self.db.commit()
        await self.db.refresh(payment)

        # Automatically enqueue background fulfillment
        enqueue_fulfillment(order.id, is_retry=False)

        return payment

    async def reject_manual_payment(
        self,
        payment_id: str,
        admin_id: str,
        admin_email: str,
        data: PaymentRejectRequest,
    ) -> Payment:
        query = (
            select(Payment)
            .options(selectinload(Payment.order))
            .where((Payment.id == payment_id) | (Payment.order_id == payment_id))
        )
        res = await self.db.execute(query)
        payment = res.scalars().first()
        if not payment:
            raise NotFoundError(message=f"Payment '{payment_id}' not found", code="PAYMENT_NOT_FOUND")

        if payment.status == PaymentStatus.VERIFIED.value:
            raise ConflictError(message="Cannot reject an already verified payment", code="PAYMENT_ALREADY_VERIFIED")

        payment.status = PaymentStatus.REJECTED.value
        payment.rejection_reason = data.reason

        order = payment.order
        order.payment_status = PaymentStatus.REJECTED.value
        order.order_status = OrderStatus.FAILED.value

        # History
        self.db.add(
            OrderStatusHistory(
                order_id=order.id,
                status_type="PAYMENT",
                previous_status=PaymentStatus.SUBMITTED.value,
                new_status=PaymentStatus.REJECTED.value,
                reason=f"Payment rejected by admin {admin_email}: {data.reason}",
                changed_by=admin_id,
            )
        )

        # Audit
        await self.audit_service.log_event(
            action=AuditAction.PAYMENT_REJECTED,
            entity_type="PAYMENT",
            entity_id=payment.id,
            actor_id=admin_id,
            actor_email=admin_email,
            metadata={
                "public_order_id": order.public_order_id,
                "reason": data.reason,
                "transaction_id": payment.transaction_id,
            },
        )

        await self.db.commit()
        await self.db.refresh(payment)
        return payment

    async def initiate_gateway_payment(
        self,
        public_order_id: str,
        user_id: str,
        gateway: str,
        client_ip: str = "127.0.0.1",
    ) -> GatewayInitiateResponse:
        gw_upper = gateway.upper().strip()
        if gw_upper not in ("BKASH", "NAGAD"):
            raise ConflictError(
                message=f"Unsupported gateway '{gateway}'. Supported gateways: BKASH, NAGAD",
                code="UNSUPPORTED_GATEWAY",
            )

        query = (
            select(Order)
            .options(
                selectinload(Order.payment).selectinload(Payment.attempts),
            )
            .where(Order.public_order_id == public_order_id)
        )
        res = await self.db.execute(query)
        order = res.scalars().first()
        if not order:
            raise NotFoundError(message=f"Order '{public_order_id}' not found", code="ORDER_NOT_FOUND")

        if order.user_id != user_id:
            raise ForbiddenError(
                message="You cannot initiate payment for another user's order", code="ORDER_ACCESS_DENIED"
            )

        if order.payment_status in (PaymentStatus.VERIFIED.value, PaymentStatus.VERIFYING.value):
            raise ConflictError(
                message=f"Payment for this order has already been {order.payment_status}",
                code="PAYMENT_ALREADY_PROCESSED",
            )
        if order.order_status in (OrderStatus.COMPLETED.value, OrderStatus.CANCELLED.value):
            raise ConflictError(
                message=f"Cannot initiate payment for order with status '{order.order_status}'",
                code="ORDER_INVALID_STATE",
            )

        init_res = await gateway_manager.initiate_payment(
            gateway=gw_upper,
            order_id=order.public_order_id,
            amount=order.total_amount,
            currency=order.currency,
            invoice_number=order.public_order_id,
            client_ip=client_ip,
        )

        payment = order.payment
        if not payment:
            payment = Payment(
                order_id=order.id,
                payment_type="GATEWAY",
                payment_method=gw_upper,
                gateway=gw_upper,
                amount=order.total_amount,
                currency=order.currency,
                status=PaymentStatus.PENDING.value,
            )
            self.db.add(payment)
            await self.db.flush()
        else:
            payment.payment_type = "GATEWAY"
            payment.payment_method = gw_upper
            payment.gateway = gw_upper

        attempt_num = (len(payment.attempts) + 1) if payment.attempts else 1
        attempt = PaymentAttempt(
            payment_id=payment.id,
            gateway=gw_upper,
            gateway_session_id=init_res.payment_session_id,
            attempt_number=attempt_num,
            status="INITIATED",
            request_payload=json.dumps(init_res.raw_data),
        )
        self.db.add(attempt)

        order.payment_method_code = gw_upper
        self.db.add(
            OrderStatusHistory(
                order_id=order.id,
                status_type="PAYMENT",
                previous_status=order.payment_status,
                new_status=order.payment_status,
                reason=f"Customer initiated {gw_upper} gateway checkout (Session: {init_res.payment_session_id})",
                changed_by=user_id,
            )
        )

        await self.db.commit()
        await self.db.refresh(order)

        return GatewayInitiateResponse(
            gateway=gw_upper,
            redirect_url=init_res.redirect_url,
            payment_session_id=init_res.payment_session_id,
            order_id=order.id,
            public_order_id=order.public_order_id,
            amount=order.total_amount,
            currency=order.currency,
            is_mock=init_res.is_mock,
        )

    async def process_gateway_callback(
        self,
        gateway: str,
        query_params: dict,
        body: dict | None = None,
    ) -> tuple[Order | None, GatewayCallbackResult]:
        gw_upper = gateway.upper().strip()
        cb_result = await gateway_manager.handle_callback(gateway=gw_upper, query_params=query_params, body=body)

        # Locate PaymentAttempt & Payment & Order
        attempt = None
        if cb_result.payment_session_id:
            att_query = (
                select(PaymentAttempt)
                .options(
                    selectinload(PaymentAttempt.payment).selectinload(Payment.order),
                )
                .where(PaymentAttempt.gateway_session_id == cb_result.payment_session_id)
            )
            res = await self.db.execute(att_query)
            attempt = res.scalars().first()

        order = None
        payment = None
        if attempt and attempt.payment and attempt.payment.order:
            payment = attempt.payment
            order = payment.order
        else:
            # Fallback lookup by public_order_id if present in callback
            order_id_lookup = query_params.get("order_id") or query_params.get("invoice")
            if order_id_lookup:
                ord_query = (
                    select(Order)
                    .options(
                        selectinload(Order.payment).selectinload(Payment.attempts),
                    )
                    .where(Order.public_order_id == order_id_lookup)
                )
                ord_res = await self.db.execute(ord_query)
                order = ord_res.scalars().first()
                if order:
                    payment = order.payment

        if not order:
            logger.error(
                f"[{gw_upper} Callback] Could not associate session {cb_result.payment_session_id} with any order"
            )
            return None, cb_result

        # Update attempt
        if attempt:
            attempt.status = "SUCCESS" if cb_result.success else cb_result.status
            if cb_result.trx_id:
                attempt.gateway_transaction_id = cb_result.trx_id
            attempt.response_payload = json.dumps(cb_result.raw_data)

        if cb_result.success and cb_result.trx_id:
            # Ensure payment exists
            if not payment:
                payment = Payment(
                    order_id=order.id,
                    payment_type="GATEWAY",
                    payment_method=gw_upper,
                    gateway=gw_upper,
                    amount=order.total_amount,
                    currency=order.currency,
                    status=PaymentStatus.PENDING.value,
                )
                self.db.add(payment)

            # Check if not already verified (idempotency)
            if payment.status != PaymentStatus.VERIFIED.value:
                payment.status = PaymentStatus.VERIFIED.value
                payment.transaction_id = cb_result.trx_id
                payment.verified_at = utcnow()
                payment.verified_by = f"GATEWAY_{gw_upper}"

                order.payment_status = PaymentStatus.VERIFIED.value
                order.order_status = OrderStatus.PAYMENT_VERIFIED.value
                order.fulfillment_status = FulfillmentStatus.QUEUED.value

                self.db.add(
                    OrderStatusHistory(
                        order_id=order.id,
                        status_type="PAYMENT",
                        previous_status=PaymentStatus.PENDING.value,
                        new_status=PaymentStatus.VERIFIED.value,
                        reason=f"Automated gateway payment verified via {gw_upper} (TrxID: {cb_result.trx_id})",
                        changed_by=f"GATEWAY_{gw_upper}",
                    )
                )

                await self.audit_service.log_event(
                    action=AuditAction.PAYMENT_APPROVED,
                    entity_type="PAYMENT",
                    entity_id=payment.id,
                    actor_id=f"GATEWAY_{gw_upper}",
                    actor_email=f"{gw_upper.lower()}@gateway.system",
                    metadata={
                        "public_order_id": order.public_order_id,
                        "amount": str(payment.amount),
                        "transaction_id": cb_result.trx_id,
                        "gateway": gw_upper,
                    },
                )

                await self.db.commit()
                await self.db.refresh(order)

                # Trigger automated fulfillment
                enqueue_fulfillment(order.id, is_retry=False)
            else:
                logger.info(
                    f"[{gw_upper} Callback] Order {order.public_order_id} already verified, skipping fulfillment trigger"
                )
        else:
            # Payment failed or cancelled
            if payment and payment.status != PaymentStatus.VERIFIED.value:
                self.db.add(
                    OrderStatusHistory(
                        order_id=order.id,
                        status_type="PAYMENT",
                        previous_status=order.payment_status,
                        new_status=order.payment_status,
                        reason=f"{gw_upper} gateway payment {cb_result.status}: {cb_result.message}",
                        changed_by=f"GATEWAY_{gw_upper}",
                    )
                )
                await self.db.commit()

        return order, cb_result

