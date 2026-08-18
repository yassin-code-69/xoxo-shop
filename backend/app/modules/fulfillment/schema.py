from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ProviderOrderRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    order_id: str
    provider: str
    provider_sku: str
    provider_order_id: str | None = None
    client_reference: str
    status: str
    attempt_count: int
    last_error_code: str | None = None
    last_error_message: str | None = None
    submitted_at: datetime | None = None
    completed_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class FulfillmentRetryRequest(BaseModel):
    reason: str | None = "Admin manual retry"
