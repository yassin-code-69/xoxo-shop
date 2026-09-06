from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import cache
from app.db.session import get_db
from app.modules.products.schema import ProductPublicRead
from app.modules.products.service import ProductService

router = APIRouter(prefix="/products", tags=["Products"])


@router.get("", response_model=list[ProductPublicRead])
async def list_products(
    category: str | None = Query(None, description="Category filter e.g. 'UID Topup', 'Weekly & Monthly'"),
    db: AsyncSession = Depends(get_db),
):
    cache_key = f"public_products_{category or 'all'}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    service = ProductService(db)
    products = await service.list_public_products(category=category)
    data = [ProductPublicRead.model_validate(p) for p in products]
    cache.set(cache_key, data, ttl_seconds=120)
    return data


@router.get("/{id_or_slug}", response_model=ProductPublicRead)
async def get_product(
    id_or_slug: str,
    db: AsyncSession = Depends(get_db),
):
    cache_key = f"public_product_{id_or_slug}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    service = ProductService(db)
    product = await service.get_by_id_or_slug(id_or_slug)
    data = ProductPublicRead.model_validate(product)
    cache.set(cache_key, data, ttl_seconds=120)
    return data

