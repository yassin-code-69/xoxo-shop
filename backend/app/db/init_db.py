from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import logger
from app.db.models import Base
from app.db.session import AsyncSessionLocal, async_engine
from app.modules.banners.model import Banner
from app.modules.games.model import Game
from app.modules.payment_methods.model import PaymentMethod
from app.modules.products.model import TopupProduct
from app.modules.roles.model import Role, UserRole
from app.modules.settings.model import SiteSetting
from app.modules.users.model import Profile
from app.shared.enums import RoleCode


async def init_db():
    logger.info("Initializing database tables...")
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        await seed_initial_data(db)


async def seed_initial_data(db: AsyncSession):
    # 1. Seed Roles
    roles = [
        Role(code=RoleCode.CUSTOMER.value, name="Customer", description="End customer ordering top-ups"),
        Role(code=RoleCode.SUPPORT.value, name="Support Staff", description="Customer support and order viewer"),
        Role(
            code=RoleCode.ADMIN.value, name="Administrator", description="Store manager, verifies payments and packages"
        ),
        Role(code=RoleCode.SUPER_ADMIN.value, name="Super Administrator", description="Full administrative authority"),
    ]
    for r in roles:
        existing = await db.execute(select(Role).where(Role.code == r.code))
        if not existing.scalars().first():
            db.add(r)
    await db.commit()

    # 2. Seed Default Game
    game_res = await db.execute(select(Game).where(Game.slug == "free-fire"))
    game = game_res.scalars().first()
    if not game:
        game = Game(
            name="Free Fire",
            slug="free-fire",
            logo_url="/FF/2.jpg",
            active=True,
        )
        db.add(game)
        await db.commit()
        await db.refresh(game)

    # 3. Seed Products
    products_to_seed = [
        # UID Topup (BD)
        {
            "name": "115 Diamonds",
            "slug": "115-diamonds",
            "category": "UID Topup",
            "diamond_amount": 115,
            "bonus_amount": 0,
            "selling_price": Decimal("79.00"),
            "provider_cost": Decimal("70.00"),
            "provider_sku": "FF_115",
            "sort_order": 1,
            "tag": "Fast",
        },
        {
            "name": "240 Diamonds",
            "slug": "240-diamonds",
            "category": "UID Topup",
            "diamond_amount": 240,
            "bonus_amount": 0,
            "selling_price": Decimal("158.00"),
            "provider_cost": Decimal("140.00"),
            "provider_sku": "FF_240",
            "sort_order": 2,
            "tag": None,
        },
        {
            "name": "355 Diamonds",
            "slug": "355-diamonds",
            "category": "UID Topup",
            "diamond_amount": 355,
            "bonus_amount": 0,
            "selling_price": Decimal("237.00"),
            "provider_cost": Decimal("210.00"),
            "provider_sku": "FF_355",
            "sort_order": 3,
            "tag": "Popular",
        },
        {
            "name": "480 Diamonds",
            "slug": "480-diamonds",
            "category": "UID Topup",
            "diamond_amount": 480,
            "bonus_amount": 0,
            "selling_price": Decimal("316.00"),
            "provider_cost": Decimal("280.00"),
            "provider_sku": "FF_480",
            "sort_order": 4,
            "tag": None,
        },
        {
            "name": "610 Diamonds",
            "slug": "610-diamonds",
            "category": "UID Topup",
            "diamond_amount": 610,
            "bonus_amount": 0,
            "selling_price": Decimal("395.00"),
            "provider_cost": Decimal("350.00"),
            "provider_sku": "FF_610",
            "sort_order": 5,
            "tag": None,
        },
        {
            "name": "1240 Diamonds",
            "slug": "1240-diamonds",
            "category": "UID Topup",
            "diamond_amount": 1240,
            "bonus_amount": 0,
            "selling_price": Decimal("790.00"),
            "provider_cost": Decimal("700.00"),
            "provider_sku": "FF_1240",
            "sort_order": 6,
            "tag": "Best Value",
        },
        {
            "name": "2530 Diamonds",
            "slug": "2530-diamonds",
            "category": "UID Topup",
            "diamond_amount": 2530,
            "bonus_amount": 0,
            "selling_price": Decimal("1580.00"),
            "provider_cost": Decimal("1400.00"),
            "provider_sku": "FF_2530",
            "sort_order": 7,
            "tag": None,
        },
        {
            "name": "5060 Diamonds",
            "slug": "5060-diamonds",
            "category": "UID Topup",
            "diamond_amount": 5060,
            "bonus_amount": 0,
            "selling_price": Decimal("3160.00"),
            "provider_cost": Decimal("2800.00"),
            "provider_sku": "FF_5060",
            "sort_order": 8,
            "tag": "Mega Pack",
        },
        # Weekly & Monthly
        {
            "name": "Weekly Membership",
            "slug": "weekly-membership",
            "category": "Weekly & Monthly",
            "diamond_amount": 450,
            "bonus_amount": 0,
            "selling_price": Decimal("158.00"),
            "provider_cost": Decimal("140.00"),
            "provider_sku": "FF_WEEKLY",
            "sort_order": 10,
            "tag": "Hot",
        },
        {
            "name": "Monthly Membership",
            "slug": "monthly-membership",
            "category": "Weekly & Monthly",
            "diamond_amount": 2600,
            "bonus_amount": 0,
            "selling_price": Decimal("790.00"),
            "provider_cost": Decimal("700.00"),
            "provider_sku": "FF_MONTHLY",
            "sort_order": 11,
            "tag": "Popular",
        },
        # Weekly Lite
        {
            "name": "1X Weekly Lite",
            "slug": "1x-weekly-lite",
            "category": "Weekly Lite",
            "diamond_amount": 50,
            "bonus_amount": 0,
            "selling_price": Decimal("45.00"),
            "provider_cost": Decimal("38.00"),
            "provider_sku": "FF_WL_1X",
            "sort_order": 20,
            "tag": None,
        },
        {
            "name": "3X Weekly Lite",
            "slug": "3x-weekly-lite",
            "category": "Weekly Lite",
            "diamond_amount": 150,
            "bonus_amount": 0,
            "selling_price": Decimal("135.00"),
            "provider_cost": Decimal("114.00"),
            "provider_sku": "FF_WL_3X",
            "sort_order": 21,
            "tag": "Value",
        },
        # Level Up Pass
        {
            "name": "Level Up Pass",
            "slug": "level-up-pass",
            "category": "Level Up Pass",
            "diamond_amount": 800,
            "bonus_amount": 0,
            "selling_price": Decimal("160.00"),
            "provider_cost": Decimal("140.00"),
            "provider_sku": "FF_LUP",
            "sort_order": 30,
            "tag": "Value",
        },
        # Indo Server
        {
            "name": "140 Diamonds (Indo)",
            "slug": "140-diamonds-indo",
            "category": "Indo Server",
            "diamond_amount": 140,
            "bonus_amount": 0,
            "selling_price": Decimal("120.00"),
            "provider_cost": Decimal("105.00"),
            "provider_sku": "FF_INDO_140",
            "sort_order": 40,
            "tag": None,
        },
        {
            "name": "355 Diamonds (Indo)",
            "slug": "355-diamonds-indo",
            "category": "Indo Server",
            "diamond_amount": 355,
            "bonus_amount": 0,
            "selling_price": Decimal("280.00"),
            "provider_cost": Decimal("250.00"),
            "provider_sku": "FF_INDO_355",
            "sort_order": 41,
            "tag": None,
        },
        # FF Likes
        {
            "name": "200 FF Likes",
            "slug": "200-ff-likes",
            "category": "FF Likes",
            "diamond_amount": 0,
            "bonus_amount": 0,
            "selling_price": Decimal("30.00"),
            "provider_cost": Decimal("20.00"),
            "provider_sku": "FF_LIKES_200",
            "sort_order": 50,
            "tag": "Hot",
        },
        {
            "name": "500 FF Likes",
            "slug": "500-ff-likes",
            "category": "FF Likes",
            "diamond_amount": 0,
            "bonus_amount": 0,
            "selling_price": Decimal("70.00"),
            "provider_cost": Decimal("50.00"),
            "provider_sku": "FF_LIKES_500",
            "sort_order": 51,
            "tag": None,
        },
        {
            "name": "1000 FF Likes",
            "slug": "1000-ff-likes",
            "category": "FF Likes",
            "diamond_amount": 0,
            "bonus_amount": 0,
            "selling_price": Decimal("130.00"),
            "provider_cost": Decimal("90.00"),
            "provider_sku": "FF_LIKES_1000",
            "sort_order": 52,
            "tag": "Popular",
        },
    ]

    for p_data in products_to_seed:
        existing = await db.execute(select(TopupProduct).where(TopupProduct.slug == p_data["slug"]))
        if not existing.scalars().first():
            prod = TopupProduct(
                game_id=game.id,
                name=p_data["name"],
                slug=p_data["slug"],
                category=p_data["category"],
                diamond_amount=p_data["diamond_amount"],
                bonus_amount=p_data["bonus_amount"],
                provider_sku=p_data["provider_sku"],
                selling_price=p_data["selling_price"],
                provider_cost=p_data["provider_cost"],
                currency="BDT",
                active=True,
                sort_order=p_data["sort_order"],
                tag=p_data.get("tag"),
            )
            db.add(prod)
    await db.commit()

    # 4. Seed Payment Methods
    payment_methods_to_seed = [
        {
            "name": "bKash",
            "code": "BKASH",
            "type": "MANUAL",
            "account_number": "01700000000",
            "account_type": "Personal",
            "instructions": "Go to your bKash app or dial *247#. Select 'Send Money'. Enter the number above and enter the exact amount. After sending, enter the 10-character Transaction ID (TrxID) below.",
            "logo_url": "/images/bkash.png",
            "active": True,
            "sort_order": 1,
        },
        {
            "name": "Nagad",
            "code": "NAGAD",
            "type": "MANUAL",
            "account_number": "01800000000",
            "account_type": "Personal",
            "instructions": "Go to your Nagad app or dial *167#. Select 'Send Money'. Enter the number above and enter the exact amount. After sending, enter the 8-character Transaction ID below.",
            "logo_url": "/images/nagad.png",
            "active": True,
            "sort_order": 2,
        },
        {
            "name": "Rocket",
            "code": "ROCKET",
            "type": "MANUAL",
            "account_number": "01900000000-0",
            "account_type": "Personal",
            "instructions": "Go to your Rocket app or dial *322#. Select 'Send Money'. Enter the number above. Enter the Transaction ID below after sending.",
            "logo_url": "/images/rocket.png",
            "active": True,
            "sort_order": 3,
        },
    ]

    for pm_data in payment_methods_to_seed:
        existing = await db.execute(select(PaymentMethod).where(PaymentMethod.code == pm_data["code"]))
        if not existing.scalars().first():
            pm = PaymentMethod(
                name=pm_data["name"],
                code=pm_data["code"],
                type=pm_data["type"],
                account_number=pm_data["account_number"],
                account_type=pm_data["account_type"],
                instructions=pm_data["instructions"],
                logo_url=pm_data.get("logo_url"),
                active=pm_data["active"],
                sort_order=pm_data["sort_order"],
            )
            db.add(pm)
    await db.commit()

    # 5. Seed Banners
    banners_to_seed = [
        {
            "title": "Exclusive Weekly Offer",
            "subtitle": "Get up to 30% bonus diamonds on your first top-up this week.",
            "image_url": "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop",
            "link_url": "/uid-topup",
            "active": True,
            "sort_order": 1,
        },
        {
            "title": "Instant Delivery System",
            "subtitle": "Diamond delivered to your Free Fire account in less than 2 minutes.",
            "image_url": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop",
            "link_url": "/uid-topup",
            "active": True,
            "sort_order": 2,
        },
    ]
    for b_data in banners_to_seed:
        existing = await db.execute(select(Banner).where(Banner.title == b_data["title"]))
        if not existing.scalars().first():
            banner = Banner(**b_data)
            db.add(banner)
    await db.commit()

    # 6. Seed Site Settings
    settings_to_seed = {
        "site_title": "XoXo Shop",
        "notice": "১৮ বছরের নিচে কেউ অর্ডার করবেন না! বাবা/মা বা ফ্যামিলির টাকা চুরি করে অর্ডার করলে তার বিরুদ্ধে আইনগত ব্যবস্থা নেওয়া হবে!",
        "support_phone": "01700000000",
        "support_telegram": "https://t.me/xoxoshop_support",
        "support_facebook_group": "https://facebook.com/groups/xoxoshop",
        "maintenance_mode": "false",
        "diamond_api_url": "https://api.xoxotopup.com/v1/diamonds",
        "diamond_api_key": "sk_live_xoxo_topup_api_key_8849",
        "diamond_api_mode": "LOCAL",
        "gemini_api_key": "",
        "gemini_model": "gemini-2.5-flash",
    }
    for k, v in settings_to_seed.items():
        existing = await db.execute(select(SiteSetting).where(SiteSetting.key == k))
        if not existing.scalars().first():
            db.add(SiteSetting(key=k, value=v, is_public=True))
    await db.commit()

    # 7. Seed Default Admin User
    admin_email = "admin@xoxoshop.com"
    admin_res = await db.execute(select(Profile).where(Profile.email == admin_email))
    admin_profile = admin_res.scalars().first()
    if not admin_profile:
        admin_profile = Profile(
            auth_user_id="admin-root-001",
            email=admin_email,
            full_name="Super Administrator",
            phone="01700000000",
            status="ACTIVE",
            is_active=True,
        )
        db.add(admin_profile)
        await db.flush()

        db.add(UserRole(user_id=admin_profile.id, role_code=RoleCode.ADMIN.value))
        db.add(UserRole(user_id=admin_profile.id, role_code=RoleCode.SUPER_ADMIN.value))
        await db.commit()

    logger.info("Database initialized and seeded successfully.")
