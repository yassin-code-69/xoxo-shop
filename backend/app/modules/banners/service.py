from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.modules.banners.model import Banner
from app.modules.banners.schema import BannerCreate, BannerUpdate


class BannerService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_public_banners(self) -> list[Banner]:
        query = select(Banner).where(Banner.active).order_by(Banner.sort_order.asc())
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def list_admin_banners(self) -> list[Banner]:
        query = select(Banner).order_by(Banner.sort_order.asc(), Banner.created_at.desc())
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def create_banner(self, data: BannerCreate) -> Banner:
        banner = Banner(
            title=data.title,
            subtitle=data.subtitle,
            image_url=data.image_url,
            link_url=data.link_url,
            active=data.active,
            sort_order=data.sort_order,
        )
        self.db.add(banner)
        await self.db.commit()
        await self.db.refresh(banner)
        return banner

    async def update_banner(self, banner_id: str, data: BannerUpdate) -> Banner:
        res = await self.db.execute(select(Banner).where(Banner.id == banner_id))
        banner = res.scalars().first()
        if not banner:
            raise NotFoundError(message="Banner not found", code="BANNER_NOT_FOUND")
        for key, val in data.model_dump(exclude_unset=True).items():
            setattr(banner, key, val)
        await self.db.commit()
        await self.db.refresh(banner)
        return banner

    async def delete_banner(self, banner_id: str) -> bool:
        res = await self.db.execute(select(Banner).where(Banner.id == banner_id))
        banner = res.scalars().first()
        if not banner:
            raise NotFoundError(message="Banner not found", code="BANNER_NOT_FOUND")
        await self.db.delete(banner)
        await self.db.commit()
        return True
