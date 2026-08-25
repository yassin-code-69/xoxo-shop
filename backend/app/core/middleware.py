import time
import uuid

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from app.core.config import settings
from app.core.exceptions import AppException
from app.core.logging import logger


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Adds the response headers browsers use to lock an API response down."""

    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        response.headers.setdefault("Cross-Origin-Opener-Policy", "same-origin")
        response.headers.setdefault("Permissions-Policy", "geolocation=(), microphone=(), camera=()")
        # This API serves JSON, not documents; a restrictive CSP costs nothing here.
        response.headers.setdefault("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'")
        if settings.is_production:
            response.headers.setdefault(
                "Strict-Transport-Security", "max-age=31536000; includeSubDomains"
            )
        return response


class RequestCorrelationMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        request.state.request_id = request_id
        start_time = time.time()
        try:
            response = await call_next(request)
            process_time = (time.time() - start_time) * 1000
            response.headers["X-Request-ID"] = request_id
            response.headers["X-Process-Time-Ms"] = f"{process_time:.2f}"
            return response
        except Exception as exc:
            process_time = (time.time() - start_time) * 1000
            if isinstance(exc, AppException):
                logger.warning(f"[{request_id}] Handled AppException: {exc.code} - {exc.message}")
                return JSONResponse(
                    status_code=exc.status_code,
                    content={
                        "error": {
                            "code": exc.code,
                            "message": exc.message,
                            "details": exc.details,
                            "request_id": request_id,
                        }
                    },
                    headers={"X-Request-ID": request_id},
                )
            logger.exception(f"[{request_id}] Unhandled Server Error: {exc!s}")
            return JSONResponse(
                status_code=500,
                content={
                    "error": {
                        "code": "INTERNAL_SERVER_ERROR",
                        "message": "An unexpected error occurred. Please try again later.",
                        "details": None,
                        "request_id": request_id,
                    }
                },
                headers={"X-Request-ID": request_id},
            )
