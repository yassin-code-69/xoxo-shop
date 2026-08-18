from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import AuthenticatedUser, get_current_admin
from app.db.session import get_db
from app.modules.users.schema import CustomerAdminRead
from app.modules.users.service import UserService
from app.shared.pagination import PaginatedResponse, PaginationParams

router = APIRouter(prefix="/admin/customers", tags=["Admin Customers"])


@router.get("", response_model=PaginatedResponse[CustomerAdminRead])
async def list_admin_customers(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    current_admin: AuthenticatedUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    service = UserService(db)
    params = PaginationParams(page=page, page_size=page_size)
    return await service.list_customers(params=params, search=search)
