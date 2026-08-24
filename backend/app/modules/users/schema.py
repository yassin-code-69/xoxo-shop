from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ProfileRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    auth_user_id: str
    email: str
    full_name: str | None = None
    phone: str | None = None
    avatar_url: str | None = None
    status: str
    is_active: bool
    roles: list[str] = []
    created_at: datetime
    updated_at: datetime


class ProfileUpdate(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    avatar_url: str | None = None


class UserSyncRequest(BaseModel):
    email: str | None = None
    full_name: str | None = None
    avatar_url: str | None = None


class CustomerAdminRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    auth_user_id: str
    email: str
    full_name: str | None = None
    phone: str | None = None
    avatar_url: str | None = None
    status: str
    is_active: bool
    roles: list[str] = []
    total_orders: int = 0
    total_spent: str = "৳ 0.00"
    created_at: datetime


class CustomerAdminCreate(BaseModel):
    email: str = Field(..., min_length=3, max_length=255)
    full_name: str | None = None
    phone: str | None = None
    role: str = "CUSTOMER"
    status: str = "ACTIVE"
    is_active: bool = True


class CustomerAdminUpdate(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    status: str | None = None
    is_active: bool | None = None
    roles: list[str] | None = None
