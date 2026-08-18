from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import AuthenticatedUser, get_current_admin
from app.db.session import get_db
from app.modules.audit.service import AuditService
from app.modules.settings.schema import SiteSettingRead, SiteSettingUpdate
from app.modules.settings.service import SiteSettingService
from app.shared.enums import AuditAction

router = APIRouter(prefix="/admin/settings", tags=["Admin Settings"])


@router.get("", response_model=list[SiteSettingRead])
async def get_all_settings(
    current_admin: AuthenticatedUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    service = SiteSettingService(db)
    return await service.get_all_settings()


@router.patch("", response_model=dict[str, str])
async def update_settings(
    data: SiteSettingUpdate,
    current_admin: AuthenticatedUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    service = SiteSettingService(db)
    res = await service.update_settings(data.settings)

    audit = AuditService(db)
    await audit.log_event(
        action=AuditAction.SETTINGS_UPDATED,
        entity_type="SETTINGS",
        actor_id=current_admin.id,
        actor_email=current_admin.email,
        metadata={"updated_keys": list(data.settings.keys())},
    )
    await db.commit()
    return res
