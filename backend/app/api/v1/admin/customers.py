from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import AuthenticatedUser, get_current_admin
from app.db.session import get_db
from app.modules.audit.service import AuditService
from app.modules.users.schema import CustomerAdminCreate, CustomerAdminRead, CustomerAdminUpdate
from app.modules.users.service import UserService
from app.shared.enums import AuditAction
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


@router.post("", response_model=CustomerAdminRead)
async def create_admin_customer(
    data: CustomerAdminCreate,
    current_admin: AuthenticatedUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    service = UserService(db)
    customer = await service.create_customer_admin(data)

    audit = AuditService(db)
    await audit.log_event(
        action=AuditAction.SETTINGS_UPDATED,
        entity_type="CUSTOMER",
        entity_id=customer.id,
        actor_id=current_admin.id,
        actor_email=current_admin.email,
        metadata={"action": "CREATE_USER", "email": customer.email, "role": data.role},
    )
    await db.commit()
    return customer


@router.patch("/{user_id}", response_model=CustomerAdminRead)
async def update_admin_customer(
    user_id: str,
    data: CustomerAdminUpdate,
    current_admin: AuthenticatedUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    service = UserService(db)
    customer = await service.update_customer_admin(user_id=user_id, data=data)

    audit = AuditService(db)
    await audit.log_event(
        action=AuditAction.SETTINGS_UPDATED,
        entity_type="CUSTOMER",
        entity_id=user_id,
        actor_id=current_admin.id,
        actor_email=current_admin.email,
        metadata={"status": customer.status, "is_active": customer.is_active, "roles": customer.roles},
    )
    await db.commit()
    return customer


@router.delete("/{user_id}")
async def delete_admin_customer(
    user_id: str,
    current_admin: AuthenticatedUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    service = UserService(db)
    await service.delete_customer_admin(user_id)

    audit = AuditService(db)
    await audit.log_event(
        action=AuditAction.SETTINGS_UPDATED,
        entity_type="CUSTOMER",
        entity_id=user_id,
        actor_id=current_admin.id,
        actor_email=current_admin.email,
        metadata={"action": "DELETE_USER", "user_id": user_id},
    )
    await db.commit()
    return {"success": True, "message": f"User '{user_id}' deleted successfully"}
