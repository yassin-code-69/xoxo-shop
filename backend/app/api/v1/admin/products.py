from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import AuthenticatedUser, get_current_admin
from app.db.session import get_db
from app.modules.audit.service import AuditService
from app.modules.products.schema import ProductAdminRead, ProductCreate, ProductUpdate
from app.modules.products.service import ProductService
from app.shared.enums import AuditAction

router = APIRouter(prefix="/admin/products", tags=["Admin Products"])


@router.get("", response_model=list[ProductAdminRead])
async def list_admin_products(
    active: bool | None = Query(None),
    current_admin: AuthenticatedUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    service = ProductService(db)
    return await service.list_admin_products(active_only=active)


@router.post("", response_model=ProductAdminRead)
async def create_product(
    data: ProductCreate,
    current_admin: AuthenticatedUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    service = ProductService(db)
    product = await service.create_product(data)

    audit = AuditService(db)
    await audit.log_event(
        action=AuditAction.PRODUCT_CREATED,
        entity_type="PRODUCT",
        entity_id=product.id,
        actor_id=current_admin.id,
        actor_email=current_admin.email,
        metadata={"name": product.name, "price": str(product.selling_price)},
    )
    await db.commit()
    return product


@router.patch("/{product_id}", response_model=ProductAdminRead)
async def update_product(
    product_id: str,
    data: ProductUpdate,
    current_admin: AuthenticatedUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    service = ProductService(db)
    product = await service.update_product(product_id=product_id, data=data)

    audit = AuditService(db)
    await audit.log_event(
        action=AuditAction.PRODUCT_UPDATED,
        entity_type="PRODUCT",
        entity_id=product.id,
        actor_id=current_admin.id,
        actor_email=current_admin.email,
        metadata=data.model_dump(exclude_unset=True, mode="json"),
    )
    await db.commit()
    return product


@router.delete("/{product_id}")
async def delete_product(
    product_id: str,
    current_admin: AuthenticatedUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    service = ProductService(db)
    await service.delete_product(product_id)
    return {"status": "success", "message": "Product deactivated successfully"}
