from datetime import UTC, datetime, time
from decimal import Decimal

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import AuthenticatedUser, get_current_admin
from app.db.session import get_db
from app.modules.orders.model import Order
from app.modules.orders.schema import OrderAdminRead
from app.modules.orders.service import OrderService
from app.modules.payments.model import Payment
from app.shared.enums import FulfillmentStatus, OrderStatus, PaymentStatus
from app.shared.money import format_bdt

router = APIRouter(prefix="/admin/dashboard", tags=["Admin Dashboard"])


class DashboardMetrics(BaseModel):
    orders_today: int
    revenue_today: str
    pending_payments: int
    processing_fulfillment: int
    failed_fulfillment: int
    completed_today: int
    recent_orders: list[OrderAdminRead]


@router.get("", response_model=DashboardMetrics)
async def get_admin_dashboard(
    current_admin: AuthenticatedUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    now = datetime.now(UTC)
    today_start = datetime.combine(now.date(), time.min, tzinfo=UTC)

    # 1. Orders today
    orders_today_res = await db.execute(select(func.count(Order.id)).where(Order.created_at >= today_start))
    orders_today = orders_today_res.scalar() or 0

    # 2. Revenue today (from completed or payment-verified orders)
    rev_res = await db.execute(
        select(func.coalesce(func.sum(Order.total_amount), 0)).where(
            (Order.created_at >= today_start) & (Order.payment_status == PaymentStatus.VERIFIED.value)
        )
    )
    revenue_today = rev_res.scalar() or Decimal("0.00")

    # 3. Pending payments (awaiting manual admin verification)
    pending_pay_res = await db.execute(
        select(func.count(Payment.id)).where(Payment.status == PaymentStatus.SUBMITTED.value)
    )
    pending_payments = pending_pay_res.scalar() or 0

    # 4. Processing fulfillments
    proc_ful_res = await db.execute(
        select(func.count(Order.id)).where(Order.fulfillment_status == FulfillmentStatus.PROCESSING.value)
    )
    processing_fulfillment = proc_ful_res.scalar() or 0

    # 5. Failed fulfillments
    failed_ful_res = await db.execute(
        select(func.count(Order.id)).where(Order.fulfillment_status == FulfillmentStatus.FAILED.value)
    )
    failed_fulfillment = failed_ful_res.scalar() or 0

    # 6. Completed today
    comp_today_res = await db.execute(
        select(func.count(Order.id)).where(
            (Order.completed_at >= today_start) & (Order.order_status == OrderStatus.COMPLETED.value)
        )
    )
    completed_today = comp_today_res.scalar() or 0

    # 7. Recent 10 orders
    order_service = OrderService(db)
    recent_query = select(Order).order_by(Order.created_at.desc()).limit(10)
    recent_orders_db = (await db.execute(recent_query)).scalars().all()
    recent_orders = [order_service.map_to_admin_read(o) for o in recent_orders_db]

    return DashboardMetrics(
        orders_today=orders_today,
        revenue_today=format_bdt(revenue_today),
        pending_payments=pending_payments,
        processing_fulfillment=processing_fulfillment,
        failed_fulfillment=failed_fulfillment,
        completed_today=completed_today,
        recent_orders=recent_orders,
    )
