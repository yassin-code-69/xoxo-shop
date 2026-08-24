from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.modules.contact.schema import ContactMessageCreate, ContactMessageRead
from app.modules.contact.service import ContactService

router = APIRouter(prefix="/contact", tags=["Contact"])


@router.post("", response_model=ContactMessageRead)
async def submit_contact_message(
    data: ContactMessageCreate,
    db: AsyncSession = Depends(get_db),
):
    service = ContactService(db)
    msg = await service.create_message(data)
    return ContactMessageRead.model_validate(msg)
