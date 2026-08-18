from app.core.config import settings
from app.integrations.providers.base import TopupProvider
from app.integrations.providers.mock import MockTopupProvider

_provider_instance: TopupProvider = None


def get_active_provider() -> TopupProvider:
    global _provider_instance
    if _provider_instance is None:
        if settings.PROVIDER_NAME == "mock":
            _provider_instance = MockTopupProvider()
        else:
            _provider_instance = MockTopupProvider()
    return _provider_instance
