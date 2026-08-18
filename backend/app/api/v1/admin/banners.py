from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import AuthenticatedUser, get_current_admin
from app.db.session import get_db
from app.modules.banners.schema import BannerCreate, BannerRead, BannerUpdate
from app.modules.banners.service import BannerService

router = APIRouter(prefix="/admin/banners", tags=["Admin Banners"])


@router.get("", response_model=list[BannerRead])
async def list_admin_banners(
    current_admin: AuthenticatedUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    service = BannerService(db)
    return await service.list_admin_banners()


@router.post("", response_model=BannerRead)
async def create_banner(
    data: BannerCreate,
    current_admin: AuthenticatedUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    service = BannerService(db)
    return await service.create_banner(data)


@router.patch("/{banner_id}", response_model=BannerRead)
async def update_banner(
    banner_id: str,
    data: BannerUpdate,
    current_admin: AuthenticatedUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    service = BannerService(db)
    return await service.update_banner(banner_id=banner_id, data=data)


@router.delete("/{banner_id}")
async def delete_banner(
    banner_id: str,
    current_admin: AuthenticatedUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    service = BannerService(db)
    await service.delete_banner(banner_id=banner_id)
    return {"status": "success"}
