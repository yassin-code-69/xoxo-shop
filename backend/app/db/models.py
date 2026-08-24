# Aggregated models import for SQLAlchemy metadata registration
from app.db.base import Base
from app.modules.audit.model import AuditLog
from app.modules.banners.model import Banner
from app.modules.contact.model import ContactMessage
from app.modules.fulfillment.model import ProviderOrder
from app.modules.games.model import Game
from app.modules.orders.model import Order, OrderStatusHistory
from app.modules.payment_methods.model import PaymentMethod
from app.modules.payments.model import Payment, PaymentAttempt
from app.modules.products.model import TopupProduct
from app.modules.roles.model import Role, UserRole
from app.modules.settings.model import SiteSetting
from app.modules.users.model import Profile

__all__ = [
    "AuditLog",
    "Banner",
    "Base",
    "ContactMessage",
    "Game",
    "Order",
    "OrderStatusHistory",
    "Payment",
    "PaymentAttempt",
    "PaymentMethod",
    "Profile",
    "ProviderOrder",
    "Role",
    "SiteSetting",
    "TopupProduct",
    "UserRole",
]
