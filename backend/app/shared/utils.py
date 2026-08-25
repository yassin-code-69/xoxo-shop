import re
import secrets
from datetime import UTC, datetime

# Excludes look-alike characters so ids stay easy to read out over support chat.
_ID_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"


def generate_public_order_id(prefix: str = "FF") -> str:
    """Generates a unique, non-sequential public order ID like FF-260818-K8N2PWQF.

    Uses `secrets` rather than `random`: these ids identify an order in support
    conversations and callbacks, so they must not be predictable or enumerable.
    """
    now = datetime.now(UTC)
    date_part = now.strftime("%y%m%d")
    chars = "".join(secrets.choice(_ID_ALPHABET) for _ in range(8))
    return f"{prefix}-{date_part}-{chars}"


def slugify(text: str) -> str:
    """Generate URL-safe slug from text"""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    return text.strip("-")
