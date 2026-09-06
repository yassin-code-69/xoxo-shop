from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Role(Base):
    __tablename__ = "roles"

    code: Mapped[str] = mapped_column(String(32), primary_key=True)
    name: Mapped[str] = mapped_column(String(64), nullable=False)
    description: Mapped[str] = mapped_column(String(255), default="", nullable=False)


class UserRole(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "user_roles"
    __table_args__ = (UniqueConstraint("user_id", "role_code", name="uq_user_roles_user_id_role_code"),)

    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("profiles.id", ondelete="CASCADE"), index=True, nullable=False
    )
    role_code: Mapped[str] = mapped_column(
        String(32), ForeignKey("roles.code", ondelete="CASCADE"), index=True, nullable=False
    )

    user: Mapped["Profile"] = relationship("Profile", back_populates="roles")
    role: Mapped["Role"] = relationship("Role", lazy="joined")
