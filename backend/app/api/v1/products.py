from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.modules.products.schema import ProductPublicRead
from app.modules.products.service import ProductService

router = APIRouter(prefix="/products", tags=["Products"])


@router.get("", response_model=list[ProductPublicRead])
async def list_products(
    category: str | None = Query(None, description="Category filter e.g. 'UID Topup', 'Weekly & Monthly'"),
    db: AsyncSession = Depends(get_db),
):
    service = ProductService(db)
    return await service.list_public_products(category=category)


@router.get("/{id_or_slug}", response_model=ProductPublicRead)
async def get_product(
    id_or_slug: str,
    db: AsyncSession = Depends(get_db),
):
    service = ProductService(db)
    return await service.get_by_id_or_slug(id_or_slug)
