from datetime import UTC, datetime


def utcnow() -> datetime:
    """Returns current timezone-aware UTC datetime."""
    return datetime.now(UTC)
