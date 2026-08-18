from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.modules.settings.service import SiteSettingService

router = APIRouter(prefix="/settings", tags=["Settings"])


@router.get("", response_model=dict[str, str])
async def get_settings(db: AsyncSession = Depends(get_db)):
    service = SiteSettingService(db)
    return await service.get_public_settings()
