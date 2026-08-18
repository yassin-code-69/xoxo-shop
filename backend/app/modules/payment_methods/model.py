from sqlalchemy import Boolean, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class PaymentMethod(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "payment_methods"

    name: Mapped[str] = mapped_column(String(64), nullable=False)  # bKash, Nagad, Rocket
    code: Mapped[str] = mapped_column(String(32), unique=True, index=True, nullable=False)  # BKASH, NAGAD, ROCKET
    type: Mapped[str] = mapped_column(String(32), default="MANUAL", nullable=False)  # MANUAL, GATEWAY
    account_number: Mapped[str] = mapped_column(String(64), nullable=False)
    account_type: Mapped[str] = mapped_column(
        String(32), default="Personal", nullable=False
    )  # Personal, Merchant, Agent
    instructions: Mapped[str] = mapped_column(Text, default="", nullable=False)
    logo_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True, index=True, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    metadata_json: Mapped[str | None] = mapped_column(Text, nullable=True)
