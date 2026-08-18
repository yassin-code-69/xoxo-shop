from pydantic import BaseModel, ConfigDict


class SiteSettingRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    key: str
    value: str
    is_public: bool
    description: str | None = None


class SiteSettingUpdate(BaseModel):
    settings: dict[str, str]
