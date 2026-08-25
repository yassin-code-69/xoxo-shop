from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.rate_limit import rate_limit
from app.db.session import get_db
from app.modules.contact.schema import ContactMessageCreate, ContactMessageRead
from app.modules.contact.service import ContactService

router = APIRouter(prefix="/contact", tags=["Contact"])


@router.post(
    "",
    response_model=ContactMessageRead,
    dependencies=[Depends(rate_limit(max_requests=5, window_seconds=600))],
)
async def submit_contact_message(
    data: ContactMessageCreate,
    db: AsyncSession = Depends(get_db),
):
    service = ContactService(db)
    msg = await service.create_message(data)
    return ContactMessageRead.model_validate(msg)
