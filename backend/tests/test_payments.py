import pytest


@pytest.mark.asyncio
async def test_manual_payment_submission_and_approval_flow(client, customer_headers, admin_headers):
    # 1. Customer creates order
    create_res = await client.post(
        "/api/v1/orders",
        json={"product_id": "240-diamonds", "player_uid": "555666777", "quantity": 1, "payment_method": "BKASH"},
        headers=customer_headers,
    )
    assert create_res.status_code == 200
    order_data = create_res.json()
    public_id = order_data["public_order_id"]

    # 2. Customer submits manual payment with TrxID
    pay_res = await client.post(
        f"/api/v1/orders/{public_id}/manual-payment",
        json={"transaction_id": "BKASH98765432", "sender_number": "01711223344"},
        headers=customer_headers,
    )
    assert pay_res.status_code == 200
    pay_data = pay_res.json()
    assert pay_data["status"] == "SUBMITTED"
    assert pay_data["transaction_id"] == "BKASH98765432"

    # Verify order state is PAYMENT_SUBMITTED
    order_check = await client.get(f"/api/v1/orders/{public_id}", headers=customer_headers)
    assert order_check.json()["order_status"] == "PAYMENT_SUBMITTED"
    assert order_check.json()["payment_status"] == "SUBMITTED"

    # 3. Duplicate TrxID prevention
    dup_order_res = await client.post(
        "/api/v1/orders",
        json={"product_id": "240-diamonds", "player_uid": "555666777", "quantity": 1, "payment_method": "BKASH"},
        headers=customer_headers,
    )
    dup_public_id = dup_order_res.json()["public_order_id"]
    dup_pay_res = await client.post(
        f"/api/v1/orders/{dup_public_id}/manual-payment",
        json={"transaction_id": "BKASH98765432", "sender_number": "01711223344"},
        headers=customer_headers,
    )
    assert dup_pay_res.status_code == 409  # Duplicate conflict!

    # 4. Admin approves payment
    payment_id = pay_data["id"]
    approve_res = await client.post(f"/api/v1/admin/payments/{payment_id}/approve", headers=admin_headers)
    assert approve_res.status_code == 200
    approved_pay = approve_res.json()
    assert approved_pay["status"] == "VERIFIED"

    import asyncio

    await asyncio.sleep(0.1)

    # Verify order is COMPLETED because mock provider fulfilled it
    final_order = await client.get(f"/api/v1/orders/{public_id}", headers=customer_headers)
    assert final_order.json()["payment_status"] == "VERIFIED"
    assert final_order.json()["fulfillment_status"] in ("COMPLETED", "PROCESSING", "QUEUED")


@pytest.mark.asyncio
async def test_manual_payment_rejection(client, customer_headers, admin_headers):
    # Customer creates order
    create_res = await client.post(
        "/api/v1/orders",
        json={"product_id": "115-diamonds", "player_uid": "111222333", "quantity": 1, "payment_method": "NAGAD"},
        headers=customer_headers,
    )
    public_id = create_res.json()["public_order_id"]

    # Customer submits invalid TrxID
    pay_res = await client.post(
        f"/api/v1/orders/{public_id}/manual-payment",
        json={"transaction_id": "FAKE_TRX_9999", "sender_number": "01811223344"},
        headers=customer_headers,
    )
    payment_id = pay_res.json()["id"]

    # Admin rejects payment
    reject_res = await client.post(
        f"/api/v1/admin/payments/{payment_id}/reject",
        json={"reason": "Transaction ID not found in Nagad statement"},
        headers=admin_headers,
    )
    assert reject_res.status_code == 200
    assert reject_res.json()["status"] == "REJECTED"
    assert reject_res.json()["rejection_reason"] == "Transaction ID not found in Nagad statement"
