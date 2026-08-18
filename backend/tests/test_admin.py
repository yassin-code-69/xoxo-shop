import pytest


@pytest.mark.asyncio
async def test_admin_payment_methods(client, admin_headers):
    # List payment methods
    res = await client.get("/api/v1/admin/payment-methods", headers=admin_headers)
    assert res.status_code == 200
    methods = res.json()
    assert len(methods) >= 3

    bkash = next(m for m in methods if m["code"] == "BKASH")
    method_id = bkash["id"]

    # Update account number
    up_res = await client.patch(
        f"/api/v1/admin/payment-methods/{method_id}",
        json={"account_number": "01799887766"},
        headers=admin_headers,
    )
    assert up_res.status_code == 200
    assert up_res.json()["account_number"] == "01799887766"


@pytest.mark.asyncio
async def test_admin_banners_crud(client, admin_headers):
    # Create banner
    banner_payload = {
        "title": "Ramadan Special Offer",
        "subtitle": "Bonus diamonds all month",
        "image_url": "https://example.com/banner.jpg",
        "link_url": "/uid-topup",
        "active": True,
        "sort_order": 5,
    }
    create_res = await client.post("/api/v1/admin/banners", json=banner_payload, headers=admin_headers)
    assert create_res.status_code == 200
    banner_id = create_res.json()["id"]

    # Update banner
    patch_res = await client.patch(
        f"/api/v1/admin/banners/{banner_id}",
        json={"title": "Eid Special Offer"},
        headers=admin_headers,
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["title"] == "Eid Special Offer"

    # Delete banner
    del_res = await client.delete(f"/api/v1/admin/banners/{banner_id}", headers=admin_headers)
    assert del_res.status_code == 200


@pytest.mark.asyncio
async def test_admin_customers_list(client, admin_headers):
    res = await client.get("/api/v1/admin/customers", headers=admin_headers)
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert data["total"] >= 1
