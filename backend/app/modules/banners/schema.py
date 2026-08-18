from datetime import datetime

from pydantic import BaseModel, ConfigDict


class BannerRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    subtitle: str | None = None
    image_url: str
    link_url: str | None = None
    active: bool
    sort_order: int
    created_at: datetime


class BannerCreate(BaseModel):
    title: str
    subtitle: str | None = None
    image_url: str
    link_url: str | None = None
    active: bool = True
    sort_order: int = 0


class BannerUpdate(BaseModel):
    title: str | None = None
    subtitle: str | None = None
    image_url: str | None = None
    link_url: str | None = None
    active: bool | None = None
    sort_order: int | None = None
