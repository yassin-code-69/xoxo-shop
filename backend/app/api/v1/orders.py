from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.rate_limit import rate_limit
from app.core.security import (
    AuthenticatedUser,
    get_current_user,
)
from app.db.session import get_db
from app.modules.orders.schema import (
    OrderCreateRequest,
    OrderPublicFeedItem,
    OrderPublicRead,
)
from app.modules.orders.service import OrderService
from app.modules.payments.schema import ManualPaymentSubmitRequest, PaymentPublicRead
from app.modules.payments.service import PaymentService
from app.shared.enums import RoleCode
from app.shared.pagination import PaginatedResponse, PaginationParams

router = APIRouter(tags=["Orders & Payments"])


@router.post(
    "/orders", response_model=OrderPublicRead, dependencies=[Depends(rate_limit(max_requests=40, window_seconds=60))]
)
async def create_order(
    data: OrderCreateRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = OrderService(db)
    order = await service.create_order(user_id=current_user.id, data=data)
    return service.map_to_public_read(order)


@router.get("/orders/{public_order_id}", response_model=OrderPublicRead)
async def get_order(
    public_order_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Returns a single order. Orders carry player UIDs and transaction IDs, so this
    always requires authentication and only ever returns the caller's own order."""
    service = OrderService(db)
    is_admin = current_user.has_role(RoleCode.ADMIN, RoleCode.SUPER_ADMIN)
    order = await service.get_by_public_id(
        public_order_id=public_order_id,
        user_id=current_user.id,
        is_admin=is_admin,
    )
    return service.map_to_public_read(order)


@router.post(
    "/orders/{public_order_id}/manual-payment",
    response_model=PaymentPublicRead,
    dependencies=[Depends(rate_limit(max_requests=30, window_seconds=60))],
)
async def submit_manual_payment(
    public_order_id: str,
    data: ManualPaymentSubmitRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    payment_service = PaymentService(db)
    payment = await payment_service.submit_manual_payment(
        public_order_id=public_order_id,
        user_id=current_user.id,
        data=data,
    )
    return PaymentPublicRead.model_validate(payment)


@router.get("/me/orders", response_model=PaginatedResponse[OrderPublicRead])
async def list_my_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = OrderService(db)
    params = PaginationParams(page=page, page_size=page_size)
    return await service.list_my_orders(user_id=current_user.id, params=params)


@router.get(
    "/orders/feed/recent",
    response_model=list[OrderPublicFeedItem],
    dependencies=[Depends(rate_limit(max_requests=60, window_seconds=60))],
)
async def get_public_feed(
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    service = OrderService(db)
    return await service.get_public_feed(limit=limit)
