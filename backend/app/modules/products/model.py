from decimal import Decimal

from sqlalchemy import Boolean, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class TopupProduct(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "topup_products"

    game_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("games.id", ondelete="CASCADE"), index=True, nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    category: Mapped[str] = mapped_column(
        String(64), default="UID Topup", nullable=False
    )  # e.g. "UID Topup", "Weekly & Monthly", "Special"
    diamond_amount: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    bonus_amount: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    provider_sku: Mapped[str] = mapped_column(String(128), nullable=False)
    selling_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    provider_cost: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0.00"), nullable=False)
    currency: Mapped[str] = mapped_column(String(8), default="BDT", nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True, index=True, nullable=False)
    featured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    tag: Mapped[str | None] = mapped_column(String(32), nullable=True)  # e.g. "Hot", "Fast", "Value"
    metadata_json: Mapped[str | None] = mapped_column(Text, nullable=True)

    game: Mapped["Game"] = relationship("Game", back_populates="products")
