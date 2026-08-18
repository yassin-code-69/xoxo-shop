from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import AuthenticatedUser, get_current_admin
from app.db.session import get_db
from app.modules.fulfillment.schema import FulfillmentRetryRequest, ProviderOrderRead
from app.modules.fulfillment.service import FulfillmentService
from app.modules.orders.schema import OrderAdminRead, OrderFilterParams
from app.modules.orders.service import OrderService
from app.shared.pagination import PaginatedResponse, PaginationParams

router = APIRouter(prefix="/admin/orders", tags=["Admin Orders"])


@router.get("", response_model=PaginatedResponse[OrderAdminRead])
async def list_admin_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    order_status: str | None = None,
    payment_status: str | None = None,
    fulfillment_status: str | None = None,
    search: str | None = None,
    current_admin: AuthenticatedUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    service = OrderService(db)
    params = PaginationParams(page=page, page_size=page_size)
    filters = OrderFilterParams(
        order_status=order_status,
        payment_status=payment_status,
        fulfillment_status=fulfillment_status,
        search=search,
    )
    return await service.list_admin_orders(params=params, filters=filters)


@router.get("/{public_order_id}", response_model=OrderAdminRead)
async def get_admin_order(
    public_order_id: str,
    current_admin: AuthenticatedUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    service = OrderService(db)
    order = await service.get_by_public_id(public_order_id=public_order_id, is_admin=True)
    return service.map_to_admin_read(order)


@router.post("/{public_order_id}/retry-fulfillment", response_model=ProviderOrderRead)
async def retry_order_fulfillment(
    public_order_id: str,
    data: FulfillmentRetryRequest | None = None,
    current_admin: AuthenticatedUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    order_service = OrderService(db)
    order = await order_service.get_by_public_id(public_order_id=public_order_id, is_admin=True)

    fulfillment_service = FulfillmentService(db)
    provider_order = await fulfillment_service.execute_fulfillment(order_id=order.id, is_retry=True)
    return ProviderOrderRead.model_validate(provider_order)
