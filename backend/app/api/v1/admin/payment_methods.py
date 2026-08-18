from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import AuthenticatedUser, get_current_admin
from app.db.session import get_db
from app.modules.audit.service import AuditService
from app.modules.payment_methods.schema import (
    PaymentMethodAdminRead,
    PaymentMethodUpdate,
)
from app.modules.payment_methods.service import PaymentMethodService
from app.shared.enums import AuditAction

router = APIRouter(prefix="/admin/payment-methods", tags=["Admin Payment Methods"])


@router.get("", response_model=list[PaymentMethodAdminRead])
async def list_admin_payment_methods(
    current_admin: AuthenticatedUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    service = PaymentMethodService(db)
    return await service.list_admin_methods()


@router.patch("/{method_id}", response_model=PaymentMethodAdminRead)
async def update_payment_method(
    method_id: str,
    data: PaymentMethodUpdate,
    current_admin: AuthenticatedUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    service = PaymentMethodService(db)
    method = await service.update_method(method_id=method_id, data=data)

    audit = AuditService(db)
    await audit.log_event(
        action=AuditAction.PAYMENT_METHOD_UPDATED,
        entity_type="PAYMENT_METHOD",
        entity_id=method.id,
        actor_id=current_admin.id,
        actor_email=current_admin.email,
        metadata={"code": method.code, "account_number": method.account_number, "active": method.active},
    )
    await db.commit()
    return method
