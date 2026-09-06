import asyncio
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import text
from app.db.session import async_engine

INDEXES = [
    # 1. Critical created_at indexes for sorting & filtering
    "CREATE INDEX IF NOT EXISTS ix_orders_created_at ON orders (created_at DESC);",
    "CREATE INDEX IF NOT EXISTS ix_payments_created_at ON payments (created_at DESC);",
    "CREATE INDEX IF NOT EXISTS ix_audit_logs_created_at ON audit_logs (created_at DESC);",

    # 2. Foreign key indexes for fast JOINs and relation lookups
    "CREATE INDEX IF NOT EXISTS ix_orders_product_id ON orders (product_id);",
    "CREATE INDEX IF NOT EXISTS ix_orders_game_id ON orders (game_id);",
    "CREATE INDEX IF NOT EXISTS ix_user_roles_role_code ON user_roles (role_code);",

    # 3. Composite indexes for high-frequency admin and customer filters
    "CREATE INDEX IF NOT EXISTS ix_orders_payment_status_created_at ON orders (payment_status, created_at DESC);",
    "CREATE INDEX IF NOT EXISTS ix_orders_order_status_created_at ON orders (order_status, created_at DESC);",
    "CREATE INDEX IF NOT EXISTS ix_orders_user_id_created_at ON orders (user_id, created_at DESC);",

    # 4. Partial indexes for near-instant dashboard metrics & pending queues
    "CREATE INDEX IF NOT EXISTS ix_payments_pending_submitted ON payments (created_at) WHERE status = 'SUBMITTED';",
    "CREATE INDEX IF NOT EXISTS ix_orders_processing_fulfillment ON orders (created_at) WHERE fulfillment_status = 'PROCESSING';",
    "CREATE INDEX IF NOT EXISTS ix_orders_failed_fulfillment ON orders (created_at) WHERE fulfillment_status = 'FAILED';",
]

async def apply_indexes():
    print("Connecting to database to apply performance indexes...")
    async with async_engine.begin() as conn:
        for sql in INDEXES:
            print(f"Executing: {sql}")
            await conn.execute(text(sql))
    print("All performance indexes successfully created and active!")

if __name__ == "__main__":
    asyncio.run(apply_indexes())
