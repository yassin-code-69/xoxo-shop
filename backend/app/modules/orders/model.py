from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.modules.fulfillment.model import ProviderOrder  # noqa: F401
from app.modules.payments.model import Payment  # noqa: F401
from app.modules.users.model import Profile  # noqa: F401
from app.shared.enums import FulfillmentStatus, OrderStatus, PaymentStatus
from app.shared.time import utcnow


class Order(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "orders"

    public_order_id: Mapped[str] = mapped_column(String(32), unique=True, index=True, nullable=False)
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("profiles.id", ondelete="CASCADE"), index=True, nullable=False
    )
    game_id: Mapped[str] = mapped_column(String(36), ForeignKey("games.id"), nullable=False)
    product_id: Mapped[str] = mapped_column(String(36), ForeignKey("topup_products.id"), nullable=False)

    # Immutability snapshots
    product_name_snapshot: Mapped[str] = mapped_column(String(255), nullable=False)
    product_sku_snapshot: Mapped[str] = mapped_column(String(128), nullable=False)
    diamond_amount_snapshot: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    bonus_amount_snapshot: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    selling_price_snapshot: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)

    # Customer & account info
    player_uid: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    player_server: Mapped[str | None] = mapped_column(String(64), nullable=True)
    quantity: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(8), default="BDT", nullable=False)

    # State machines
    order_status: Mapped[str] = mapped_column(
        String(32), default=OrderStatus.PENDING_PAYMENT.value, index=True, nullable=False
    )
    payment_status: Mapped[str] = mapped_column(
        String(32), default=PaymentStatus.PENDING.value, index=True, nullable=False
    )
    fulfillment_status: Mapped[str] = mapped_column(
        String(32), default=FulfillmentStatus.NOT_STARTED.value, index=True, nullable=False
    )
    payment_method_code: Mapped[str] = mapped_column(String(32), default="BKASH", nullable=False)

    # Timestamps
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    user: Mapped["Profile"] = relationship("Profile", back_populates="orders", lazy="selectin")
    payment: Mapped[Optional["Payment"]] = relationship(
        "Payment", back_populates="order", uselist=False, lazy="selectin"
    )
    provider_order: Mapped[Optional["ProviderOrder"]] = relationship(
        "ProviderOrder", back_populates="order", uselist=False, lazy="selectin"
    )
    status_history: Mapped[list["OrderStatusHistory"]] = relationship(
        "OrderStatusHistory", back_populates="order", lazy="selectin", cascade="all, delete-orphan"
    )


class OrderStatusHistory(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "order_status_history"

    order_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("orders.id", ondelete="CASCADE"), index=True, nullable=False
    )
    status_type: Mapped[str] = mapped_column(String(32), nullable=False)  # "ORDER", "PAYMENT", "FULFILLMENT"
    previous_status: Mapped[str | None] = mapped_column(String(32), nullable=True)
    new_status: Mapped[str] = mapped_column(String(32), nullable=False)
    reason: Mapped[str | None] = mapped_column(String(255), nullable=True)
    changed_by: Mapped[str] = mapped_column(String(64), default="SYSTEM", nullable=False)
    metadata_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    order: Mapped["Order"] = relationship("Order", back_populates="status_history")
