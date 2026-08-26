from fastapi import APIRouter

from app.api.v1 import (
    auth,
    banners,
    contact,
    health,
    orders,
    payment_methods,
    payments,
    products,
    profile,
    settings,
    uid_checker,
)
from app.api.v1.admin import (
    audit_logs as admin_audit_logs,
)
from app.api.v1.admin import (
    banners as admin_banners,
)
from app.api.v1.admin import (
    contact_messages as admin_contact_messages,
)
from app.api.v1.admin import (
    customers as admin_customers,
)
from app.api.v1.admin import (
    dashboard,
)
from app.api.v1.admin import (
    orders as admin_orders,
)
from app.api.v1.admin import (
    payment_methods as admin_payment_methods,
)
from app.api.v1.admin import (
    payments as admin_payments,
)
from app.api.v1.admin import (
    products as admin_products,
)
from app.api.v1.admin import (
    providers as admin_providers,
)
from app.api.v1.admin import (
    settings as admin_settings,
)

api_router = APIRouter()

# Health & System
api_router.include_router(health.router)

# Authentication & User Sync
api_router.include_router(auth.router)

# Public & Customer APIs
api_router.include_router(products.router)
api_router.include_router(payment_methods.router)
api_router.include_router(orders.router)
api_router.include_router(payments.router)
api_router.include_router(contact.router)
api_router.include_router(profile.router)
api_router.include_router(banners.router)
api_router.include_router(settings.router)
api_router.include_router(uid_checker.router)

# Admin APIs
api_router.include_router(dashboard.router)
api_router.include_router(admin_orders.router)
api_router.include_router(admin_payments.router)
api_router.include_router(admin_products.router)
api_router.include_router(admin_payment_methods.router)
api_router.include_router(admin_customers.router)
api_router.include_router(admin_contact_messages.router)
api_router.include_router(admin_banners.router)
api_router.include_router(admin_settings.router)
api_router.include_router(admin_audit_logs.router)
api_router.include_router(admin_providers.router)
