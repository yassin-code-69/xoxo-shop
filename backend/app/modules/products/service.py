from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.modules.games.model import Game
from app.modules.products.model import TopupProduct
from app.modules.products.schema import ProductCreate, ProductUpdate
from app.shared.utils import slugify


class ProductService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_default_game(self) -> Game:
        result = await self.db.execute(select(Game).where(Game.slug == "free-fire"))
        game = result.scalars().first()
        if not game:
            game = Game(name="Free Fire", slug="free-fire", active=True)
            self.db.add(game)
            await self.db.flush()
        return game

    async def list_public_products(self, category: str | None = None) -> list[TopupProduct]:
        # If dynamic diamond API mode is enabled and querying UID Topup, check external provider
        if not category or "UID" in category or "Topup" in category:
            try:
                from app.integrations.providers.external import ExternalTopupProviderService
                from app.modules.settings.model import SiteSetting

                mode_res = await self.db.execute(select(SiteSetting).where(SiteSetting.key == "diamond_api_mode"))
                mode = mode_res.scalars().first()

                url_res = await self.db.execute(select(SiteSetting).where(SiteSetting.key == "diamond_api_url"))
                url_setting = url_res.scalars().first()

                if mode and mode.value == "DYNAMIC" and url_setting and url_setting.value:
                    key_res = await self.db.execute(select(SiteSetting).where(SiteSetting.key == "diamond_api_key"))
                    key_setting = key_res.scalars().first()
                    api_key = key_setting.value if key_setting else None

                    ext_packages = await ExternalTopupProviderService.fetch_external_products(
                        api_url=url_setting.value, api_key=api_key
                    )
                    if ext_packages:
                        game = await self.get_default_game()
                        # Map to product objects
                        dynamic_prods = []
                        for i, p in enumerate(ext_packages):
                            # Try to match with existing DB product by slug or SKU to keep IDs stable
                            existing = await self.db.execute(select(TopupProduct).where(TopupProduct.slug == p["slug"]))
                            db_prod = existing.scalars().first()

                            if db_prod:
                                dynamic_prods.append(db_prod)
                            else:
                                # Create in-memory topup product
                                dynamic_prods.append(
                                    TopupProduct(
                                        id=f"ext_{p['slug']}",
                                        game_id=game.id,
                                        name=p["name"],
                                        slug=p["slug"],
                                        category="UID Topup",
                                        diamond_amount=p["diamond_amount"],
                                        bonus_amount=p["bonus_amount"],
                                        selling_price=p["selling_price"],
                                        provider_cost=p["provider_cost"],
                                        provider_sku=p["provider_sku"],
                                        currency="BDT",
                                        active=True,
                                        sort_order=p["sort_order"],
                                        tag=p.get("tag"),
                                    )
                                )
                        if dynamic_prods:
                            return dynamic_prods
            except Exception:
                # Graceful fallback to database products
                pass

        query = select(TopupProduct).where(TopupProduct.active)
        if category:
            query = query.where(TopupProduct.category.ilike(f"%{category}%"))
        query = query.order_by(TopupProduct.sort_order.asc(), TopupProduct.selling_price.asc())
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def list_admin_products(self, active_only: bool | None = None) -> list[TopupProduct]:
        query = select(TopupProduct)
        if active_only is not None:
            query = query.where(TopupProduct.active == active_only)
        query = query.order_by(TopupProduct.sort_order.asc(), TopupProduct.created_at.desc())
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_by_id_or_slug(self, identifier: str) -> TopupProduct:
        result = await self.db.execute(
            select(TopupProduct).where((TopupProduct.id == identifier) | (TopupProduct.slug == identifier))
        )
        product = result.scalars().first()
        if not product:
            raise NotFoundError(message=f"Product '{identifier}' not found", code="PRODUCT_NOT_FOUND")
        return product

    async def create_product(self, data: ProductCreate) -> TopupProduct:
        game_id = data.game_id
        if not game_id:
            game = await self.get_default_game()
            game_id = game.id

        slug = data.slug or slugify(data.name)
        # Check slug uniqueness
        existing = await self.db.execute(select(TopupProduct).where(TopupProduct.slug == slug))
        if existing.scalars().first():
            slug = f"{slug}-{int(func.now())}"

        product = TopupProduct(
            game_id=game_id,
            name=data.name,
            slug=slug,
            category=data.category,
            diamond_amount=data.diamond_amount,
            bonus_amount=data.bonus_amount,
            provider_sku=data.provider_sku,
            selling_price=data.selling_price,
            provider_cost=data.provider_cost,
            currency=data.currency,
            active=data.active,
            featured=data.featured,
            sort_order=data.sort_order,
            tag=data.tag,
        )
        self.db.add(product)
        await self.db.commit()
        await self.db.refresh(product)
        return product

    async def update_product(self, product_id: str, data: ProductUpdate) -> TopupProduct:
        product = await self.get_by_id_or_slug(product_id)
        update_dict = data.model_dump(exclude_unset=True)
        for key, val in update_dict.items():
            setattr(product, key, val)
        await self.db.commit()
        await self.db.refresh(product)
        return product

    async def delete_product(self, product_id: str) -> bool:
        product = await self.get_by_id_or_slug(product_id)
        # Soft-deactivate to preserve historical integrity
        product.active = False
        await self.db.commit()
        return True
