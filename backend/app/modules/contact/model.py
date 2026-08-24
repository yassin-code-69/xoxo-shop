from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class ContactMessage(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "contact_messages"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    order_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="UNREAD", index=True, nullable=False)  # UNREAD, READ, REPLIED, ARCHIVED
    reply_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
