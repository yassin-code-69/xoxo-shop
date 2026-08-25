"""Guards for outbound HTTP requests whose URL comes from user input."""

import ipaddress
import socket
from urllib.parse import urlparse

from app.core.exceptions import ValidationError

ALLOWED_SCHEMES = ("http", "https")


def _is_blocked_ip(ip: str) -> bool:
    try:
        addr = ipaddress.ip_address(ip)
    except ValueError:
        return True
    return (
        addr.is_private
        or addr.is_loopback
        or addr.is_link_local  # 169.254.0.0/16 - cloud instance metadata
        or addr.is_reserved
        or addr.is_multicast
        or addr.is_unspecified
    )


def validate_outbound_url(raw_url: str) -> str:
    """Rejects URLs that would make the server fetch its own internal network.

    Without this, an "API URL" field is a request forwarder: an admin (or anyone who
    takes over an admin session) could point it at 169.254.169.254 or a private address
    and read cloud credentials or internal services through our response body.
    """
    url = (raw_url or "").strip()
    if not url:
        raise ValidationError(message="URL cannot be empty", code="INVALID_URL")

    parsed = urlparse(url)
    if parsed.scheme.lower() not in ALLOWED_SCHEMES:
        raise ValidationError(message="Only http and https URLs are allowed", code="INVALID_URL_SCHEME")

    hostname = parsed.hostname
    if not hostname:
        raise ValidationError(message="URL must include a hostname", code="INVALID_URL_HOST")

    try:
        resolved = socket.getaddrinfo(hostname, None)
    except socket.gaierror as exc:
        raise ValidationError(message=f"Could not resolve host '{hostname}'", code="UNRESOLVABLE_HOST") from exc

    for info in resolved:
        if _is_blocked_ip(info[4][0]):
            raise ValidationError(
                message="This URL points to an internal address and cannot be used",
                code="BLOCKED_INTERNAL_URL",
            )

    return url
