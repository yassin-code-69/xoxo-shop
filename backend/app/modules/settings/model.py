from sqlalchemy import Boolean, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class SiteSetting(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "site_settings"

    key: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    value: Mapped[str] = mapped_column(Text, nullable=False)
    is_public: Mapped[bool] = mapped_column(Boolean, default=True, index=True, nullable=False)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)
