from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import AuthenticatedUser, get_current_admin
from app.db.session import get_db
from app.integrations.providers.external import ExternalTopupProviderService
from app.modules.audit.service import AuditService
from app.modules.settings.model import SiteSetting
from app.shared.enums import AuditAction

router = APIRouter(prefix="/admin/providers", tags=["Admin Providers"])


class ProviderStatusResponse(BaseModel):
    provider_name: str
    active: bool
    mock_mode: bool
    mock_outcome: str
    base_url: str
    timeout_seconds: int
    diamond_api_url: str | None = None
    diamond_api_mode: str = "LOCAL"


class TestExternalApiRequest(BaseModel):
    api_url: str
    api_key: str | None = None


class SyncExternalProductsRequest(BaseModel):
    api_url: str | None = None
    api_key: str | None = None


@router.get("", response_model=ProviderStatusResponse)
async def get_provider_status(
    current_admin: AuthenticatedUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    url_res = await db.execute(select(SiteSetting).where(SiteSetting.key == "diamond_api_url"))
    url_setting = url_res.scalars().first()

    mode_res = await db.execute(select(SiteSetting).where(SiteSetting.key == "diamond_api_mode"))
    mode_setting = mode_res.scalars().first()

    return ProviderStatusResponse(
        provider_name=settings.PROVIDER_NAME,
        active=True,
        mock_mode=(settings.PROVIDER_NAME == "mock"),
        mock_outcome=settings.MOCK_PROVIDER_OUTCOME,
        base_url=settings.PROVIDER_API_BASE_URL,
        timeout_seconds=settings.PROVIDER_TIMEOUT_SECONDS,
        diamond_api_url=url_setting.value if url_setting else "",
        diamond_api_mode=mode_setting.value if mode_setting else "LOCAL",
    )


@router.post("/test-external-api", response_model=dict[str, Any])
async def test_external_diamond_api(
    data: TestExternalApiRequest,
    current_admin: AuthenticatedUser = Depends(get_current_admin),
):
    return await ExternalTopupProviderService.test_external_api(
        api_url=data.api_url,
        api_key=data.api_key,
    )


@router.post("/sync-external-products", response_model=dict[str, Any])
async def sync_external_products(
    data: SyncExternalProductsRequest,
    current_admin: AuthenticatedUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    api_url = data.api_url
    api_key = data.api_key

    # If not passed directly, read from DB settings
    if not api_url:
        url_res = await db.execute(select(SiteSetting).where(SiteSetting.key == "diamond_api_url"))
        url_setting = url_res.scalars().first()
        api_url = url_setting.value if url_setting else ""

    if not api_key:
        key_res = await db.execute(select(SiteSetting).where(SiteSetting.key == "diamond_api_key"))
        key_setting = key_res.scalars().first()
        api_key = key_setting.value if key_setting else ""

    if not api_url:
        return {"success": False, "synced_count": 0, "message": "No Diamond API URL configured in Store Settings."}

    result = await ExternalTopupProviderService.sync_external_packages_to_db(db=db, api_url=api_url, api_key=api_key)

    if result.get("success"):
        audit = AuditService(db)
        await audit.log_event(
            action=AuditAction.SETTINGS_UPDATED,
            entity_type="PROVIDER_SYNC",
            actor_id=current_admin.id,
            actor_email=current_admin.email,
            metadata={"synced_count": result.get("synced_count"), "api_url": api_url},
        )
        await db.commit()

    return result
