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
from app.core.logging import logger
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



JWT_ALGORITHM = "HS256"

# Ephemeral secret used only outside production when none is configured, so that
# local dev / CI keeps working without ever falling back to a well-known key.
_EPHEMERAL_DEV_SECRET = secrets.token_urlsafe(48)
_warned_about_ephemeral_secret = False


def _get_jwt_secret() -> str:
    """Returns the HMAC secret used to sign and verify our access tokens."""
    global _warned_about_ephemeral_secret

    configured = (settings.SUPABASE_JWT_SECRET or "").strip()
    if configured:
        return configured

    if settings.is_production:
        # Never sign or accept tokens with a guessable key in production.
        raise UnauthorizedError(
            message="Authentication is not configured on this server",
            code="JWT_SECRET_MISSING",
        )

    if not _warned_about_ephemeral_secret:
        logger.warning(
            "SUPABASE_JWT_SECRET is not set - using a random per-process secret. "
            "Tokens will be invalidated on every restart. Set SUPABASE_JWT_SECRET in .env."
        )
        _warned_about_ephemeral_secret = True
    return _EPHEMERAL_DEV_SECRET


def create_access_token(
    payload: dict,
    expires_delta: timedelta | None = None,
    secret_key: str | None = None,
) -> str:
    to_encode = payload.copy()
    expire = datetime.now(UTC) + (expires_delta or timedelta(hours=24))
    to_encode.update({"exp": expire, "iat": datetime.now(UTC)})
    secret = secret_key or _get_jwt_secret()
    return jwt.encode(to_encode, secret, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    """Decodes an access token, always verifying the signature and expiry.

    There is deliberately no unsigned fallback path: a token whose signature we
    cannot verify is an untrusted token, no matter which claims it carries.
    """
    try:
        payload = jwt.decode(
            token,
            _get_jwt_secret(),
            algorithms=[JWT_ALGORITHM],
            options={
                "verify_signature": True,
                "verify_exp": True,
                "verify_aud": False,  # audience checked manually below
                "require": ["exp", "sub"],
            },
        )
    except jwt.PyJWTError as exc:
        logger.debug(f"Rejected access token: {type(exc).__name__}")
        raise UnauthorizedError(message="Invalid or expired access token", code="INVALID_TOKEN") from exc

    # Supabase and our own tokens both carry aud="authenticated". Tokens issued for a
    # different audience (e.g. another Supabase project role) must not be accepted.
    audience = payload.get("aud")
    if audience is not None:
        presented = set(audience) if isinstance(audience, list) else {audience}
        if settings.SUPABASE_JWT_AUDIENCE not in presented:
            raise UnauthorizedError(message="Access token audience mismatch", code="INVALID_TOKEN_AUDIENCE")

    return payload


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

        # Newly seen accounts are always customers. Elevated roles are granted only by
        # the bootstrap seed or by an existing admin, never by a claim in the token.
        db.add(UserRole(user_id=profile.id, role_code=RoleCode.CUSTOMER.value))
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
    except UnauthorizedError:
        # An unreadable token is treated as "no token"; anything else (a blocked account,
        # a database failure) must surface rather than silently downgrade to anonymous.
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
