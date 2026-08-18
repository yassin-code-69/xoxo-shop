import pytest


@pytest.mark.asyncio
async def test_list_public_products(client):
    response = await client.get("/api/v1/products")
    assert response.status_code == 200
    items = response.json()
    assert isinstance(items, list)
    assert len(items) > 0

    # Ensure provider_cost is NOT leaked in public API
    first_item = items[0]
    assert "provider_cost" not in first_item
    assert "selling_price" in first_item
    assert "diamond_amount" in first_item
    assert "slug" in first_item


@pytest.mark.asyncio
async def test_get_product_by_slug(client):
    response = await client.get("/api/v1/products/115-diamonds")
    assert response.status_code == 200
    data = response.json()
    assert data["slug"] == "115-diamonds"
    assert data["diamond_amount"] == 115
    assert float(data["selling_price"]) == 79.0


@pytest.mark.asyncio
async def test_admin_create_and_update_product(client, admin_headers):
    # Create product
    payload = {
        "name": "Special Test Bundle",
        "category": "Special",
        "diamond_amount": 1000,
        "bonus_amount": 100,
        "provider_sku": "FF_SPECIAL_1000",
        "selling_price": 650.00,
        "provider_cost": 550.00,
        "active": True,
        "tag": "Special",
    }
    response = await client.post("/api/v1/admin/products", json=payload, headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    product_id = data["id"]
    assert data["name"] == "Special Test Bundle"
    assert "provider_cost" in data  # Admin sees cost

    # Update product
    update_payload = {"selling_price": 620.00}
    up_res = await client.patch(f"/api/v1/admin/products/{product_id}", json=update_payload, headers=admin_headers)
    assert up_res.status_code == 200
    assert float(up_res.json()["selling_price"]) == 620.00
