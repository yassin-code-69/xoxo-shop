from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.modules.contact.model import ContactMessage
from app.modules.contact.schema import ContactMessageCreate, ContactMessageRead, ContactMessageUpdate
from app.shared.pagination import PaginatedResponse, PaginationParams


class ContactService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_message(self, data: ContactMessageCreate) -> ContactMessage:
        msg = ContactMessage(
            name=data.name.strip(),
            email=data.email.strip().lower(),
            order_id=data.order_id.strip() if data.order_id else None,
            message=data.message.strip(),
            status="UNREAD",
        )
        self.db.add(msg)
        await self.db.commit()
        await self.db.refresh(msg)
        return msg

    async def list_admin_messages(
        self,
        params: PaginationParams,
        status_filter: str | None = None,
        search: str | None = None,
    ) -> PaginatedResponse[ContactMessageRead]:
        query = select(ContactMessage)
        if status_filter and status_filter.upper() != "ALL":
            query = query.where(ContactMessage.status == status_filter.upper())
        if search:
            search_pat = f"%{search.strip()}%"
            query = query.where(
                (ContactMessage.name.ilike(search_pat))
                | (ContactMessage.email.ilike(search_pat))
                | (ContactMessage.order_id.ilike(search_pat))
                | (ContactMessage.message.ilike(search_pat))
            )

        count_query = select(func.count()).select_from(query.subquery())
        total = (await self.db.execute(count_query)).scalar() or 0

        query = query.order_by(ContactMessage.created_at.desc()).offset(params.offset).limit(params.page_size)
        res = await self.db.execute(query)
        messages = res.scalars().all()

        items = [ContactMessageRead.model_validate(m) for m in messages]
        return PaginatedResponse.create(items=items, total=total, page=params.page, page_size=params.page_size)

    async def get_message(self, message_id: str) -> ContactMessage:
        res = await self.db.execute(select(ContactMessage).where(ContactMessage.id == message_id))
        msg = res.scalars().first()
        if not msg:
            raise NotFoundError(message=f"Contact message '{message_id}' not found", code="MESSAGE_NOT_FOUND")
        return msg

    async def update_message(self, message_id: str, data: ContactMessageUpdate) -> ContactMessage:
        msg = await self.get_message(message_id)
        if data.status:
            msg.status = data.status.upper()
        if data.reply_notes is not None:
            msg.reply_notes = data.reply_notes.strip()
        await self.db.commit()
        await self.db.refresh(msg)
        return msg

    async def delete_message(self, message_id: str) -> bool:
        msg = await self.get_message(message_id)
        await self.db.delete(msg)
        await self.db.commit()
        return True
