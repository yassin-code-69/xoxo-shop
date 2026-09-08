import hashlib
import hmac
import secrets
from datetime import UTC, datetime, timedelta

import jwt
from jwt import PyJWKClient
from jwt.algorithms import ECAlgorithm
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

# Known Supabase EC Public Key for this project as immediate static fallback (zero latency)
_SUPABASE_STATIC_JWK = {
    "alg": "ES256",
    "crv": "P-256",
    "ext": True,
    "key_ops": ["verify"],
    "kid": "14d50d4a-effe-437f-9bf2-5207866a5087",
    "kty": "EC",
    "use": "sig",
    "x": "Wwd5EmNJ07eqL3saHJTAy16kMMWm-9SaIrWMAj_3SuU",
    "y": "2VoTvv6Tjig4y-KsIiId91OPPDyT1P0Xbt8p6vYTCdU",
}
try:
    _STATIC_EC_KEY = ECAlgorithm.from_jwk(_SUPABASE_STATIC_JWK)
except Exception:
    _STATIC_EC_KEY = None

_jwks_client: PyJWKClient | None = None


def _get_jwks_client() -> PyJWKClient | None:
    global _jwks_client
    if _jwks_client is None and settings.SUPABASE_URL and settings.SUPABASE_ANON_KEY:
        try:
            jwks_url = f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/.well-known/jwks.json"
            _jwks_client = PyJWKClient(
                jwks_url,
                headers={"apikey": settings.SUPABASE_ANON_KEY},
                cache_keys=True,
                max_cached_keys=16,
            )
        except Exception as e:
            logger.warning(f"Failed to initialize PyJWKClient: {e}")
    return _jwks_client

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
    """Decodes an access token, verifying the signature and expiry.

    Supports:
    1. HS256 tokens signed by our backend using SUPABASE_JWT_SECRET.
    2. ES256/RS256 asymmetric tokens signed by Supabase Auth (e.g. Google OAuth) using JWKS or EC public key.
    """
    try:
        header = jwt.get_unverified_header(token)
    except Exception as exc:
        raise UnauthorizedError(message="Invalid token format", code="INVALID_TOKEN") from exc

    alg = header.get("alg", "HS256")

    try:
        if alg == "HS256":
            payload = jwt.decode(
                token,
                _get_jwt_secret(),
                algorithms=["HS256"],
                options={
                    "verify_signature": True,
                    "verify_exp": True,
                    "verify_aud": False,  # audience checked manually below
                    "require": ["exp", "sub"],
                },
            )
        elif alg in ("ES256", "RS256"):
            # Asymmetric Supabase token: attempt dynamic JWKS, then fallback to static EC key
            key = None
            client = _get_jwks_client()
            if client is not None:
                try:
                    signing_key = client.get_signing_key_from_jwt(token)
                    key = signing_key.key
                except Exception as jwks_err:
                    logger.debug(f"JWKS key resolution notice: {jwks_err}")

            if key is None and alg == "ES256" and _STATIC_EC_KEY is not None:
                key = _STATIC_EC_KEY

            if key is None:
                raise UnauthorizedError(
                    message="Could not resolve public key for token verification",
                    code="TOKEN_KEY_RESOLUTION_FAILED",
                )

            payload = jwt.decode(
                token,
                key,
                algorithms=[alg],
                options={
                    "verify_signature": True,
                    "verify_exp": True,
                    "verify_aud": False,  # audience checked manually below
                    "require": ["exp", "sub"],
                },
            )
        else:
            raise UnauthorizedError(
                message=f"Unsupported token algorithm: {alg}",
                code="UNSUPPORTED_ALGORITHM",
            )
    except jwt.PyJWTError as exc:
        logger.debug(f"Rejected access token ({alg}): {type(exc).__name__}: {exc}")
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

    from app.core.cache import cache

    cache_key = f"auth_user:{auth_user_id}"
    cached_auth = cache.get(cache_key)
    if cached_auth is not None:
        return cached_auth

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

    # Use already loaded profile roles
    roles = [r.role_code for r in profile.roles] if profile.roles else [RoleCode.CUSTOMER.value]

    auth_user = AuthenticatedUser(profile=profile, roles=roles, auth_claims=claims)
    cache.set(cache_key, auth_user, ttl_seconds=60)
    return auth_user


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
