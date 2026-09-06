from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import cache
from app.db.session import get_db
from app.modules.payment_methods.schema import PaymentMethodPublicRead
from app.modules.payment_methods.service import PaymentMethodService

router = APIRouter(prefix="/payment-methods", tags=["Payment Methods"])

CACHE_KEY_PAYMENT_METHODS = "public_payment_methods"


@router.get("", response_model=list[PaymentMethodPublicRead])
async def list_payment_methods(db: AsyncSession = Depends(get_db)):
    cached = cache.get(CACHE_KEY_PAYMENT_METHODS)
    if cached is not None:
        return cached

    service = PaymentMethodService(db)
    methods = await service.list_public_methods()
    data = [PaymentMethodPublicRead.model_validate(m) for m in methods]
    cache.set(CACHE_KEY_PAYMENT_METHODS, data, ttl_seconds=120)
    return data

