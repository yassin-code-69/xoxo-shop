import json

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, NotFoundError
from app.core.logging import logger
from app.integrations.providers.base import ProviderStatus
from app.integrations.providers.registry import get_active_provider
from app.modules.fulfillment.model import ProviderOrder
from app.modules.orders.model import Order, OrderStatusHistory
from app.shared.enums import FulfillmentStatus, OrderStatus, PaymentStatus
from app.shared.time import utcnow


class FulfillmentService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def execute_fulfillment(self, order_id: str, is_retry: bool = False) -> ProviderOrder:
        # Load and lock the order: two workers racing here would mean topping the same
        # player up twice, which costs real diamonds. (SQLite ignores FOR UPDATE.)
        result = await self.db.execute(select(Order).where(Order.id == order_id).with_for_update())
        order = result.scalars().first()
        if not order:
            raise NotFoundError(message=f"Order '{order_id}' not found", code="ORDER_NOT_FOUND")

        # 1. Invariant: payment must be VERIFIED
        if order.payment_status != PaymentStatus.VERIFIED.value:
            raise ConflictError(
                message=f"Cannot fulfill order with payment status '{order.payment_status}'. Payment must be VERIFIED.",
                code="PAYMENT_NOT_VERIFIED",
            )

        # 2. Invariant: prevent duplicate topup if already completed
        if order.fulfillment_status == FulfillmentStatus.COMPLETED.value:
            logger.warning(f"Order {order.public_order_id} already has COMPLETED fulfillment. Skipping duplicate.")
            res = await self.db.execute(select(ProviderOrder).where(ProviderOrder.order_id == order_id))
            return res.scalars().first()

        # 3. Create or load ProviderOrder
        res = await self.db.execute(select(ProviderOrder).where(ProviderOrder.order_id == order_id))
        provider_order = res.scalars().first()

        client_reference = f"REF-{order.public_order_id}"
        if is_retry and provider_order:
            client_reference = f"REF-{order.public_order_id}-R{provider_order.attempt_count + 1}"

        if not provider_order:
            provider_order = ProviderOrder(
                order_id=order.id,
                provider="mock",
                provider_sku=order.product_sku_snapshot,
                client_reference=client_reference,
                status=FulfillmentStatus.QUEUED.value,
                attempt_count=1,
                submitted_at=utcnow(),
            )
            self.db.add(provider_order)
        else:
            provider_order.attempt_count += 1
            provider_order.client_reference = client_reference
            provider_order.status = FulfillmentStatus.QUEUED.value
            provider_order.submitted_at = utcnow()

        # Update order fulfillment state to PROCESSING
        prev_f_status = order.fulfillment_status
        order.fulfillment_status = FulfillmentStatus.PROCESSING.value
        order.order_status = OrderStatus.PROCESSING.value

        self.db.add(
            OrderStatusHistory(
                order_id=order.id,
                status_type="FULFILLMENT",
                previous_status=prev_f_status,
                new_status=FulfillmentStatus.PROCESSING.value,
                reason="Top-up submitted to provider" if not is_retry else "Fulfillment retry submitted",
                changed_by="SYSTEM",
            )
        )
        await self.db.commit()
        await self.db.refresh(order)
        await self.db.refresh(provider_order)

        # 4. Call provider adapter
        provider = get_active_provider()
        provider_result = await provider.submit_topup(
            player_uid=order.player_uid,
            player_server=order.player_server,
            provider_sku=order.product_sku_snapshot,
            client_reference=client_reference,
            quantity=order.quantity,
        )

        # 5. Map normalized status
        if provider_result.status == ProviderStatus.SUCCESS:
            provider_order.status = FulfillmentStatus.COMPLETED.value
            provider_order.provider_order_id = provider_result.provider_order_id
            provider_order.completed_at = utcnow()
            provider_order.response_payload = (
                json.dumps(provider_result.raw_response) if provider_result.raw_response else None
            )

            order.fulfillment_status = FulfillmentStatus.COMPLETED.value
            order.order_status = OrderStatus.COMPLETED.value
            order.completed_at = utcnow()

            self.db.add(
                OrderStatusHistory(
                    order_id=order.id,
                    status_type="FULFILLMENT",
                    previous_status=FulfillmentStatus.PROCESSING.value,
                    new_status=FulfillmentStatus.COMPLETED.value,
                    reason="Diamonds successfully delivered by provider",
                    changed_by="SYSTEM",
                )
            )

        elif provider_result.status == ProviderStatus.PROCESSING:
            provider_order.status = FulfillmentStatus.PROCESSING.value
            provider_order.provider_order_id = provider_result.provider_order_id
            order.fulfillment_status = FulfillmentStatus.PROCESSING.value

        elif provider_result.status == ProviderStatus.FAILED_TEMPORARY:
            provider_order.status = FulfillmentStatus.FAILED.value
            provider_order.last_error_code = provider_result.error_code
            provider_order.last_error_message = provider_result.error_message

            order.fulfillment_status = FulfillmentStatus.FAILED.value
            # Order stays PAYMENT_VERIFIED so admin can retry
            self.db.add(
                OrderStatusHistory(
                    order_id=order.id,
                    status_type="FULFILLMENT",
                    previous_status=FulfillmentStatus.PROCESSING.value,
                    new_status=FulfillmentStatus.FAILED.value,
                    reason=f"Temporary provider error: {provider_result.error_message}",
                    changed_by="SYSTEM",
                )
            )

        else:  # FAILED_PERMANENT
            provider_order.status = FulfillmentStatus.FAILED.value
            provider_order.last_error_code = provider_result.error_code
            provider_order.last_error_message = provider_result.error_message

            order.fulfillment_status = FulfillmentStatus.FAILED.value
            order.order_status = OrderStatus.FAILED.value

            self.db.add(
                OrderStatusHistory(
                    order_id=order.id,
                    status_type="FULFILLMENT",
                    previous_status=FulfillmentStatus.PROCESSING.value,
                    new_status=FulfillmentStatus.FAILED.value,
                    reason=f"Permanent provider failure: {provider_result.error_message}",
                    changed_by="SYSTEM",
                )
            )

        await self.db.commit()
        await self.db.refresh(order)
        await self.db.refresh(provider_order)
        return provider_order
