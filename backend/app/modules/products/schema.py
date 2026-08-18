from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class ProductPublicRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    game_id: str
    name: str
    slug: str
    category: str
    diamond_amount: int
    bonus_amount: int
    selling_price: Decimal
    currency: str
    active: bool
    featured: bool
    sort_order: int
    tag: str | None = None


class ProductAdminRead(ProductPublicRead):
    provider_sku: str
    provider_cost: Decimal
    metadata_json: str | None = None


class ProductCreate(BaseModel):
    game_id: str | None = None
    name: str
    slug: str | None = None
    category: str = "UID Topup"
    diamond_amount: int = Field(default=0, ge=0)
    bonus_amount: int = Field(default=0, ge=0)
    provider_sku: str
    selling_price: Decimal = Field(..., gt=0)
    provider_cost: Decimal = Field(default=Decimal("0.00"), ge=0)
    currency: str = "BDT"
    active: bool = True
    featured: bool = False
    sort_order: int = 0
    tag: str | None = None


class ProductUpdate(BaseModel):
    name: str | None = None
    slug: str | None = None
    category: str | None = None
    diamond_amount: int | None = None
    bonus_amount: int | None = None
    provider_sku: str | None = None
    selling_price: Decimal | None = None
    provider_cost: Decimal | None = None
    currency: str | None = None
    active: bool | None = None
    featured: bool | None = None
    sort_order: int | None = None
    tag: str | None = None
