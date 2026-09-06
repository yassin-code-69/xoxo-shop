from app.core.config import settings
from app.integrations.providers.base import TopupProvider
from app.integrations.providers.fazercards import FazerCardsTopupProvider
from app.integrations.providers.mock import MockTopupProvider

_provider_instance: TopupProvider | None = None


def get_active_provider(api_key: str | None = None) -> TopupProvider:
    global _provider_instance
    provider_name = (settings.PROVIDER_NAME or "").lower().strip()
    key_to_use = (api_key or settings.PROVIDER_API_KEY or "").strip()

    if provider_name in ["fazercards", "fzr"] or key_to_use.startswith("fc_"):
        return FazerCardsTopupProvider(api_key=key_to_use)

    if _provider_instance is None:
        if provider_name == "mock":
            _provider_instance = MockTopupProvider()
        else:
            _provider_instance = MockTopupProvider()
    return _provider_instance
