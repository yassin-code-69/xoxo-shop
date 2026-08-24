from pydantic import BaseModel, ConfigDict


class PaymentMethodPublicRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    code: str
    type: str
    account_number: str
    account_type: str
    instructions: str
    logo_url: str | None = None
    active: bool
    sort_order: int


class PaymentMethodAdminRead(PaymentMethodPublicRead):
    metadata_json: str | None = None


class PaymentMethodUpdate(BaseModel):
    name: str | None = None
    type: str | None = None
    account_number: str | None = None
    account_type: str | None = None
    instructions: str | None = None
    logo_url: str | None = None
    active: bool | None = None
    sort_order: int | None = None
    metadata_json: str | None = None
