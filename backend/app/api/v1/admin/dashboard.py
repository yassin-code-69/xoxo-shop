from datetime import UTC, datetime, time, timedelta
from decimal import Decimal
from typing import Any

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import AuthenticatedUser, get_current_admin
from app.db.session import get_db
from app.modules.orders.model import Order
from app.modules.orders.schema import OrderAdminRead
from app.modules.orders.service import OrderService
from app.modules.payment_methods.model import PaymentMethod
from app.modules.payments.model import Payment
from app.modules.products.model import TopupProduct
from app.modules.settings.model import SiteSetting
from app.modules.users.model import Profile
from app.shared.enums import FulfillmentStatus, OrderStatus, PaymentStatus
from app.shared.money import format_bdt

router = APIRouter(prefix="/admin/dashboard", tags=["Admin Dashboard"])


class DashboardMetrics(BaseModel):
    orders_today: int
    revenue_today: str
    total_revenue: str = "৳ 0.00"
    gross_profit: str = "৳ 0.00"
    total_orders: int = 0
    pending_payments: int
    processing_fulfillment: int
    failed_fulfillment: int
    completed_today: int
    active_customers: int = 0
    gateway_status: dict[str, Any] = {}
    recent_orders: list[OrderAdminRead]


class AnalyticsDataPoint(BaseModel):
    label: str
    date: str
    revenue: float
    orders: int
    diamonds: int


class DistributionItem(BaseModel):
    name: str
    count: int
    revenue: float
    percentage: float


class AnalyticsSummary(BaseModel):
    total_revenue: float
    total_orders: int
    avg_order_value: float
    success_rate: float
    growth_rate: float
    completed_orders: int
    pending_orders: int
    failed_orders: int
    total_diamonds: int
    days_pnl: float


class DashboardAnalyticsResponse(BaseModel):
    timeframe: str
    summary: AnalyticsSummary
    timeseries: list[AnalyticsDataPoint]
    category_distribution: list[DistributionItem]
    payment_distribution: list[DistributionItem]


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

    # 2. Total orders (All-time)
    total_orders_res = await db.execute(select(func.count(Order.id)))
    total_orders = total_orders_res.scalar() or 0

    # 3. Revenue today (from completed or payment-verified orders)
    rev_res = await db.execute(
        select(func.coalesce(func.sum(Order.total_amount), 0)).where(
            (Order.created_at >= today_start)
            & (Order.payment_status.in_([PaymentStatus.VERIFIED.value, PaymentStatus.SUBMITTED.value]))
        )
    )
    revenue_today = rev_res.scalar() or Decimal("0.00")

    # 4. Total revenue (All-time)
    total_rev_res = await db.execute(
        select(func.coalesce(func.sum(Order.total_amount), 0)).where(
            Order.payment_status.in_([PaymentStatus.VERIFIED.value, PaymentStatus.SUBMITTED.value])
        )
    )
    total_revenue = total_rev_res.scalar() or Decimal("0.00")

    # 5. Gross profit = SUM(selling_price - provider_cost) for verified orders
    # Calculate using product provider cost if available
    profit_res = await db.execute(
        select(
            func.coalesce(
                func.sum(
                    Order.total_amount - func.coalesce(TopupProduct.provider_cost * Order.quantity, Order.total_amount * Decimal("0.87"))
                ),
                0,
            )
        )
        .select_from(Order)
        .outerjoin(TopupProduct, Order.product_id == TopupProduct.id)
        .where(Order.payment_status.in_([PaymentStatus.VERIFIED.value, PaymentStatus.SUBMITTED.value]))
    )
    gross_profit = profit_res.scalar() or Decimal("0.00")

    # 6. Pending payments
    pending_pay_res = await db.execute(
        select(func.count(Payment.id)).where(Payment.status == PaymentStatus.SUBMITTED.value)
    )
    pending_payments = pending_pay_res.scalar() or 0

    # 7. Processing fulfillment
    proc_res = await db.execute(
        select(func.count(Order.id)).where(Order.fulfillment_status == FulfillmentStatus.PROCESSING.value)
    )
    processing_fulfillment = proc_res.scalar() or 0

    # 8. Failed fulfillment
    fail_res = await db.execute(
        select(func.count(Order.id)).where(Order.fulfillment_status == FulfillmentStatus.FAILED.value)
    )
    failed_fulfillment = fail_res.scalar() or 0

    # 9. Completed today
    comp_res = await db.execute(
        select(func.count(Order.id)).where(
            (Order.completed_at >= today_start) & (Order.order_status == OrderStatus.COMPLETED.value)
        )
    )
    completed_today = comp_res.scalar() or 0

    # 10. Active customers count
    customers_res = await db.execute(
        select(func.count(Profile.id)).where((Profile.status == "ACTIVE") & (Profile.is_active == True))  # noqa: E712
    )
    active_customers = customers_res.scalar() or 0

    # 11. Gateway Health & Diamond Provider Status
    # bKash
    bkash_method = (await db.execute(select(PaymentMethod).where(PaymentMethod.code == "BKASH"))).scalars().first()
    bkash_active = bool(bkash_method.active) if bkash_method else False
    bkash_mode = bkash_method.type if bkash_method else "MANUAL"
    bkash_account = bkash_method.account_number if bkash_method else settings.BKASH_USERNAME

    # Nagad
    nagad_method = (await db.execute(select(PaymentMethod).where(PaymentMethod.code == "NAGAD"))).scalars().first()
    nagad_active = bool(nagad_method.active) if nagad_method else False
    nagad_mode = nagad_method.type if nagad_method else "MANUAL"
    nagad_account = nagad_method.account_number if nagad_method else settings.NAGAD_MERCHANT_ID

    # Diamond Provider
    provider_mode_setting = (
        await db.execute(select(SiteSetting).where(SiteSetting.key == "diamond_api_mode"))
    ).scalars().first()
    provider_mode = provider_mode_setting.value if provider_mode_setting else "LOCAL"

    gateway_status = {
        "bkash": {
            "name": "bKash",
            "active": bkash_active,
            "mode": bkash_mode,
            "account": bkash_account,
            "is_configured": bool(settings.BKASH_APP_KEY or bkash_account),
        },
        "nagad": {
            "name": "Nagad",
            "active": nagad_active,
            "mode": nagad_mode,
            "account": nagad_account,
            "is_configured": bool(settings.NAGAD_MERCHANT_ID or nagad_account),
        },
        "diamond_provider": {
            "provider": settings.PROVIDER_NAME,
            "mode": provider_mode,
            "connected": True,
            "api_url": settings.PROVIDER_API_BASE_URL,
        },
    }

    # 12. Recent 5 orders
    order_service = OrderService(db)
    recent_orders = await order_service.list_recent_admin_orders(limit=5)

    return DashboardMetrics(
        orders_today=orders_today,
        revenue_today=format_bdt(revenue_today),
        total_revenue=format_bdt(total_revenue),
        gross_profit=format_bdt(gross_profit),
        total_orders=total_orders,
        pending_payments=pending_payments,
        processing_fulfillment=processing_fulfillment,
        failed_fulfillment=failed_fulfillment,
        completed_today=completed_today,
        active_customers=active_customers,
        gateway_status=gateway_status,
        recent_orders=recent_orders,
    )


def to_utc(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=UTC)
    return dt.astimezone(UTC)


@router.get("/analytics", response_model=DashboardAnalyticsResponse)
async def get_dashboard_analytics(
    timeframe: str = Query("1W", description="Timeframe: 1D, 1W, 1M, 1Y, ALL"),
    current_admin: AuthenticatedUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    now = datetime.now(UTC)
    tf = timeframe.upper()

    # Determine start date and bucket strategy
    if tf == "1D":
        start_date = datetime.combine(now.date(), time.min, tzinfo=UTC)
        prev_start_date = start_date - timedelta(days=1)
        prev_end_date = start_date
        bucket_type = "hour"
    elif tf == "1W":
        start_date = (now - timedelta(days=7)).replace(hour=0, minute=0, second=0, microsecond=0)
        prev_start_date = start_date - timedelta(days=7)
        prev_end_date = start_date
        bucket_type = "day"
    elif tf == "1M":
        start_date = (now - timedelta(days=30)).replace(hour=0, minute=0, second=0, microsecond=0)
        prev_start_date = start_date - timedelta(days=30)
        prev_end_date = start_date
        bucket_type = "day"
    elif tf == "1Y":
        start_date = (now - timedelta(days=365)).replace(hour=0, minute=0, second=0, microsecond=0)
        prev_start_date = start_date - timedelta(days=365)
        prev_end_date = start_date
        bucket_type = "month"
    else:  # "ALL"
        start_date = datetime(2025, 1, 1, tzinfo=UTC)
        prev_start_date = datetime(2024, 1, 1, tzinfo=UTC)
        prev_end_date = start_date
        bucket_type = "month"

    # Fetch orders in period
    orders_res = await db.execute(select(Order).where(Order.created_at >= start_date).order_by(Order.created_at.asc()))
    period_orders = list(orders_res.scalars().all())

    # Fetch previous period orders for growth comparison
    prev_orders_res = await db.execute(
        select(Order).where((Order.created_at >= prev_start_date) & (Order.created_at < prev_end_date))
    )
    prev_orders = list(prev_orders_res.scalars().all())

    # Calculate Summary KPIs strictly from real data
    total_rev = sum(
        float(o.total_amount) for o in period_orders if o.payment_status in ["VERIFIED", "SUBMITTED", "PENDING"]
    )
    prev_rev = sum(
        float(o.total_amount) for o in prev_orders if o.payment_status in ["VERIFIED", "SUBMITTED", "PENDING"]
    )
    total_orders = len(period_orders)

    avg_order_value = (total_rev / total_orders) if total_orders > 0 else 0.0
    completed_orders = sum(1 for o in period_orders if o.order_status == OrderStatus.COMPLETED.value)
    pending_orders = sum(
        1
        for o in period_orders
        if o.order_status in [OrderStatus.PENDING_PAYMENT.value, OrderStatus.PAYMENT_SUBMITTED.value]
    )
    failed_orders = sum(1 for o in period_orders if o.order_status == OrderStatus.FAILED.value)
    total_diamonds = sum(o.diamond_amount_snapshot or 0 for o in period_orders)

    success_rate = ((completed_orders / total_orders) * 100.0) if total_orders > 0 else 100.0
    growth_rate = (((total_rev - prev_rev) / prev_rev) * 100.0) if prev_rev > 0 else (100.0 if total_rev > 0 else 0.0)

    # Days PnL (Today's revenue)
    today_start = datetime.combine(now.date(), time.min, tzinfo=UTC)
    today_rev = sum(float(o.total_amount) for o in period_orders if o.created_at and to_utc(o.created_at) >= today_start)

    # Generate Timeseries Buckets
    timeseries: list[AnalyticsDataPoint] = []
    if bucket_type == "hour":
        for h in range(24):
            b_time = today_start + timedelta(hours=h)
            b_end = b_time + timedelta(hours=1)
            b_orders = [o for o in period_orders if o.created_at and (b_time <= to_utc(o.created_at) < b_end)]
            b_rev = sum(float(o.total_amount) for o in b_orders)
            b_dia = sum(o.diamond_amount_snapshot or 0 for o in b_orders)
            timeseries.append(
                AnalyticsDataPoint(
                    label=f"{h:02d}:00",
                    date=b_time.strftime("%Y-%m-%d %H:%M"),
                    revenue=round(b_rev, 2),
                    orders=len(b_orders),
                    diamonds=b_dia,
                )
            )
    elif bucket_type == "day":
        days = 7 if tf == "1W" else 30
        for d in range(days):
            b_time = (now - timedelta(days=days - 1 - d)).replace(hour=0, minute=0, second=0, microsecond=0)
            b_end = b_time + timedelta(days=1)
            b_orders = [o for o in period_orders if o.created_at and (b_time <= to_utc(o.created_at) < b_end)]
            b_rev = sum(float(o.total_amount) for o in b_orders)
            b_dia = sum(o.diamond_amount_snapshot or 0 for o in b_orders)
            timeseries.append(
                AnalyticsDataPoint(
                    label=b_time.strftime("%a") if tf == "1W" else b_time.strftime("%d %b"),
                    date=b_time.strftime("%Y-%m-%d"),
                    revenue=round(b_rev, 2),
                    orders=len(b_orders),
                    diamonds=b_dia,
                )
            )
    else:  # month
        for m in range(12):
            b_time = (now - timedelta(days=(11 - m) * 30)).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            b_end = (b_time + timedelta(days=32)).replace(day=1)
            b_orders = [o for o in period_orders if o.created_at and (b_time <= to_utc(o.created_at) < b_end)]
            b_rev = sum(float(o.total_amount) for o in b_orders)
            b_dia = sum(o.diamond_amount_snapshot or 0 for o in b_orders)
            timeseries.append(
                AnalyticsDataPoint(
                    label=b_time.strftime("%b"),
                    date=b_time.strftime("%Y-%m"),
                    revenue=round(b_rev, 2),
                    orders=len(b_orders),
                    diamonds=b_dia,
                )
            )

    # Category Distribution (Real data only)
    cat_counts: dict[str, dict[str, Any]] = {}
    for o in period_orders:
        cat_name = "UID Topup"
        product_name = o.product_name_snapshot or ""
        if "Weekly" in product_name or "Monthly" in product_name:
            cat_name = "Weekly & Monthly"
        elif "Level" in product_name:
            cat_name = "Level Up Pass"
        elif "Lite" in product_name:
            cat_name = "Weekly Lite"
        elif "Like" in product_name:
            cat_name = "FF Likes"

        if cat_name not in cat_counts:
            cat_counts[cat_name] = {"count": 0, "revenue": 0.0}
        cat_counts[cat_name]["count"] += 1
        cat_counts[cat_name]["revenue"] += float(o.total_amount)

    total_cat_rev = sum(c["revenue"] for c in cat_counts.values()) or 1.0
    category_distribution = [
        DistributionItem(
            name=name,
            count=info["count"],
            revenue=round(info["revenue"], 2),
            percentage=round((info["revenue"] / total_cat_rev) * 100, 1),
        )
        for name, info in cat_counts.items()
    ]

    # Payment Methods Distribution (Real data only)
    pm_counts: dict[str, dict[str, Any]] = {}
    for o in period_orders:
        pm_code = o.payment_method_code or "BKASH"
        if pm_code not in pm_counts:
            pm_counts[pm_code] = {"count": 0, "revenue": 0.0}
        pm_counts[pm_code]["count"] += 1
        pm_counts[pm_code]["revenue"] += float(o.total_amount)

    total_pm_rev = sum(p["revenue"] for p in pm_counts.values()) or 1.0
    payment_distribution = [
        DistributionItem(
            name=name,
            count=info["count"],
            revenue=round(info["revenue"], 2),
            percentage=round((info["revenue"] / total_pm_rev) * 100, 1),
        )
        for name, info in pm_counts.items()
    ]

    summary = AnalyticsSummary(
        total_revenue=round(total_rev, 2),
        total_orders=total_orders,
        avg_order_value=round(avg_order_value, 2),
        success_rate=round(success_rate, 1),
        growth_rate=round(growth_rate, 1),
        completed_orders=completed_orders,
        pending_orders=pending_orders,
        failed_orders=failed_orders,
        total_diamonds=total_diamonds,
        days_pnl=round(today_rev, 2),
    )

    return DashboardAnalyticsResponse(
        timeframe=tf,
        summary=summary,
        timeseries=timeseries,
        category_distribution=category_distribution,
        payment_distribution=payment_distribution,
    )
