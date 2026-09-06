from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import cache
from app.db.session import get_db
from app.modules.settings.service import SiteSettingService

router = APIRouter(prefix="/settings", tags=["Settings"])

CACHE_KEY_SETTINGS = "public_settings"


@router.get("", response_model=dict[str, str])
async def get_settings(db: AsyncSession = Depends(get_db)):
    cached = cache.get(CACHE_KEY_SETTINGS)
    if cached is not None:
        return cached

    service = SiteSettingService(db)
    data = await service.get_public_settings()
    cache.set(CACHE_KEY_SETTINGS, data, ttl_seconds=120)
    return data

