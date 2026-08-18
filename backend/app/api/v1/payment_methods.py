from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.modules.payment_methods.schema import PaymentMethodPublicRead
from app.modules.payment_methods.service import PaymentMethodService

router = APIRouter(prefix="/payment-methods", tags=["Payment Methods"])


@router.get("", response_model=list[PaymentMethodPublicRead])
async def list_payment_methods(db: AsyncSession = Depends(get_db)):
    service = PaymentMethodService(db)
    return await service.list_public_methods()
