from fastapi import APIRouter, Depends, Response
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.logging import logger
from app.db.session import get_db

router = APIRouter(tags=["Health"])


@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "environment": settings.APP_ENV,
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
