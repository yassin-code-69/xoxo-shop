from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import AuthenticatedUser, get_current_admin
from app.db.session import get_db
from app.modules.contact.schema import ContactMessageRead, ContactMessageUpdate
from app.modules.contact.service import ContactService
from app.shared.pagination import PaginatedResponse, PaginationParams

router = APIRouter(prefix="/admin/contact-messages", tags=["Admin Contact Messages"])


@router.get("", response_model=PaginatedResponse[ContactMessageRead])
async def list_admin_contact_messages(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: str | None = None,
    search: str | None = None,
    current_admin: AuthenticatedUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    service = ContactService(db)
    params = PaginationParams(page=page, page_size=page_size)
    return await service.list_admin_messages(
        params=params,
        status_filter=status,
        search=search,
    )


@router.get("/{message_id}", response_model=ContactMessageRead)
async def get_admin_contact_message(
    message_id: str,
    current_admin: AuthenticatedUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    service = ContactService(db)
    msg = await service.get_message(message_id)
    return ContactMessageRead.model_validate(msg)


@router.patch("/{message_id}", response_model=ContactMessageRead)
async def update_admin_contact_message(
    message_id: str,
    data: ContactMessageUpdate,
    current_admin: AuthenticatedUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    service = ContactService(db)
    msg = await service.update_message(message_id, data)
    return ContactMessageRead.model_validate(msg)


@router.delete("/{message_id}")
async def delete_admin_contact_message(
    message_id: str,
    current_admin: AuthenticatedUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    service = ContactService(db)
    await service.delete_message(message_id)
    return {"success": True, "message": f"Message '{message_id}' deleted successfully"}
