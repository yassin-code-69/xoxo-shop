from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import cache
from app.db.session import get_db
from app.modules.banners.schema import BannerRead
from app.modules.banners.service import BannerService

router = APIRouter(prefix="/banners", tags=["Banners"])

CACHE_KEY_BANNERS = "public_banners"


@router.get("", response_model=list[BannerRead])
async def list_banners(db: AsyncSession = Depends(get_db)):
    cached = cache.get(CACHE_KEY_BANNERS)
    if cached is not None:
        return cached

    service = BannerService(db)
    banners = await service.list_public_banners()
    data = [BannerRead.model_validate(b) for b in banners]
    cache.set(CACHE_KEY_BANNERS, data, ttl_seconds=120)
    return data
