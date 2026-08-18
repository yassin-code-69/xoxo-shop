from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError
from app.modules.audit.service import AuditService
from app.modules.orders.model import Order, OrderStatusHistory
from app.modules.payments.model import Payment
from app.modules.payments.schema import (
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
