import asyncio
from decimal import Decimal

import pytest

from app.core.exceptions import PaymentGatewayError
from app.integrations.payments.bkash import BkashGatewayClient
from app.integrations.payments.manager import PaymentGatewayManager
from app.integrations.payments.nagad import NagadGatewayClient


@pytest.mark.asyncio
async def test_bkash_client_mock_flow():
    client = BkashGatewayClient(app_key="mock", app_secret="mock_secret", username="mock_user", password="mock_pwd")
    assert client.is_mock_mode() is True

    # 1. Create Payment
    res = await client.create_payment(
        order_id="ORD-TEST-101",
        amount=Decimal("150.00"),
        currency="BDT",
    )
    assert res["statusCode"] == "0000"
    assert res["paymentID"].startswith("BK_MOCK_")
    assert "paymentID=" in res["bkashURL"]
    assert res["is_mock"] is True

    # 2. Execute Payment
    exec_res = await client.execute_payment(res["paymentID"])
    assert exec_res["statusCode"] == "0000"
    assert exec_res["transactionStatus"] == "Completed"
    assert exec_res["trxID"].startswith("TRX_BK_")

    # 3. Query Payment
    query_res = await client.query_payment(res["paymentID"])
    assert query_res["statusCode"] == "0000"
    assert query_res["transactionStatus"] == "Completed"


@pytest.mark.asyncio
async def test_nagad_client_mock_flow():
    client = NagadGatewayClient(merchant_id="mock", merchant_private_key="mock_key", pg_public_key="mock_pub")
    assert client.is_mock_mode() is True

    # 1. Initialize Payment
    res = await client.initialize_payment(
        order_id="ORD-TEST-202",
        amount=Decimal("280.00"),
        currency="BDT",
    )
    assert res["status"] == "Success"
    assert res["paymentReferenceId"].startswith("NG_MOCK_")
    assert "payment_ref_id=" in res["callbackUrl"]
    assert res["is_mock"] is True

    # 2. Verify Payment
    verify_res = await client.verify_payment(res["paymentReferenceId"])
    assert verify_res["status"] == "Success"
    assert verify_res["issuerPaymentRefNo"].startswith("TRX_NG_")


@pytest.mark.asyncio
async def test_gateway_manager_dispatches():
    manager = PaymentGatewayManager()

    # bKash dispatch
    bk_res = await manager.initiate_payment(
        gateway="BKASH",
        order_id="ORD-MGR-01",
        amount=Decimal("100.00"),
    )
    assert bk_res.gateway == "BKASH"
    assert bk_res.payment_session_id.startswith("BK_MOCK_")

    # Nagad dispatch
    ng_res = await manager.initiate_payment(
        gateway="NAGAD",
        order_id="ORD-MGR-02",
        amount=Decimal("200.00"),
    )
    assert ng_res.gateway == "NAGAD"
    assert ng_res.payment_session_id.startswith("NG_MOCK_")

    # Unsupported gateway
    with pytest.raises(PaymentGatewayError):
        await manager.initiate_payment(
            gateway="UNKNOWN_GW",
            order_id="ORD-MGR-03",
            amount=Decimal("50.00"),
        )


@pytest.mark.asyncio
async def test_api_bkash_initiate_and_callback_flow(client, customer_headers):
    # 1. Customer creates order
    create_res = await client.post(
        "/api/v1/orders",
        json={"product_id": "240-diamonds", "player_uid": "99887766", "quantity": 1, "payment_method": "BKASH"},
        headers=customer_headers,
    )
    assert create_res.status_code == 200
    public_id = create_res.json()["public_order_id"]

    # 2. Customer initiates bKash payment gateway
    init_res = await client.post(
        f"/api/v1/payments/{public_id}/initiate-gateway",
        json={"gateway": "BKASH"},
        headers=customer_headers,
    )
    assert init_res.status_code == 200
    init_data = init_res.json()
    assert init_data["gateway"] == "BKASH"
    assert init_data["payment_session_id"].startswith("BK_MOCK_")
    assert "/api/v1/payments/bkash/callback" in init_data["redirect_url"]
    session_id = init_data["payment_session_id"]

    # 3. bKash callback triggers on user payment completion
    cb_res = await client.get(
        f"/api/v1/payments/bkash/callback?paymentID={session_id}&status=success&invoice={public_id}",
        follow_redirects=False,
    )
    assert cb_res.status_code == 303
    assert f"/payment/{public_id}?status=success" in cb_res.headers["location"]
    assert "trx_id=" in cb_res.headers["location"]

    # Allow async background worker to complete fulfillment
    await asyncio.sleep(0.1)

    # 4. Verify order state is PAYMENT_VERIFIED / COMPLETED
    order_res = await client.get(f"/api/v1/orders/{public_id}", headers=customer_headers)
    assert order_res.status_code == 200
    order_data = order_res.json()
    assert order_data["payment_status"] == "VERIFIED"
    assert order_data["fulfillment_status"] in ("COMPLETED", "PROCESSING", "QUEUED")


@pytest.mark.asyncio
async def test_api_bkash_callback_cancelled(client, customer_headers):
    create_res = await client.post(
        "/api/v1/orders",
        json={"product_id": "115-diamonds", "player_uid": "88776655", "quantity": 1, "payment_method": "BKASH"},
        headers=customer_headers,
    )
    public_id = create_res.json()["public_order_id"]

    init_res = await client.post(
        f"/api/v1/payments/{public_id}/initiate-gateway",
        json={"gateway": "BKASH"},
        headers=customer_headers,
    )
    session_id = init_res.json()["payment_session_id"]

    # User cancels at bKash gateway
    cb_res = await client.get(
        f"/api/v1/payments/bkash/callback?paymentID={session_id}&status=cancel",
        follow_redirects=False,
    )
    assert cb_res.status_code == 303
    assert f"/payment/{public_id}?status=cancelled" in cb_res.headers["location"]

    # Verify order is still pending payment
    order_res = await client.get(f"/api/v1/orders/{public_id}", headers=customer_headers)
    assert order_res.json()["payment_status"] == "PENDING"


@pytest.mark.asyncio
async def test_api_nagad_initiate_and_callback_flow(client, customer_headers):
    # 1. Customer creates order
    create_res = await client.post(
        "/api/v1/orders",
        json={"product_id": "610-diamonds", "player_uid": "123123123", "quantity": 1, "payment_method": "NAGAD"},
        headers=customer_headers,
    )
    assert create_res.status_code == 200
    public_id = create_res.json()["public_order_id"]

    # 2. Customer initiates Nagad payment gateway
    init_res = await client.post(
        f"/api/v1/payments/{public_id}/initiate-gateway",
        json={"gateway": "NAGAD"},
        headers=customer_headers,
    )
    assert init_res.status_code == 200
    init_data = init_res.json()
    assert init_data["gateway"] == "NAGAD"
    assert init_data["payment_session_id"].startswith("NG_MOCK_")
    session_id = init_data["payment_session_id"]

    # 3. Nagad callback triggers on payment completion (via POST form/json or GET)
    cb_res = await client.post(
        "/api/v1/payments/nagad/callback",
        json={"payment_ref_id": session_id, "status": "Success", "order_id": public_id},
        follow_redirects=False,
    )
    assert cb_res.status_code == 303
    assert f"/payment/{public_id}?status=success" in cb_res.headers["location"]
    assert "trx_id=" in cb_res.headers["location"]

    await asyncio.sleep(0.1)

    # 4. Verify order state is verified
    order_res = await client.get(f"/api/v1/orders/{public_id}", headers=customer_headers)
    assert order_res.json()["payment_status"] == "VERIFIED"


@pytest.mark.asyncio
async def test_callback_cannot_mark_a_different_order_as_paid(client, customer_headers):
    """A callback must only settle the order its own checkout session belongs to."""
    # Cheap order, which the attacker actually pays for
    cheap_res = await client.post(
        "/api/v1/orders",
        json={"product_id": "115-diamonds", "player_uid": "10101010", "quantity": 1, "payment_method": "BKASH"},
        headers=customer_headers,
    )
    cheap_id = cheap_res.json()["public_order_id"]

    # Expensive order, which the attacker wants for free
    target_res = await client.post(
        "/api/v1/orders",
        json={"product_id": "5060-diamonds", "player_uid": "20202020", "quantity": 1, "payment_method": "BKASH"},
        headers=customer_headers,
    )
    target_id = target_res.json()["public_order_id"]

    init_res = await client.post(
        f"/api/v1/payments/{cheap_id}/initiate-gateway",
        json={"gateway": "BKASH"},
        headers=customer_headers,
    )
    cheap_session = init_res.json()["payment_session_id"]

    # Replay the cheap session against the expensive order id
    await client.get(
        f"/api/v1/payments/bkash/callback?paymentID={cheap_session}&status=success&order_id={target_id}",
        follow_redirects=False,
    )
    await asyncio.sleep(0.1)

    target_state = await client.get(f"/api/v1/orders/{target_id}", headers=customer_headers)
    assert target_state.json()["payment_status"] == "PENDING"
    assert target_state.json()["fulfillment_status"] == "NOT_STARTED"


@pytest.mark.asyncio
async def test_callback_with_wrong_amount_is_not_verified(client, customer_headers):
    """If the gateway collected a different amount than the order total, do not settle."""
    from app.integrations.payments.manager import gateway_manager

    create_res = await client.post(
        "/api/v1/orders",
        json={"product_id": "610-diamonds", "player_uid": "30303030", "quantity": 1, "payment_method": "BKASH"},
        headers=customer_headers,
    )
    public_id = create_res.json()["public_order_id"]

    init_res = await client.post(
        f"/api/v1/payments/{public_id}/initiate-gateway",
        json={"gateway": "BKASH"},
        headers=customer_headers,
    )
    session_id = init_res.json()["payment_session_id"]

    # Gateway reports a 1 BDT payment for a much pricier order
    gateway_manager.bkash._mock_amounts[session_id] = "1.00"

    cb_res = await client.get(
        f"/api/v1/payments/bkash/callback?paymentID={session_id}&status=success",
        follow_redirects=False,
    )
    assert cb_res.status_code == 303
    assert "status=failed" in cb_res.headers["location"]
    await asyncio.sleep(0.1)

    order_state = await client.get(f"/api/v1/orders/{public_id}", headers=customer_headers)
    assert order_state.json()["payment_status"] == "PENDING"


@pytest.mark.asyncio
async def test_gateway_mock_mode_is_disabled_in_production(monkeypatch):
    """Empty credentials in production must fail loudly, not silently mock a success."""
    from app.core.config import settings

    monkeypatch.setattr(settings, "APP_ENV", "production")

    bkash = BkashGatewayClient(app_key="", app_secret="", username="", password="")
    assert bkash.is_mock_mode() is False
    with pytest.raises(PaymentGatewayError):
        await bkash.create_payment(order_id="ORD-PROD-1", amount=Decimal("100.00"))

    nagad = NagadGatewayClient(merchant_id="", merchant_private_key="", pg_public_key="")
    assert nagad.is_mock_mode() is False
    with pytest.raises(PaymentGatewayError):
        await nagad.initialize_payment(order_id="ORD-PROD-2", amount=Decimal("100.00"))


@pytest.mark.asyncio
async def test_initiate_gateway_unauthorized_access(client, customer_headers):
    # Customer 1 creates order
    create_res = await client.post(
        "/api/v1/orders",
        json={"product_id": "115-diamonds", "player_uid": "44332211", "quantity": 1, "payment_method": "BKASH"},
        headers=customer_headers,
    )
    public_id = create_res.json()["public_order_id"]

    # Other customer token
    from app.core.security import create_access_token

    other_token = create_access_token({"sub": "other-user-999", "email": "other@user.com", "role": "authenticated"})
    other_headers = {"Authorization": f"Bearer {other_token}"}

    # Attempt to initiate payment on someone else's order
    init_res = await client.post(
        f"/api/v1/payments/{public_id}/initiate-gateway",
        json={"gateway": "BKASH"},
        headers=other_headers,
    )
    assert init_res.status_code == 403
