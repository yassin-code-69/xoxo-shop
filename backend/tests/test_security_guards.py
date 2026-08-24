import pytest
from app.core.config import settings
from app.core.security import create_access_token


@pytest.mark.asyncio
async def test_public_settings_does_not_leak_secrets(client, admin_headers):
    # 1. Update settings to contain sensitive keys
    await client.patch(
        "/api/v1/admin/settings",
        json={
            "settings": {
                "site_title": "XoXo Topup Safe",
                "diamond_api_key": "topsecret_api_key_12345",
                "gemini_api_key": "gemini_secret_key_67890",
            }
        },
        headers=admin_headers,
    )

    # 2. Query public settings endpoint
    public_res = await client.get("/api/v1/settings")
    assert public_res.status_code == 200
    public_data = public_res.json()

    # Verify public keys are present
    assert public_data.get("site_title") == "XoXo Topup Safe"

    # Verify private keys are NEVER leaked in public settings
    assert "diamond_api_key" not in public_data
    assert "gemini_api_key" not in public_data
    assert "topsecret_api_key_12345" not in str(public_data)


@pytest.mark.asyncio
async def test_rate_limiter_blocks_excessive_requests(client, customer_headers):
    # The orders route has rate limiting of 40 requests/min
    # Let's test a tightly-rate-limited scenario using the rate_limit dependency
    from app.core.rate_limit import InMemoryRateLimiter

    test_limiter = InMemoryRateLimiter()
    key = "test_client_ip"

    # Allowed up to 3 requests
    assert test_limiter.is_allowed(key, max_requests=3, window_seconds=60) is True
    assert test_limiter.is_allowed(key, max_requests=3, window_seconds=60) is True
    assert test_limiter.is_allowed(key, max_requests=3, window_seconds=60) is True

    # 4th request must be blocked
    assert test_limiter.is_allowed(key, max_requests=3, window_seconds=60) is False


@pytest.mark.asyncio
async def test_invalid_token_handling(client):
    # 1. Completely bogus token
    res1 = await client.get("/api/v1/me/profile", headers={"Authorization": "Bearer invalid_garbage_token"})
    assert res1.status_code == 401

    # 2. Tampered signature token in production-like verification
    from app.core.security import decode_access_token
    from app.core.exceptions import UnauthorizedError

    with pytest.raises(UnauthorizedError):
        decode_access_token("completely.invalid.token")


@pytest.mark.asyncio
async def test_mock_token_disabled_in_production(client, monkeypatch):
    # Set APP_ENV to production and DEBUG to false
    monkeypatch.setattr(settings, "APP_ENV", "production")
    monkeypatch.setattr(settings, "DEBUG", False)

    res = await client.post(
        "/api/v1/auth/mock-token",
        json={"email": "hacker@test.com", "full_name": "Hacker", "role": "ADMIN"},
    )
    assert res.status_code == 403
    assert res.json()["error"]["code"] == "MOCK_AUTH_DISABLED"
