from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.modules.banners.schema import BannerRead
from app.modules.banners.service import BannerService

router = APIRouter(prefix="/banners", tags=["Banners"])


@router.get("", response_model=list[BannerRead])
async def list_banners(db: AsyncSession = Depends(get_db)):
    service = BannerService(db)
    return await service.list_public_banners()
