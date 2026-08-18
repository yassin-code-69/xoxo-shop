import json
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.audit.model import AuditLog
from app.modules.audit.schema import AuditLogRead
from app.shared.enums import AuditAction
from app.shared.pagination import PaginatedResponse, PaginationParams


class AuditService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def log_event(
        self,
        action: AuditAction,
        entity_type: str,
        entity_id: str | None = None,
        actor_id: str | None = None,
        actor_email: str | None = None,
        metadata: dict[str, Any] | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> AuditLog:
        metadata_str = json.dumps(metadata) if metadata else None
        log = AuditLog(
            actor_id=actor_id,
            actor_email=actor_email,
            action=action.value if isinstance(action, AuditAction) else str(action),
            entity_type=entity_type,
            entity_id=entity_id,
            metadata_json=metadata_str,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        self.db.add(log)
        await self.db.flush()
        return log

    async def list_audit_logs(
        self,
        params: PaginationParams,
        action: str | None = None,
        entity_type: str | None = None,
    ) -> PaginatedResponse[AuditLogRead]:
        query = select(AuditLog)
        if action:
            query = query.where(AuditLog.action == action)
        if entity_type:
            query = query.where(AuditLog.entity_type == entity_type)

        count_query = select(func.count()).select_from(query.subquery())
        total = (await self.db.execute(count_query)).scalar() or 0

        query = query.order_by(AuditLog.created_at.desc()).offset(params.offset).limit(params.page_size)
        logs = (await self.db.execute(query)).scalars().all()

        items = [AuditLogRead.model_validate(log) for log in logs]
        return PaginatedResponse.create(items=items, total=total, page=params.page, page_size=params.page_size)
