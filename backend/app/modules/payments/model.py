from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Index, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.shared.enums import PaymentStatus, PaymentType


class Payment(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "payments"
    __table_args__ = (Index("ix_payments_trx_status", "transaction_id", "status"),)

    order_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("orders.id", ondelete="CASCADE"), unique=True, index=True, nullable=False
    )
    payment_type: Mapped[str] = mapped_column(String(32), default=PaymentType.MANUAL.value, nullable=False)
    payment_method: Mapped[str] = mapped_column(String(32), nullable=False)  # BKASH, NAGAD, ROCKET
    gateway: Mapped[str | None] = mapped_column(String(64), nullable=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(8), default="BDT", nullable=False)

    transaction_id: Mapped[str | None] = mapped_column(String(128), index=True, nullable=True)
    sender_number: Mapped[str | None] = mapped_column(String(32), nullable=True)
    proof_path: Mapped[str | None] = mapped_column(String(512), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default=PaymentStatus.PENDING.value, index=True, nullable=False)

    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    verified_by: Mapped[str | None] = mapped_column(String(64), nullable=True)  # admin user_id / email
    rejection_reason: Mapped[str | None] = mapped_column(String(255), nullable=True)

    order: Mapped["Order"] = relationship("Order", back_populates="payment")
    attempts: Mapped[list["PaymentAttempt"]] = relationship(
        "PaymentAttempt", back_populates="payment", lazy="selectin", cascade="all, delete-orphan"
    )


class PaymentAttempt(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "payment_attempts"

    payment_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("payments.id", ondelete="CASCADE"), index=True, nullable=False
    )
    gateway: Mapped[str] = mapped_column(String(64), nullable=False)
    gateway_session_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    gateway_transaction_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    attempt_number: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="INITIATED", nullable=False)
    request_payload: Mapped[str | None] = mapped_column(Text, nullable=True)
    response_payload: Mapped[str | None] = mapped_column(Text, nullable=True)

    payment: Mapped["Payment"] = relationship("Payment", back_populates="attempts")
