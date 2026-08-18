import asyncio

from app.core.logging import logger
from app.db.session import AsyncSessionLocal
from app.modules.fulfillment.service import FulfillmentService


async def _run_fulfillment_job(order_id: str, is_retry: bool = False):
    logger.info(f"[Worker] Starting background fulfillment for order {order_id} (retry={is_retry})")
    try:
        async with AsyncSessionLocal() as db:
            service = FulfillmentService(db)
            await service.execute_fulfillment(order_id, is_retry=is_retry)
            logger.info(f"[Worker] Completed background fulfillment for order {order_id}")
    except Exception as e:
        logger.exception(f"[Worker] Unexpected fulfillment failure for order {order_id}: {e!s}")
        # Fail-safe state cleanup
        try:
            async with AsyncSessionLocal() as emergency_db:
                from sqlalchemy import select

                from app.modules.orders.model import Order, OrderStatusHistory
                from app.shared.enums import FulfillmentStatus, OrderStatus

                res = await emergency_db.execute(select(Order).where(Order.id == order_id))
                order = res.scalars().first()
                if order and order.fulfillment_status not in (
                    FulfillmentStatus.COMPLETED.value,
                    FulfillmentStatus.FAILED.value,
                ):
                    order.fulfillment_status = FulfillmentStatus.FAILED.value
                    order.order_status = OrderStatus.FAILED.value
                    emergency_db.add(
                        OrderStatusHistory(
                            order_id=order.id,
                            status_type="FULFILLMENT",
                            previous_status=FulfillmentStatus.QUEUED.value,
                            new_status=FulfillmentStatus.FAILED.value,
                            reason=f"Worker failure: {str(e)[:250]}",
                            changed_by="SYSTEM_WORKER",
                        )
                    )
                    await emergency_db.commit()
                    logger.info(f"[Worker] Emergency state recovery completed for order {order_id}")
        except Exception as db_err:
            logger.critical(f"[Worker] Emergency status recovery failed for order {order_id}: {db_err}", exc_info=True)


def enqueue_fulfillment(order_id: str, is_retry: bool = False):
    """Enqueues async fulfillment task non-blockingly."""
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(_run_fulfillment_job(order_id, is_retry=is_retry))
    except RuntimeError:
        asyncio.run(_run_fulfillment_job(order_id, is_retry=is_retry))
