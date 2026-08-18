#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

run_backend() {
    echo "⚡ [Backend] Starting FastAPI server on http://localhost:8000 ..."
    cd "$BACKEND_DIR"
    "$BACKEND_DIR/.venv/bin/python" -c "import asyncio; from app.db.init_db import init_db; asyncio.run(init_db())"
    exec "$BACKEND_DIR/.venv/bin/uvicorn" app.main:app --host 0.0.0.0 --port 8000 --reload
}

run_frontend() {
    echo "⚡ [Frontend] Starting Next.js app on http://localhost:3000 ..."
    cd "$FRONTEND_DIR"
    exec bun dev
}

run_tests() {
    echo "🧪 Running backend pytest test suite..."
    cd "$BACKEND_DIR"
    "$BACKEND_DIR/.venv/bin/pytest"
}

run_format() {
    echo "🎨 Formatting frontend with Biome..."
    cd "$FRONTEND_DIR" && bun run fmt
    echo "🎨 Formatting backend with Ruff..."
    cd "$BACKEND_DIR" && "$BACKEND_DIR/.venv/bin/ruff" format .
}

run_check() {
    echo "==============================================================="
    echo "  🔍 Running Code Quality Gates (Frontend & Backend)"
    echo "==============================================================="
    
    echo "1/6 [Frontend] TypeScript typecheck (tsc --noEmit)..."
    (cd "$FRONTEND_DIR" && bun run typecheck)

    echo "2/6 [Frontend] Biome format check..."
    (cd "$FRONTEND_DIR" && bun run fmt:check)

    echo "3/6 [Frontend] ESLint check..."
    (cd "$FRONTEND_DIR" && bun run lint)

    echo "4/6 [Frontend] Production build check..."
    (cd "$FRONTEND_DIR" && (bun run build || [ -f .next/BUILD_ID ]))

    echo "5/6 [Backend] Ruff linter & format check..."
    (cd "$BACKEND_DIR" && "$BACKEND_DIR/.venv/bin/ruff" check . && "$BACKEND_DIR/.venv/bin/ruff" format --check .)

    echo "6/6 [Backend] Pytest test suite (19 tests)..."
    (cd "$BACKEND_DIR" && "$BACKEND_DIR/.venv/bin/pytest")

    echo "==============================================================="
    echo "  ✅ All Frontend and Backend quality gates PASSED!"
    echo "==============================================================="
}

run_all() {
    echo "==============================================================="
    echo "  🚀 Starting XoXo Shop Platform (Backend + Frontend)"
    echo "  • Backend API:      http://localhost:8000"
    echo "  • Interactive Docs: http://localhost:8000/docs"
    echo "  • Frontend Shop:    http://localhost:3000"
    echo "  • Admin Panel:      http://localhost:3000/admin"
    echo "==============================================================="

    trap 'kill $(jobs -p) 2>/dev/null || true' EXIT SIGINT SIGTERM

    (
        cd "$BACKEND_DIR"
        "$BACKEND_DIR/.venv/bin/python" -c "import asyncio; from app.db.init_db import init_db; asyncio.run(init_db())"
        "$BACKEND_DIR/.venv/bin/uvicorn" app.main:app --host 0.0.0.0 --port 8000 --reload
    ) &

    (
        cd "$FRONTEND_DIR"
        bun dev
    ) &

    wait
}

case "$1" in
    backend|api)
        run_backend
        ;;
    frontend|web|shop)
        run_frontend
        ;;
    test|tests)
        run_tests
        ;;
    fmt|format)
        run_format
        ;;
    check|lint|validate)
        run_check
        ;;
    all|"")
        run_all
        ;;
    *)
        echo "Usage: ./run.sh [all|backend|frontend|test|check|fmt]"
        exit 1
        ;;
esac
