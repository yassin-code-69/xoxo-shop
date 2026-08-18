import random
import re
import string
from datetime import UTC, datetime


def generate_public_order_id(prefix: str = "FF") -> str:
    """Generates unique, non-sequential public order ID like FF-260818-K8N2P"""
    now = datetime.now(UTC)
    date_part = now.strftime("%y%m%d")
    chars = "".join(random.choices(string.ascii_uppercase + string.digits, k=5))
    return f"{prefix}-{date_part}-{chars}"


def slugify(text: str) -> str:
    """Generate URL-safe slug from text"""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    return text.strip("-")
