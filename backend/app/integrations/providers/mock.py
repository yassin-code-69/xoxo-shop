import uuid
from typing import Any

from app.core.config import settings
from app.core.logging import logger
from app.integrations.providers.base import (
    ProviderResult,
    ProviderStatus,
    TopupProvider,
)


class MockTopupProvider(TopupProvider):
    def __init__(self, default_outcome: str | None = None):
        self.outcome = default_outcome or settings.MOCK_PROVIDER_OUTCOME

    async def submit_topup(
        self,
        player_uid: str,
        player_server: str | None,
        provider_sku: str,
        client_reference: str,
        quantity: int = 1,
        metadata: dict[str, Any] | None = None,
    ) -> ProviderResult:
        logger.info(f"[MockProvider] Topup requested for UID={player_uid}, SKU={provider_sku}, Ref={client_reference}")
        # Check simulated outcome from settings or UID special values
        outcome = self.outcome
        if "fail_perm" in player_uid.lower():
            outcome = "permanent_fail"
        elif "fail_temp" in player_uid.lower():
            outcome = "temporary_fail"
        elif "process" in player_uid.lower():
            outcome = "processing"

        provider_order_id = f"MOCK-PRV-{uuid.uuid4().hex[:8].upper()}"

        if outcome == "success":
            return ProviderResult(
                status=ProviderStatus.SUCCESS,
                provider_order_id=provider_order_id,
                client_reference=client_reference,
                raw_response={"status": "delivered", "tx_id": provider_order_id},
            )
        elif outcome == "processing":
            return ProviderResult(
                status=ProviderStatus.PROCESSING,
                provider_order_id=provider_order_id,
                client_reference=client_reference,
                raw_response={"status": "in_progress", "tx_id": provider_order_id},
            )
        elif outcome == "temporary_fail":
            return ProviderResult(
                status=ProviderStatus.FAILED_TEMPORARY,
                client_reference=client_reference,
                error_code="PROVIDER_TIMEOUT",
                error_message="Provider server temporarily unresponsive. Please retry.",
                raw_response={"error": "gateway_timeout"},
            )
        else:
            return ProviderResult(
                status=ProviderStatus.FAILED_PERMANENT,
                client_reference=client_reference,
                error_code="INVALID_PLAYER_UID",
                error_message="The player UID does not exist on the target game server.",
                raw_response={"error": "account_not_found"},
            )

    async def get_order_status(self, provider_order_id: str, client_reference: str) -> ProviderResult:
        return ProviderResult(
            status=ProviderStatus.SUCCESS,
            provider_order_id=provider_order_id,
            client_reference=client_reference,
            raw_response={"status": "delivered"},
        )
