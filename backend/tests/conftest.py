import os

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

import app.db.session as db_session_module
import app.workers.tasks as workers_tasks_module
from app.core.config import settings
from app.core.security import create_access_token
from app.db.base import Base
from app.db.init_db import bootstrap_admin_auth_id, seed_initial_data
from app.main import app

TEST_DB_FILE = "./test_xoxo_db.sqlite"
TEST_DATABASE_URL = f"sqlite+aiosqlite:///{TEST_DB_FILE}"

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)

TestingSessionLocal = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# Patch AsyncSessionLocal globally in db session module and workers module
db_session_module.AsyncSessionLocal = TestingSessionLocal
workers_tasks_module.AsyncSessionLocal = TestingSessionLocal


@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_test_database():
    if os.path.exists(TEST_DB_FILE):
        try:
            os.remove(TEST_DB_FILE)
        except OSError:
            pass

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with TestingSessionLocal() as session:
        await seed_initial_data(session)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    if os.path.exists(TEST_DB_FILE):
        try:
            os.remove(TEST_DB_FILE)
        except OSError:
            pass


@pytest_asyncio.fixture
async def db_session():
    async with TestingSessionLocal() as session:
        yield session


@pytest_asyncio.fixture
async def client():
    async def override_get_db():
        async with TestingSessionLocal() as session:
            try:
                yield session
            finally:
                await session.close()

    app.dependency_overrides[db_session_module.get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest.fixture
def customer_token():
    payload = {
        "sub": "test-customer-uid-12345",
        "email": "customer@test.com",
        "user_metadata": {"full_name": "Test Customer", "role": "CUSTOMER"},
        "aud": "authenticated",
        "role": "authenticated",
    }
    return create_access_token(payload)


@pytest.fixture
def customer_headers(customer_token):
    return {"Authorization": f"Bearer {customer_token}"}


@pytest.fixture
def admin_token():
    # Matches the bootstrap admin seeded by seed_initial_data(); admin rights come from
    # the seeded role rows, never from the email claim in the token.
    payload = {
        "sub": bootstrap_admin_auth_id(settings.ADMIN_EMAIL),
        "email": settings.ADMIN_EMAIL,
        "user_metadata": {"full_name": "Admin Super", "role": "ADMIN"},
        "aud": "authenticated",
        "role": "authenticated",
    }
    return create_access_token(payload)


@pytest.fixture
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}
