from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.core.config import settings
from app.core.security import AuthenticatedUser, get_current_admin

router = APIRouter(prefix="/admin/providers", tags=["Admin Providers"])


class ProviderStatusResponse(BaseModel):
    provider_name: str
    active: bool
    mock_mode: bool
    mock_outcome: str
    base_url: str
    timeout_seconds: int


@router.get("", response_model=ProviderStatusResponse)
async def get_provider_status(current_admin: AuthenticatedUser = Depends(get_current_admin)):
    return ProviderStatusResponse(
        provider_name=settings.PROVIDER_NAME,
        active=True,
        mock_mode=(settings.PROVIDER_NAME == "mock"),
        mock_outcome=settings.MOCK_PROVIDER_OUTCOME,
        base_url=settings.PROVIDER_API_BASE_URL,
        timeout_seconds=settings.PROVIDER_TIMEOUT_SECONDS,
    )
