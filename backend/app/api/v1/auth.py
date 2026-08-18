from datetime import timedelta

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    AuthenticatedUser,
    create_access_token,
    get_current_user,
)
from app.db.session import get_db
from app.modules.users.schema import ProfileRead, UserSyncRequest
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
