from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.modules.orders.model import Order
from app.modules.users.model import Profile
from app.modules.users.schema import CustomerAdminRead, ProfileUpdate
from app.shared.money import format_bdt
from app.shared.pagination import PaginatedResponse, PaginationParams


class UserService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_profile_by_id(self, user_id: str) -> Profile:
        result = await self.db.execute(select(Profile).where(Profile.id == user_id))
        profile = result.scalars().first()
        if not profile:
            raise NotFoundError(message="User profile not found", code="USER_NOT_FOUND")
        return profile

    async def update_profile(self, user_id: str, data: ProfileUpdate) -> Profile:
        profile = await self.get_profile_by_id(user_id)
        if data.full_name is not None:
            profile.full_name = data.full_name
        if data.phone is not None:
            profile.phone = data.phone
        if data.avatar_url is not None:
            profile.avatar_url = data.avatar_url
        await self.db.commit()
        await self.db.refresh(profile)
        return profile

    async def list_customers(
        self, params: PaginationParams, search: str | None = None
    ) -> PaginatedResponse[CustomerAdminRead]:
        query = select(Profile)
        if search:
            search_pattern = f"%{search}%"
            query = query.where(
                (Profile.email.ilike(search_pattern))
                | (Profile.full_name.ilike(search_pattern))
                | (Profile.phone.ilike(search_pattern))
            )

        # Count total
        count_query = select(func.count()).select_from(query.subquery())
        total = (await self.db.execute(count_query)).scalar() or 0

        # Paginated fetch
        query = query.order_by(Profile.created_at.desc()).offset(params.offset).limit(params.page_size)
        profiles = (await self.db.execute(query)).scalars().all()

        items = []
        for p in profiles:
            # Aggregate orders
            order_stat = await self.db.execute(
                select(func.count(Order.id), func.coalesce(func.sum(Order.total_amount), 0)).where(
                    Order.user_id == p.id
                )
            )
            order_count, total_spent = order_stat.first() or (0, 0)
            roles = [r.role_code for r in p.roles]
            items.append(
                CustomerAdminRead(
                    id=p.id,
                    auth_user_id=p.auth_user_id,
                    email=p.email,
                    full_name=p.full_name,
                    phone=p.phone,
                    avatar_url=p.avatar_url,
                    status=p.status,
                    is_active=p.is_active,
                    roles=roles,
                    total_orders=order_count,
                    total_spent=format_bdt(total_spent),
                    created_at=p.created_at,
                )
            )

        return PaginatedResponse.create(items=items, total=total, page=params.page, page_size=params.page_size)
