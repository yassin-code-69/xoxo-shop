from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class ContactMessageCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    email: str = Field(..., min_length=3, max_length=255)
    order_id: str | None = Field(None, max_length=64)
    message: str = Field(..., min_length=5, max_length=5000)


class ContactMessageUpdate(BaseModel):
    status: str | None = Field(None, pattern="^(UNREAD|READ|REPLIED|ARCHIVED)$")
    reply_notes: str | None = None


class ContactMessageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    email: str
    order_id: str | None = None
    message: str
    status: str
    reply_notes: str | None = None
    created_at: datetime
    updated_at: datetime

