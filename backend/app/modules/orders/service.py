from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import (
    ConflictError,
    ForbiddenError,
    NotFoundError,
    ValidationError,
)
from app.modules.fulfillment.schema import ProviderOrderRead
from app.modules.orders.model import Order, OrderStatusHistory
from app.modules.orders.schema import (
    OrderAdminRead,
    OrderCreateRequest,
    OrderFilterParams,
    OrderPublicFeedItem,
    OrderPublicRead,
    OrderStatusHistoryRead,
)
from app.modules.payment_methods.model import PaymentMethod
from app.modules.payments.model import Payment
from app.modules.products.model import TopupProduct
from app.modules.users.model import Profile
from app.shared.enums import FulfillmentStatus, OrderStatus, PaymentStatus
from app.shared.pagination import PaginatedResponse, PaginationParams
from app.shared.utils import generate_public_order_id


class OrderService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_order(self, user_id: str, data: OrderCreateRequest) -> Order:
        # 1. Fetch and validate product
        res = await self.db.execute(
            select(TopupProduct).where((TopupProduct.id == data.product_id) | (TopupProduct.slug == data.product_id))
        )
        product = res.scalars().first()
        if not product:
            raise NotFoundError(message="Product not found", code="PRODUCT_NOT_FOUND")
        if not product.active:
            raise ConflictError(message="Product is currently inactive", code="PRODUCT_INACTIVE")

        # 2. Validate payment method
        pm_res = await self.db.execute(select(PaymentMethod).where(PaymentMethod.code == data.payment_method.upper()))
        payment_method = pm_res.scalars().first()
        if not payment_method or not payment_method.active:
            raise ValidationError(
                message=f"Payment method '{data.payment_method}' is not available",
                code="PAYMENT_METHOD_INVALID",
            )

        # 3. Server authoritative pricing
        total_amount = product.selling_price * Decimal(data.quantity)

        # 4. Generate unique public ID
        public_order_id = generate_public_order_id()
        # Verify uniqueness
        while (await self.db.execute(select(Order).where(Order.public_order_id == public_order_id))).scalars().first():
            public_order_id = generate_public_order_id()

        # 5. Create order with immutable snapshot
        order = Order(
            public_order_id=public_order_id,
            user_id=user_id,
            game_id=product.game_id,
            product_id=product.id,
            product_name_snapshot=product.name,
            product_sku_snapshot=product.provider_sku,
            diamond_amount_snapshot=product.diamond_amount,
            bonus_amount_snapshot=product.bonus_amount,
            selling_price_snapshot=product.selling_price,
            player_uid=data.player_uid.strip(),
            player_server=data.player_server.strip() if data.player_server else None,
            quantity=data.quantity,
            total_amount=total_amount,
            currency=product.currency,
            order_status=OrderStatus.PENDING_PAYMENT.value,
            payment_status=PaymentStatus.PENDING.value,
            fulfillment_status=FulfillmentStatus.NOT_STARTED.value,
            payment_method_code=payment_method.code,
        )
        self.db.add(order)
        await self.db.flush()

        # 6. Create initial payment entry
        payment = Payment(
            order_id=order.id,
            payment_type=payment_method.type,
            payment_method=payment_method.code,
            amount=total_amount,
            currency=product.currency,
            status=PaymentStatus.PENDING.value,
        )
        self.db.add(payment)

        # 7. Record status history
        history = OrderStatusHistory(
            order_id=order.id,
            status_type="ORDER",
            previous_status=None,
            new_status=OrderStatus.PENDING_PAYMENT.value,
            reason="Order created by customer",
            changed_by=user_id,
        )
        self.db.add(history)

        await self.db.commit()
        await self.db.refresh(order)
        return order

    async def get_by_public_id(self, public_order_id: str, user_id: str | None = None, is_admin: bool = False) -> Order:
        query = (
            select(Order)
            .options(
                selectinload(Order.user),
                selectinload(Order.payment),
                selectinload(Order.provider_order),
                selectinload(Order.status_history),
            )
            .where(Order.public_order_id == public_order_id)
        )
        res = await self.db.execute(query)
        order = res.scalars().first()
        if not order:
            raise NotFoundError(message=f"Order '{public_order_id}' not found", code="ORDER_NOT_FOUND")

        if not is_admin and user_id and order.user_id != user_id:
            raise ForbiddenError(message="You do not have permission to view this order", code="ORDER_ACCESS_DENIED")

        return order

    def map_to_public_read(self, order: Order) -> OrderPublicRead:
        trx_id = order.payment.transaction_id if order.payment else None
        sender_num = order.payment.sender_number if order.payment else None
        history = [
            OrderStatusHistoryRead(
                id=h.id,
                status_type=h.status_type,
                previous_status=h.previous_status,
                new_status=h.new_status,
                reason=h.reason,
                changed_by=h.changed_by,
                created_at=h.created_at,
            )
            for h in order.status_history
        ]
        return OrderPublicRead(
            id=order.id,
            public_order_id=order.public_order_id,
            product_name=order.product_name_snapshot,
            diamond_amount=order.diamond_amount_snapshot,
            bonus_amount=order.bonus_amount_snapshot,
            player_uid=order.player_uid,
            player_server=order.player_server,
            quantity=order.quantity,
            total_amount=order.total_amount,
            currency=order.currency,
            order_status=order.order_status,
            payment_status=order.payment_status,
            fulfillment_status=order.fulfillment_status,
            payment_method_code=order.payment_method_code,
            payment_transaction_id=trx_id,
            payment_sender_number=sender_num,
            created_at=order.created_at,
            completed_at=order.completed_at,
            status_history=history,
        )

    def map_to_admin_read(self, order: Order) -> OrderAdminRead:
        pub = self.map_to_public_read(order)
        provider_order_read = None
        if order.provider_order:
            provider_order_read = ProviderOrderRead.model_validate(order.provider_order)

        return OrderAdminRead(
            **pub.model_dump(),
            user_id=order.user_id,
            customer_email=order.user.email if order.user else None,
            customer_name=order.user.full_name if order.user else None,
            product_sku=order.product_sku_snapshot,
            selling_price=order.selling_price_snapshot,
            provider_order=provider_order_read,
        )

    async def list_my_orders(self, user_id: str, params: PaginationParams) -> PaginatedResponse[OrderPublicRead]:
        query = (
            select(Order)
            .options(
                selectinload(Order.payment),
                selectinload(Order.status_history),
            )
            .where(Order.user_id == user_id)
        )

        count_query = select(func.count(Order.id)).where(Order.user_id == user_id)
        total = (await self.db.execute(count_query)).scalar() or 0

        query = query.order_by(Order.created_at.desc()).offset(params.offset).limit(params.page_size)
        orders = (await self.db.execute(query)).scalars().all()

        items = [self.map_to_public_read(o) for o in orders]
        return PaginatedResponse.create(items=items, total=total, page=params.page, page_size=params.page_size)

    async def list_admin_orders(
        self, params: PaginationParams, filters: OrderFilterParams
    ) -> PaginatedResponse[OrderAdminRead]:
        query = select(Order).options(
            selectinload(Order.user),
            selectinload(Order.payment),
            selectinload(Order.provider_order),
            selectinload(Order.status_history),
        )
        if filters.order_status:
            query = query.where(Order.order_status == filters.order_status)
        if filters.payment_status:
            query = query.where(Order.payment_status == filters.payment_status)
        if filters.fulfillment_status:
            query = query.where(Order.fulfillment_status == filters.fulfillment_status)
        if filters.search:
            search_pat = f"%{filters.search}%"
            query = query.join(Order.user).where(
                (Order.public_order_id.ilike(search_pat))
                | (Order.player_uid.ilike(search_pat))
                | (Profile.email.ilike(search_pat))
                | (Profile.full_name.ilike(search_pat))
            )

        count_query = select(func.count()).select_from(query.subquery())
        total = (await self.db.execute(count_query)).scalar() or 0

        query = query.order_by(Order.created_at.desc()).offset(params.offset).limit(params.page_size)
        orders = (await self.db.execute(query)).scalars().all()

        items = [self.map_to_admin_read(o) for o in orders]
        return PaginatedResponse.create(items=items, total=total, page=params.page, page_size=params.page_size)

    async def get_public_feed(self, limit: int = 10) -> list[OrderPublicFeedItem]:
        query = select(Order).options(selectinload(Order.user)).order_by(Order.created_at.desc()).limit(limit)
        orders = (await self.db.execute(query)).scalars().all()
        feed: list[OrderPublicFeedItem] = []
        for o in orders:
            # Mask customer name or UID for privacy: e.g. "Tahmid S***" or "Player 123***"
            if o.user and o.user.full_name:
                name_parts = o.user.full_name.split()
                display_name = (
                    f"{name_parts[0]} {name_parts[1][0]}***" if len(name_parts) > 1 else f"{name_parts[0]}***"
                )
            else:
                display_name = f"Player {o.player_uid[:3]}***"

            feed.append(
                OrderPublicFeedItem(
                    id=o.id,
                    customer_display_name=display_name,
                    product_name=o.product_name_snapshot,
                    total_amount=o.total_amount,
                    order_status=o.order_status.value if hasattr(o.order_status, "value") else str(o.order_status),
                    created_at=o.created_at,
                )
            )
        return feed
