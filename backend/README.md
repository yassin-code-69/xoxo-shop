# Free Fire Diamond Top-Up Platform — Backend API

Production-ready FastAPI backend for the Free Fire Diamond Top-Up Platform.

## Architecture Highlights
- **FastAPI & Pydantic v2**: High performance, typed request/response schemas, standardized error envelope.
- **SQLAlchemy 2.x (Async)**: Dialect-independent ORM supporting PostgreSQL (Supabase) with asyncpg, and SQLite with aiosqlite for testing/development.
- **Alembic**: Migration-driven database management.
- **Role-Based Access Control (RBAC)**: Backend enforced permissions (`CUSTOMER`, `SUPPORT`, `ADMIN`, `SUPER_ADMIN`).
- **Server-Authoritative Pricing**: Customers never specify prices; prices are determined securely on the backend with snapshot immutability.
- **Manual Payment Workflow**: bKash, Nagad, Rocket transaction ID submission, duplicate protection, and 1-click admin approval/rejection.
- **Provider Abstraction**: Decoupled diamond provider adapter interface with configurable mock simulation and non-blocking background fulfillment worker.
- **Idempotency & Concurrency Protection**: Multi-admin collision prevention, single-fulfillment guarantees, and retry management.
- **Audit Logging**: Append-only operational logging for sensitive actions (approvals, rejections, pricing updates, settings).

## Getting Started

### 1. Environment Setup
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 2. Configure Environment
```bash
cp .env.example .env
```

### 3. Run Migrations & Seed Database
```bash
alembic upgrade head
python -c "import asyncio; from app.db.init_db import init_db; asyncio.run(init_db())"
```

### 4. Run the Development Server
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Interactive OpenAPI documentation will be available at `http://localhost:8000/docs`.

### 5. Run Automated Tests
```bash
pytest
```
