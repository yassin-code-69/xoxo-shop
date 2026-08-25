import pytest


@pytest.mark.asyncio
async def test_create_order_server_authoritative_price(client, customer_headers):
    # Customer selects 115 Diamonds (Price is 79 BDT)
    payload = {
        "product_id": "115-diamonds",
        "player_uid": "123456789",
        "quantity": 2,
        "payment_method": "BKASH",
    }
    response = await client.post("/api/v1/orders", json=payload, headers=customer_headers)
    assert response.status_code == 200
    data = response.json()

    # Total must be 79 * 2 = 158.00 BDT
    assert float(data["total_amount"]) == 158.00
    assert data["player_uid"] == "123456789"
    assert data["order_status"] == "PENDING_PAYMENT"
    assert data["payment_status"] == "PENDING"
    assert data["public_order_id"].startswith("FF-")


@pytest.mark.asyncio
async def test_order_customer_isolation(client, customer_headers):
    # Create order as customer
    create_res = await client.post(
        "/api/v1/orders",
        json={"product_id": "115-diamonds", "player_uid": "999888777", "quantity": 1, "payment_method": "BKASH"},
        headers=customer_headers,
    )
    assert create_res.status_code == 200
    public_id = create_res.json()["public_order_id"]

    # Another customer cannot access with wrong headers if authenticated as other user
    other_token = {
        "sub": "other-customer-uid-9999",
        "email": "other@test.com",
        "user_metadata": {"full_name": "Other", "role": "CUSTOMER"},
        "aud": "authenticated",
        "role": "authenticated",
    }
    from app.core.security import create_access_token

    other_headers = {"Authorization": f"Bearer {create_access_token(other_token)}"}

    get_res = await client.get(f"/api/v1/orders/{public_id}", headers=other_headers)
    assert get_res.status_code == 403

    # And an anonymous caller must not be able to read it either: orders expose the
    # player UID, transaction id and sender number.
    anon_res = await client.get(f"/api/v1/orders/{public_id}")
    assert anon_res.status_code == 401
    assert "999888777" not in anon_res.text


@pytest.mark.asyncio
async def test_get_public_feed(client, customer_headers):
    # Create an order first
    await client.post(
        "/api/v1/orders",
        json={"product_id": "115-diamonds", "player_uid": "777888999", "quantity": 1, "payment_method": "BKASH"},
        headers=customer_headers,
    )
    # Fetch public feed
    res = await client.get("/api/v1/orders/feed/recent?limit=5")
    assert res.status_code == 200
    feed = res.json()
    assert isinstance(feed, list)
    assert len(feed) > 0
    assert "customer_display_name" in feed[0]
    assert "product_name" in feed[0]


@pytest.mark.asyncio
async def test_order_creation_uid_validation(client, customer_headers):
    # Invalid UID with dangerous/malformed characters
    invalid_payload = {
        "product_id": "115-diamonds",
        "player_uid": "<script>alert(1)</script>",
        "quantity": 1,
        "payment_method": "BKASH",
    }
    res = await client.post("/api/v1/orders", json=invalid_payload, headers=customer_headers)
    assert res.status_code == 422  # Unprocessable Entity / Validation Error

    # Valid alphanumeric UID
    valid_payload = {
        "product_id": "115-diamonds",
        "player_uid": "PLAYER_1029384756",
        "quantity": 1,
        "payment_method": "BKASH",
    }
    valid_res = await client.post("/api/v1/orders", json=valid_payload, headers=customer_headers)
    assert valid_res.status_code == 200
    assert valid_res.json()["player_uid"] == "PLAYER_1029384756"
