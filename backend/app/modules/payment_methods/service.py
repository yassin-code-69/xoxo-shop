from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.modules.payment_methods.model import PaymentMethod
from app.modules.payment_methods.schema import PaymentMethodUpdate


class PaymentMethodService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_public_methods(self) -> list[PaymentMethod]:
        query = select(PaymentMethod).where(PaymentMethod.active).order_by(PaymentMethod.sort_order.asc())
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def list_admin_methods(self) -> list[PaymentMethod]:
        query = select(PaymentMethod).order_by(PaymentMethod.sort_order.asc())
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_by_code_or_id(self, identifier: str) -> PaymentMethod:
        result = await self.db.execute(
            select(PaymentMethod).where((PaymentMethod.id == identifier) | (PaymentMethod.code == identifier.upper()))
        )
        method = result.scalars().first()
        if not method:
            raise NotFoundError(message=f"Payment method '{identifier}' not found", code="PAYMENT_METHOD_NOT_FOUND")
        return method

    async def update_method(self, method_id: str, data: PaymentMethodUpdate) -> PaymentMethod:
        method = await self.get_by_code_or_id(method_id)
        update_dict = data.model_dump(exclude_unset=True)
        for key, val in update_dict.items():
            setattr(method, key, val)
        await self.db.commit()
        await self.db.refresh(method)
        return method
