from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.modules.fulfillment.schema import ProviderOrderRead


class OrderCreateRequest(BaseModel):
    product_id: str
    player_uid: str = Field(
        ...,
        min_length=3,
        max_length=64,
        pattern=r"^[a-zA-Z0-9_\-]+$",
        description="Free Fire Player UID (alphanumeric, underscores, hyphens only)",
    )
    player_server: str | None = Field(default=None, max_length=64)
    quantity: int = Field(default=1, ge=1, le=10)
    payment_method: str = Field(default="BKASH", description="Payment method code: BKASH, NAGAD, ROCKET")


class OrderStatusHistoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    status_type: str
    previous_status: str | None = None
    new_status: str
    reason: str | None = None
    changed_by: str
    created_at: datetime


class OrderPublicRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    public_order_id: str
    product_name: str
    diamond_amount: int
    bonus_amount: int
    player_uid: str
    player_server: str | None = None
    quantity: int
    total_amount: Decimal
    currency: str
    order_status: str
    payment_status: str
    fulfillment_status: str
    payment_method_code: str
    payment_transaction_id: str | None = None
    payment_sender_number: str | None = None
    created_at: datetime
    completed_at: datetime | None = None
    status_history: list[OrderStatusHistoryRead] = []


class OrderPublicFeedItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    customer_display_name: str
    product_name: str
    total_amount: Decimal
    order_status: str
    created_at: datetime


class OrderAdminRead(OrderPublicRead):
    user_id: str
    customer_email: str | None = None
    customer_name: str | None = None
    product_sku: str
    selling_price: Decimal
    provider_order: ProviderOrderRead | None = None


class OrderFilterParams(BaseModel):
    order_status: str | None = None
    payment_status: str | None = None
    fulfillment_status: str | None = None
    search: str | None = None
    start_date: datetime | None = None
    end_date: datetime | None = None
