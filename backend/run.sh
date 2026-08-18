#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

# Run database migrations / seed if needed
"$DIR/.venv/bin/python" -c "import asyncio; from app.db.init_db import init_db; asyncio.run(init_db())"

echo "🚀 Starting XoXo Shop Backend on http://localhost:8000 (Docs: http://localhost:8000/docs)..."
exec "$DIR/.venv/bin/uvicorn" app.main:app --host 0.0.0.0 --port 8000 --reload
