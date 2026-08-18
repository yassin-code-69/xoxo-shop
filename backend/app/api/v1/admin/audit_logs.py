from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import AuthenticatedUser, get_current_admin
from app.db.session import get_db
from app.modules.audit.schema import AuditLogRead
from app.modules.audit.service import AuditService
from app.shared.pagination import PaginatedResponse, PaginationParams

router = APIRouter(prefix="/admin/audit-logs", tags=["Admin Audit Logs"])


@router.get("", response_model=PaginatedResponse[AuditLogRead])
async def list_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    action: str | None = None,
    entity_type: str | None = None,
    current_admin: AuthenticatedUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    service = AuditService(db)
    params = PaginationParams(page=page, page_size=page_size)
    return await service.list_audit_logs(params=params, action=action, entity_type=entity_type)
