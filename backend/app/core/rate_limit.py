import time
from collections import defaultdict

from fastapi import Request

from app.core.config import settings
from app.core.exceptions import AppException


class InMemoryRateLimiter:
    """Fixed-window request counter kept in this process's memory.

    Note the scope: limits are per worker process, so N workers allow N times the
    configured rate, and a restart clears all counters. That is fine as a brake on
    casual abuse, but a shared store (Redis) is what makes limits real across a
    horizontally scaled deployment.
    """

    def __init__(self, prune_interval_seconds: int = 300):
        self._history: dict[str, list[float]] = defaultdict(list)
        self._prune_interval = prune_interval_seconds
        self._last_prune = time.time()

    def is_allowed(self, key: str, max_requests: int, window_seconds: int) -> bool:
        now = time.time()
        window_start = now - window_seconds

        # Prune older records
        records = [ts for ts in self._history[key] if ts > window_start]
        self._history[key] = records

        self._prune_stale_keys(now, window_seconds)

        if len(records) >= max_requests:
            return False

        self._history[key].append(now)
        return True

    def _prune_stale_keys(self, now: float, window_seconds: int) -> None:
        """Drops keys nobody has touched recently.

        Without this, every distinct client IP would keep an entry forever, which turns
        the limiter itself into a slow memory-exhaustion target.
        """
        if now - self._last_prune < self._prune_interval:
            return
        cutoff = now - max(window_seconds, self._prune_interval)
        stale = [key for key, hits in self._history.items() if not hits or hits[-1] < cutoff]
        for key in stale:
            del self._history[key]
        self._last_prune = now


limiter = InMemoryRateLimiter()


def get_client_ip(request: Request) -> str:
    """Resolves the caller's IP, trusting only as many proxy hops as are configured.

    X-Forwarded-For is client-supplied. Taking its left-most entry lets anyone reset
    their own rate limit by sending a new fake IP on every request, so entries are read
    from the right and only TRUSTED_PROXY_COUNT of them are believed.
    """
    trusted_hops = max(0, settings.TRUSTED_PROXY_COUNT)
    direct_ip = request.client.host if request.client else "unknown"

    if trusted_hops == 0:
        return direct_ip

    forwarded = request.headers.get("X-Forwarded-For", "")
    chain = [part.strip() for part in forwarded.split(",") if part.strip()]
    if not chain:
        return direct_ip

    # The right-most entry was added by our own proxy; step back one entry per hop.
    index = len(chain) - trusted_hops
    return chain[index] if 0 <= index < len(chain) else chain[0]


def rate_limit(max_requests: int = 30, window_seconds: int = 60):
    async def dependency(request: Request):
        key = f"{request.url.path}:{get_client_ip(request)}"
        if not limiter.is_allowed(key, max_requests=max_requests, window_seconds=window_seconds):
            raise AppException(
                message="Too many requests. Please slow down and try again.",
                code="RATE_LIMIT_EXCEEDED",
                status_code=429,
            )

    return dependency
