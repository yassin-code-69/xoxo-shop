import uuid
from datetime import timedelta

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import ConflictError, ForbiddenError, UnauthorizedError
from app.core.security import (
    AuthenticatedUser,
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from app.db.session import get_db
from app.modules.roles.model import UserRole
from app.modules.users.model import Profile
from app.modules.users.schema import (
    AuthTokenResponse,
    ChangePasswordRequest,
    ProfileRead,
    UserLoginRequest,
    UserRegisterRequest,
    UserSyncRequest,
)
from app.shared.enums import RoleCode

router = APIRouter(prefix="/auth", tags=["Auth"])



class MockTokenRequest(BaseModel):
    email: str = "customer@example.com"
    full_name: str = "Regular Customer"
    role: RoleCode = RoleCode.CUSTOMER


class MockTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


@router.get("/me", response_model=ProfileRead)
async def get_me(current_user: AuthenticatedUser = Depends(get_current_user)):
    profile = current_user.profile
    roles = current_user.roles
    return ProfileRead(
        id=profile.id,
        auth_user_id=profile.auth_user_id,
        email=profile.email,
        full_name=profile.full_name,
        phone=profile.phone,
        avatar_url=profile.avatar_url,
        status=profile.status,
        is_active=profile.is_active,
        roles=roles,
        created_at=profile.created_at,
        updated_at=profile.updated_at,
    )


@router.post("/sync", response_model=ProfileRead)
async def sync_profile(
    data: UserSyncRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Syncs user metadata from Supabase session to backend profile."""
    profile = current_user.profile
    if data.full_name and not profile.full_name:
        profile.full_name = data.full_name
    if data.avatar_url and not profile.avatar_url:
        profile.avatar_url = data.avatar_url
    await db.commit()
    await db.refresh(profile)

    return ProfileRead(
        id=profile.id,
        auth_user_id=profile.auth_user_id,
        email=profile.email,
        full_name=profile.full_name,
        phone=profile.phone,
        avatar_url=profile.avatar_url,
        status=profile.status,
        is_active=profile.is_active,
        roles=current_user.roles,
        created_at=profile.created_at,
        updated_at=profile.updated_at,
    )


@router.post("/mock-token", response_model=MockTokenResponse)
async def generate_mock_token(data: MockTokenRequest):
    """Helper for testing and frontend development without active Supabase backend."""
    if settings.APP_ENV == "production" and not settings.DEBUG:
        raise ForbiddenError(message="Mock tokens are disabled in production environment", code="MOCK_AUTH_DISABLED")

    auth_user_id = f"mock-user-{abs(hash(data.email)) % 1000000}"
    payload = {
        "sub": auth_user_id,
        "email": data.email,
        "user_metadata": {
            "full_name": data.full_name,
            "role": data.role.value,
        },
        "aud": "authenticated",
        "role": "authenticated",
    }
    token = create_access_token(payload, expires_delta=timedelta(days=7))
    return MockTokenResponse(
        access_token=token,
        user={
            "id": auth_user_id,
            "email": data.email,
            "full_name": data.full_name,
            "role": data.role.value,
        },
    )


@router.post("/register", response_model=AuthTokenResponse, status_code=201)
async def register(
    data: UserRegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    """Register a new user with email and password directly stored in database."""
    email = data.email.strip().lower()
    existing = await db.execute(select(Profile).where(Profile.email == email))
    if existing.scalars().first():
        raise ConflictError(message="User with this email already exists", code="EMAIL_EXISTS")

    auth_user_id = f"user-{uuid.uuid4().hex[:12]}"
    hashed = hash_password(data.password)

    profile = Profile(
        auth_user_id=auth_user_id,
        email=email,
        full_name=data.full_name.strip() if data.full_name else None,
        phone=data.phone.strip() if data.phone else None,
        password_hash=hashed,
        status="ACTIVE",
        is_active=True,
    )
    db.add(profile)
    await db.flush()

    default_role = RoleCode.ADMIN.value if email == settings.ADMIN_EMAIL else RoleCode.CUSTOMER.value
    db.add(UserRole(user_id=profile.id, role_code=default_role))
    await db.commit()
    await db.refresh(profile)

    roles = [default_role]
    payload = {
        "sub": profile.auth_user_id,
        "email": profile.email,
        "user_metadata": {
            "full_name": profile.full_name,
            "roles": roles,
        },
        "aud": "authenticated",
        "role": "authenticated",
    }
    token = create_access_token(payload, expires_delta=timedelta(days=7))

    return AuthTokenResponse(
        access_token=token,
        token_type="bearer",
        user=ProfileRead(
            id=profile.id,
            auth_user_id=profile.auth_user_id,
            email=profile.email,
            full_name=profile.full_name,
            phone=profile.phone,
            avatar_url=profile.avatar_url,
            status=profile.status,
            is_active=profile.is_active,
            roles=roles,
            created_at=profile.created_at,
            updated_at=profile.updated_at,
        ),
    )


@router.post("/login", response_model=AuthTokenResponse)
async def login(
    data: UserLoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """Login with email and password."""
    email = data.email.strip().lower()
    result = await db.execute(select(Profile).where(Profile.email == email))
    profile = result.scalars().first()

    if not profile or not profile.password_hash or not verify_password(data.password, profile.password_hash):
        raise UnauthorizedError(message="Invalid email or password", code="INVALID_CREDENTIALS")

    if not profile.is_active or profile.status == "BLOCKED":
        raise ForbiddenError(message="Account is deactivated or blocked", code="ACCOUNT_BLOCKED")

    role_result = await db.execute(select(UserRole.role_code).where(UserRole.user_id == profile.id))
    roles = list(role_result.scalars().all())
    if not roles:
        roles = [RoleCode.CUSTOMER.value]

    payload = {
        "sub": profile.auth_user_id,
        "email": profile.email,
        "user_metadata": {
            "full_name": profile.full_name,
            "roles": roles,
        },
        "aud": "authenticated",
        "role": "authenticated",
    }
    token = create_access_token(payload, expires_delta=timedelta(days=7))

    return AuthTokenResponse(
        access_token=token,
        token_type="bearer",
        user=ProfileRead(
            id=profile.id,
            auth_user_id=profile.auth_user_id,
            email=profile.email,
            full_name=profile.full_name,
            phone=profile.phone,
            avatar_url=profile.avatar_url,
            status=profile.status,
            is_active=profile.is_active,
            roles=roles,
            created_at=profile.created_at,
            updated_at=profile.updated_at,
        ),
    )


@router.post("/change-password")
async def change_password(
    data: ChangePasswordRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Change current user password."""
    profile = current_user.profile
    if profile.password_hash:
        if not verify_password(data.old_password, profile.password_hash):
            raise UnauthorizedError(message="Incorrect current password", code="INVALID_PASSWORD")
    profile.password_hash = hash_password(data.new_password)
    await db.commit()
    return {"success": True, "message": "Password updated successfully"}

