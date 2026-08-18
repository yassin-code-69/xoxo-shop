import pytest


@pytest.mark.asyncio
async def test_customer_cannot_access_admin_endpoints(client, customer_headers):
    response = await client.get("/api/v1/admin/dashboard", headers=customer_headers)
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_unauthenticated_cannot_access_admin_or_profile(client):
    res1 = await client.get("/api/v1/admin/dashboard")
    assert res1.status_code == 401

    res2 = await client.get("/api/v1/me/profile")
    assert res2.status_code == 401
