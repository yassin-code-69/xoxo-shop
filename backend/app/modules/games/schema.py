from pydantic import BaseModel, ConfigDict


class GameRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    slug: str
    logo_url: str | None = None
    active: bool


class GameCreate(BaseModel):
    name: str
    slug: str
    logo_url: str | None = None
    active: bool = True
