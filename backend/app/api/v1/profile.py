from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import AuthenticatedUser, get_current_user
from app.db.session import get_db
from app.modules.users.schema import ProfileRead, ProfileUpdate
from app.modules.users.service import UserService

router = APIRouter(prefix="/me/profile", tags=["Customer Profile"])


@router.get("", response_model=ProfileRead)
async def get_profile(current_user: AuthenticatedUser = Depends(get_current_user)):
    profile = current_user.profile
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


@router.patch("", response_model=ProfileRead)
async def update_profile(
    data: ProfileUpdate,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = UserService(db)
    profile = await service.update_profile(user_id=current_user.id, data=data)
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
