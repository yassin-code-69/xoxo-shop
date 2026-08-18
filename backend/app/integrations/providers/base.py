from abc import ABC, abstractmethod
from enum import StrEnum
from typing import Any

from pydantic import BaseModel


class ProviderStatus(StrEnum):
    ACCEPTED = "ACCEPTED"
    PROCESSING = "PROCESSING"
    SUCCESS = "SUCCESS"
    FAILED_TEMPORARY = "FAILED_TEMPORARY"
    FAILED_PERMANENT = "FAILED_PERMANENT"


class ProviderResult(BaseModel):
    status: ProviderStatus
    provider_order_id: str | None = None
    client_reference: str
    error_code: str | None = None
    error_message: str | None = None
    raw_response: dict[str, Any] | None = None


class TopupProvider(ABC):
    @abstractmethod
    async def submit_topup(
        self,
        player_uid: str,
        player_server: str | None,
        provider_sku: str,
        client_reference: str,
        quantity: int = 1,
        metadata: dict[str, Any] | None = None,
    ) -> ProviderResult:
        """Submit diamond topup to external provider."""

    @abstractmethod
    async def get_order_status(self, provider_order_id: str, client_reference: str) -> ProviderResult:
        """Query status of an existing provider order."""
