import json
from typing import Any
import httpx

from app.core.config import settings
from app.core.logging import logger
from app.integrations.providers.base import (
    ProviderResult,
    ProviderStatus,
    TopupProvider,
)


class FazerCardsTopupProvider(TopupProvider):
    """Integration provider for FazerCards (https://api.fzr.cards/api/v2)."""

    def __init__(self, api_key: str | None = None, base_url: str = "https://api.fzr.cards/api/v2"):
        self.api_key = (api_key or settings.PROVIDER_API_KEY or "").strip()
        self.base_url = base_url.rstrip("/")

    @staticmethod
    def _resolve_offer_id(sku: str) -> str:
        s = str(sku or "").strip().lower().replace("-", "_")
        mapping = {
            "ff_25": "25_diamonds",
            "ff_50": "50_diamonds",
            "ff_115": "115_diamonds",
            "ff_240": "240_diamonds",
            "ff_610": "610_diamonds",
            "ff_1240": "1240_diamonds",
            "ff_2530": "2530_diamonds",
            "ff_2830": "2830_diamonds",
            "ff_weekly": "weekly_membership",
            "ff_weekly_lite": "weekly_lite",
            "ff_monthly": "monthly_membership",
            "weekly_membership": "weekly_membership",
            "weekly_lite": "weekly_lite",
            "monthly_membership": "monthly_membership",
        }
        if s in mapping:
            return mapping[s]

        if s.endswith("_diamonds") or s.endswith("_membership") or s.endswith("_lite"):
            return s

        import re
        m = re.search(r"(\d+)", s)
        if m:
            return f"{m.group(1)}_diamonds"

        return s

    async def submit_topup(
        self,
        player_uid: str,
        player_server: str | None,
        provider_sku: str,
        client_reference: str,
        quantity: int = 1,
        metadata: dict[str, Any] | None = None,
    ) -> ProviderResult:
        logger.info(
            f"[FazerCardsProvider] Submitting topup UID={player_uid}, SKU={provider_sku}, Ref={client_reference}"
        )

        if not self.api_key or self.api_key == "mock-key":
            return ProviderResult(
                status=ProviderStatus.FAILED_PERMANENT,
                client_reference=client_reference,
                error_code="PROVIDER_NOT_CONFIGURED",
                error_message="FazerCards API key is not configured.",
            )

        url = f"{self.base_url}/topups/order"
        headers = {
            "X-API-Key": self.api_key,
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "XoXoShop/1.0",
        }

        # Normalize SKU for FazerCards (e.g. 'FF_115' -> '115_diamonds')
        offer_id = self._resolve_offer_id(provider_sku)
        logger.info(f"[FazerCardsProvider] Resolved provider_sku '{provider_sku}' -> offer_id '{offer_id}'")

        payload = {
            "category_id": "free_fire_bd",
            "offer_id": offer_id,
            "fields": {
                "player_id": str(player_uid).strip(),
            },
        }

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(url, json=payload, headers=headers)
                resp_data: dict[str, Any] = {}
                try:
                    resp_data = resp.json()
                except Exception:
                    resp_data = {"raw": resp.text}

                if resp.is_success and resp_data.get("ok"):
                    provider_order_id = (
                        resp_data.get("order_id")
                        or resp_data.get("id")
                        or f"FZR-{client_reference}"
                    )
                    status_str = resp_data.get("status", "completed").lower()
                    if status_str in ["completed", "success", "delivered"]:
                        status = ProviderStatus.SUCCESS
                    else:
                        status = ProviderStatus.PROCESSING

                    return ProviderResult(
                        status=status,
                        provider_order_id=str(provider_order_id),
                        client_reference=client_reference,
                        raw_response=resp_data,
                    )

                # Error handling
                error_msg = resp_data.get("error") or resp_data.get("message") or f"HTTP {resp.status_code}"
                logger.warning(f"[FazerCardsProvider] Order submission error: {error_msg}")

                if resp.status_code == 400 and "balance" in str(error_msg).lower():
                    return ProviderResult(
                        status=ProviderStatus.FAILED_TEMPORARY,
                        client_reference=client_reference,
                        error_code="INSUFFICIENT_PROVIDER_BALANCE",
                        error_message="FazerCards account has insufficient balance. Please deposit funds.",
                        raw_response=resp_data,
                    )

                if resp.status_code in [408, 429, 500, 502, 503, 504]:
                    return ProviderResult(
                        status=ProviderStatus.FAILED_TEMPORARY,
                        client_reference=client_reference,
                        error_code="PROVIDER_SERVER_ERROR",
                        error_message=str(error_msg),
                        raw_response=resp_data,
                    )

                return ProviderResult(
                    status=ProviderStatus.FAILED_PERMANENT,
                    client_reference=client_reference,
                    error_code="ORDER_REJECTED",
                    error_message=str(error_msg),
                    raw_response=resp_data,
                )

        except httpx.TimeoutException:
            logger.error(f"[FazerCardsProvider] Timeout connecting for Ref={client_reference}")
            return ProviderResult(
                status=ProviderStatus.FAILED_TEMPORARY,
                client_reference=client_reference,
                error_code="PROVIDER_TIMEOUT",
                error_message="Connection to FazerCards API timed out.",
            )
        except Exception as exc:
            logger.error(f"[FazerCardsProvider] Unexpected exception: {exc}")
            return ProviderResult(
                status=ProviderStatus.FAILED_TEMPORARY,
                client_reference=client_reference,
                error_code="PROVIDER_ERROR",
                error_message=str(exc),
            )

    async def get_order_status(self, provider_order_id: str, client_reference: str) -> ProviderResult:
        if not self.api_key:
            return ProviderResult(
                status=ProviderStatus.FAILED_PERMANENT,
                client_reference=client_reference,
                error_message="FazerCards API key missing.",
            )

        url = f"{self.base_url}/orders/{provider_order_id}"
        headers = {"X-API-Key": self.api_key, "Accept": "application/json"}

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url, headers=headers)
                if resp.is_success:
                    data = resp.json()
                    st = str(data.get("status", "")).lower()
                    if st in ["completed", "delivered", "success"]:
                        status = ProviderStatus.SUCCESS
                    elif st in ["failed", "canceled", "rejected"]:
                        status = ProviderStatus.FAILED_PERMANENT
                    else:
                        status = ProviderStatus.PROCESSING
                    return ProviderResult(
                        status=status,
                        provider_order_id=provider_order_id,
                        client_reference=client_reference,
                        raw_response=data,
                    )
        except Exception as ex:
            logger.warning(f"[FazerCardsProvider] Status query error: {ex}")

        return ProviderResult(
            status=ProviderStatus.PROCESSING,
            provider_order_id=provider_order_id,
            client_reference=client_reference,
        )
