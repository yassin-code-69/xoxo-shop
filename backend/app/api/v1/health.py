from fastapi import APIRouter, Depends, Response
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.logging import logger
from app.db.session import get_db

router = APIRouter(tags=["Health"])


@router.get("/health")
async def health_check():
    # Temporary diagnostic: show if JWT secret is configured and its fingerprint
    # (first 6 chars of SHA256 hash) so we can verify it matches without exposing the secret
    import hashlib
    jwt_secret = (settings.SUPABASE_JWT_SECRET or "").strip()
    jwt_configured = bool(jwt_secret)
    jwt_fingerprint = hashlib.sha256(jwt_secret.encode()).hexdigest()[:6] if jwt_configured else None
    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "jwt_secret_configured": jwt_configured,
        "jwt_secret_fingerprint": jwt_fingerprint,
        "jwt_secret_length": len(jwt_secret) if jwt_configured else 0,
    }


@router.get("/ready")
async def readiness_check(response: Response, db: AsyncSession = Depends(get_db)):
    try:
        await db.execute(text("SELECT 1"))
        return {
            "status": "ready",
            "database": "connected",
        }
    except Exception as e:
        # The exception text can carry the DB host, user and driver details, so it goes
        # to the logs rather than to whoever probed the endpoint.
        logger.error(f"Readiness check failed: {e!s}")
        response.status_code = 503
        return {
            "status": "unhealthy",
            "database": "error",
        }
