import time
from collections import defaultdict

from fastapi import Request

from app.core.exceptions import AppException


class InMemoryRateLimiter:
    def __init__(self):
        self._history: dict[str, list[float]] = defaultdict(list)

    def is_allowed(self, key: str, max_requests: int, window_seconds: int) -> bool:
        now = time.time()
        window_start = now - window_seconds

        # Prune older records
        records = [ts for ts in self._history[key] if ts > window_start]
        self._history[key] = records

        if len(records) >= max_requests:
            return False

        self._history[key].append(now)
        return True


limiter = InMemoryRateLimiter()


def rate_limit(max_requests: int = 30, window_seconds: int = 60):
    async def dependency(request: Request):
        # Extract client identifier: X-Forwarded-For or client IP
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            client_ip = forwarded.split(",")[0].strip()
        elif request.client:
            client_ip = request.client.host
        else:
            client_ip = "127.0.0.1"

        key = f"{request.url.path}:{client_ip}"
        if not limiter.is_allowed(key, max_requests=max_requests, window_seconds=window_seconds):
            raise AppException(
                message="Too many requests. Please slow down and try again.",
                code="RATE_LIMIT_EXCEEDED",
                status_code=429,
            )

    return dependency
