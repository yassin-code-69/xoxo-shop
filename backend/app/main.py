from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware

import app.db.models  # noqa: F401 - Register all SQLAlchemy models
from app.api.v1.router import api_router
from app.core.config import settings
from app.core.logging import logger, setup_logging
from app.core.middleware import RequestCorrelationMiddleware, SecurityHeadersMiddleware
from app.db.init_db import init_db


def check_production_config() -> None:
    """Fails fast instead of booting a production server with insecure defaults."""
    if not settings.is_production:
        return

    if settings.DEBUG:
        # Not fatal: docs are force-disabled in production anyway (see create_app), but
        # DEBUG also loosens error verbosity, so it should be turned off.
        logger.warning("DEBUG is true in a production environment - set DEBUG=false.")

    if not (settings.SUPABASE_JWT_SECRET or "").strip():
        # Fatal: without it no token can be verified, so every request would fail anyway.
        # Better to stop here than to serve an app whose auth cannot work.
        raise RuntimeError(
            "Insecure production configuration: SUPABASE_JWT_SECRET is required "
            "(access tokens cannot be verified without it)"
        )


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    logger.info(f"Starting {settings.APP_NAME} in [{settings.APP_ENV}] mode...")
    check_production_config()
    await init_db()
    yield
    logger.info(f"Shutting down {settings.APP_NAME}...")


def create_app() -> FastAPI:
    # The schema maps every endpoint and payload shape, so it is never published from a
    # production deployment - not even if DEBUG was left on by accident.
    expose_docs = settings.DEBUG and not settings.is_production

    app = FastAPI(
        title=settings.APP_NAME,
        version="1.0.0",
        description="Production-ready Free Fire Diamond Top-Up Backend API",
        openapi_url="/api/v1/openapi.json" if expose_docs else None,
        docs_url="/docs" if expose_docs else None,
        redoc_url="/redoc" if expose_docs else None,
        lifespan=lifespan,
    )

    # Middleware
    app.add_middleware(RequestCorrelationMiddleware)
    app.add_middleware(SecurityHeadersMiddleware)

    allowed_hosts = [h.strip() for h in (settings.ALLOWED_HOSTS or []) if h.strip()]
    if allowed_hosts and allowed_hosts != ["*"]:
        app.add_middleware(TrustedHostMiddleware, allowed_hosts=allowed_hosts)

    # Only origins we explicitly list may make credentialed requests. A wildcard, or a
    # regex like ".*\.vercel\.app", would let anybody's deployment call this API.
    cors_origins = [str(o).strip() for o in (settings.BACKEND_CORS_ORIGINS or []) if str(o).strip()]
    if not cors_origins:
        cors_origins = ["http://localhost:3000", "http://127.0.0.1:3000"]
        logger.warning("BACKEND_CORS_ORIGINS is empty - falling back to localhost origins only.")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_origin_regex=settings.BACKEND_CORS_ORIGIN_REGEX or None,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
        max_age=600,
    )

    # Include API router
    app.include_router(api_router, prefix=settings.API_V1_STR)

    @app.get("/", tags=["Root"])
    async def root():
        return {
            "app": settings.APP_NAME,
            "version": "1.0.0",
            "docs": "/docs" if expose_docs else None,
            "health": f"{settings.API_V1_STR}/health",
        }

    return app


app = create_app()

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
