import re
from datetime import datetime
from typing import Annotated

from pydantic import AfterValidator, BaseModel, ConfigDict, Field, field_validator

MIN_PASSWORD_LENGTH = 8

# Deliberately simple: enough to reject junk like "admin" or "a@b", without pulling in a
# full RFC 5322 parser. Deliverability is proven by mail, not by a regex.
_EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s.]+(\.[^@\s.]+)+$")


def validate_email(value: str) -> str:
    cleaned = value.strip().lower()
    if not _EMAIL_PATTERN.match(cleaned) or len(cleaned) > 255:
        raise ValueError("Enter a valid email address")
    return cleaned


EmailAddress = Annotated[str, AfterValidator(validate_email)]


def validate_password_strength(value: str) -> str:
    """Rejects the passwords that get broken first: short ones and single-class ones."""
    if len(value) < MIN_PASSWORD_LENGTH:
        raise ValueError(f"Password must be at least {MIN_PASSWORD_LENGTH} characters long")
    if not re.search(r"[A-Za-z]", value) or not re.search(r"\d", value):
        raise ValueError("Password must contain at least one letter and one number")
    return value


class ProfileRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    auth_user_id: str
    email: str
    full_name: str | None = None
    phone: str | None = None
    avatar_url: str | None = None
    status: str
    is_active: bool
    roles: list[str] = []
    created_at: datetime
    updated_at: datetime


class ProfileUpdate(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    avatar_url: str | None = None


class UserSyncRequest(BaseModel):
    email: str | None = None
    full_name: str | None = None
    avatar_url: str | None = None


class CustomerAdminRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    auth_user_id: str
    email: str
    full_name: str | None = None
    phone: str | None = None
    avatar_url: str | None = None
    status: str
    is_active: bool
    roles: list[str] = []
    total_orders: int = 0
    total_spent: str = "৳ 0.00"
    created_at: datetime


class CustomerAdminCreate(BaseModel):
    email: EmailAddress
    full_name: str | None = None
    phone: str | None = None
    role: str = "CUSTOMER"
    status: str = "ACTIVE"
    is_active: bool = True


class CustomerAdminUpdate(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    status: str | None = None
    is_active: bool | None = None
    roles: list[str] | None = None


class UserLoginRequest(BaseModel):
    # Login deliberately keeps the loose password rules: existing accounts must still be
    # able to sign in, and the strength check belongs on the endpoints that set one.
    email: EmailAddress
    password: str = Field(..., min_length=1, max_length=128)


class UserRegisterRequest(BaseModel):
    email: EmailAddress
    password: str = Field(..., max_length=128)
    full_name: str | None = Field(None, max_length=255)
    phone: str | None = Field(None, max_length=32)

    @field_validator("password")
    @classmethod
    def _check_password(cls, value: str) -> str:
        return validate_password_strength(value)


class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: ProfileRead


class ChangePasswordRequest(BaseModel):
    old_password: str = Field(..., min_length=1, max_length=128)
    new_password: str = Field(..., max_length=128)

    @field_validator("new_password")
    @classmethod
    def _check_password(cls, value: str) -> str:
        return validate_password_strength(value)

