import hashlib
import hmac
import secrets
from datetime import UTC, datetime, timedelta

import jwt
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import ForbiddenError, UnauthorizedError
from app.db.session import get_db
from app.modules.roles.model import UserRole
from app.modules.users.model import Profile
from app.shared.enums import RoleCode

security_scheme = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    """Secure PBKDF2-SHA256 password hashing with random 16-byte salt."""
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100_000)
    return f"pbkdf2_sha256${salt}${key.hex()}"


def verify_password(plain_password: str, hashed_password: str | None) -> bool:
    """Verify plain password against hashed password."""
    if not hashed_password or not hashed_password.startswith("pbkdf2_sha256$"):
        return False
    try:
        parts = hashed_password.split("$")
        if len(parts) != 3:
            return False
        _, salt, key_hex = parts
        key = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt.encode("utf-8"), 100_000)
        return hmac.compare_digest(key.hex(), key_hex)
    except Exception:
        return False



def create_access_token(
    payload: dict,
    expires_delta: timedelta | None = None,
    secret_key: str | None = None,
) -> str:
    to_encode = payload.copy()
    expire = datetime.now(UTC) + (expires_delta or timedelta(hours=24))
    to_encode.update({"exp": expire, "iat": datetime.now(UTC)})
    secret = (
        secret_key or settings.SUPABASE_JWT_SECRET or "dev-secret-key-change-in-production-must-be-long-enough-32bytes"
    )
    return jwt.encode(to_encode, secret, algorithm="HS256")


def decode_access_token(token: str) -> dict:
    secret = settings.SUPABASE_JWT_SECRET or "dev-secret-key-change-in-production-must-be-long-enough-32bytes"
    try:
        # First try HS256 with configured secret
        payload = jwt.decode(
            token,
            secret,
            algorithms=["HS256", "RS256"],
            options={"verify_aud": False, "verify_signature": True},
        )
        return payload
    except jwt.PyJWTError:
        # For development / testing bypass if secret doesn't match or in dev mode
        if settings.APP_ENV in ("development", "test"):
            try:
                # Allow unverified decode in dev for fast mock testing if needed
                payload = jwt.decode(token, options={"verify_signature": False})
                return payload
            except Exception:
                pass
        raise UnauthorizedError(message="Invalid or expired access token", code="INVALID_TOKEN")


class AuthenticatedUser:
    def __init__(self, profile: Profile, roles: list[str], auth_claims: dict):
        self.profile = profile
        self.id = profile.id
        self.auth_user_id = profile.auth_user_id
        self.email = profile.email
        self.full_name = profile.full_name
        self.roles = roles
        self.auth_claims = auth_claims

    def has_role(self, *role_codes: RoleCode) -> bool:
        required = {r.value if isinstance(r, RoleCode) else str(r) for r in role_codes}
        user_roles = set(self.roles)
        # SUPER_ADMIN has access to all roles
        if RoleCode.SUPER_ADMIN.value in user_roles:
            return True
        return bool(user_roles.intersection(required))


async def get_current_user(
    auth: HTTPAuthorizationCredentials | None = Depends(security_scheme),
    db: AsyncSession = Depends(get_db),
) -> AuthenticatedUser:
    if not auth or not auth.credentials:
        raise UnauthorizedError(message="Authentication token missing", code="TOKEN_MISSING")

    token = auth.credentials
    claims = decode_access_token(token)

    auth_user_id = claims.get("sub") or claims.get("id") or claims.get("user_id")
    email = claims.get("email") or f"{auth_user_id}@user.local"

    if not auth_user_id:
        raise UnauthorizedError(message="Invalid token claims: user ID missing", code="INVALID_CLAIMS")

    # Lookup user profile in database
    result = await db.execute(select(Profile).where(Profile.auth_user_id == str(auth_user_id)))
    profile = result.scalars().first()

    if not profile:
        # Lazy profile creation upon first authenticated request
        full_name = claims.get("user_metadata", {}).get("full_name") or claims.get("name")
        avatar_url = claims.get("user_metadata", {}).get("avatar_url") or claims.get("picture")
        profile = Profile(
            auth_user_id=str(auth_user_id),
            email=email,
            full_name=full_name,
            avatar_url=avatar_url,
            status="ACTIVE",
            is_active=True,
        )
        db.add(profile)
        await db.flush()

        # Check if this is the default admin email
        default_role = RoleCode.ADMIN.value if email == settings.ADMIN_EMAIL else RoleCode.CUSTOMER.value
        user_role = UserRole(user_id=profile.id, role_code=default_role)
        db.add(user_role)
        await db.commit()
        await db.refresh(profile)

    if not profile.is_active or profile.status == "BLOCKED":
        raise ForbiddenError(message="Account is deactivated or blocked", code="ACCOUNT_BLOCKED")

    # Fetch user roles
    role_result = await db.execute(select(UserRole.role_code).where(UserRole.user_id == profile.id))
    roles = [r for r in role_result.scalars().all()]
    if not roles:
        roles = [RoleCode.CUSTOMER.value]

    return AuthenticatedUser(profile=profile, roles=roles, auth_claims=claims)


async def get_optional_current_user(
    auth: HTTPAuthorizationCredentials | None = Depends(security_scheme),
    db: AsyncSession = Depends(get_db),
) -> AuthenticatedUser | None:
    if not auth or not auth.credentials:
        return None
    try:
        return await get_current_user(auth=auth, db=db)
    except Exception:
        return None


def require_roles(*roles: RoleCode):
    async def role_checker(
        current_user: AuthenticatedUser = Depends(get_current_user),
    ) -> AuthenticatedUser:
        if not current_user.has_role(*roles):
            raise ForbiddenError(
                message=f"Access denied. Requires one of roles: {[r.value for r in roles]}",
                code="INSUFFICIENT_PERMISSIONS",
            )
        return current_user

    return role_checker


# Convenient dependencies
get_current_admin = require_roles(RoleCode.ADMIN, RoleCode.SUPER_ADMIN)
get_current_super_admin = require_roles(RoleCode.SUPER_ADMIN)
get_current_support_or_admin = require_roles(RoleCode.SUPPORT, RoleCode.ADMIN, RoleCode.SUPER_ADMIN)
