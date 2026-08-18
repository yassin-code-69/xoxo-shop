from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import AuthenticatedUser, get_current_admin
from app.db.session import get_db
from app.modules.payments.schema import (
    PaymentAdminRead,
    PaymentApproveRequest,
    PaymentRejectRequest,
)
from app.modules.payments.service import PaymentService
from app.shared.pagination import PaginatedResponse, PaginationParams

router = APIRouter(prefix="/admin/payments", tags=["Admin Payments"])


@router.get("", response_model=PaginatedResponse[PaymentAdminRead])
async def list_admin_payments(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: str | None = None,
    method: str | None = None,
    search: str | None = None,
    current_admin: AuthenticatedUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    service = PaymentService(db)
    params = PaginationParams(page=page, page_size=page_size)
    return await service.list_admin_payments(
        params=params,
        status_filter=status,
        method_filter=method,
        search=search,
    )


@router.post("/{payment_id}/approve", response_model=PaymentAdminRead)
async def approve_payment(
    payment_id: str,
    data: PaymentApproveRequest | None = None,
    current_admin: AuthenticatedUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    service = PaymentService(db)
    payment = await service.approve_manual_payment(
        payment_id=payment_id,
        admin_id=current_admin.id,
        admin_email=current_admin.email,
        data=data,
    )
    return PaymentAdminRead.model_validate(payment)


@router.post("/{payment_id}/reject", response_model=PaymentAdminRead)
async def reject_payment(
    payment_id: str,
    data: PaymentRejectRequest,
    current_admin: AuthenticatedUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    service = PaymentService(db)
    payment = await service.reject_manual_payment(
        payment_id=payment_id,
        admin_id=current_admin.id,
        admin_email=current_admin.email,
        data=data,
    )
    return PaymentAdminRead.model_validate(payment)
