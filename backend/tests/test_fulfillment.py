import pytest


@pytest.mark.asyncio
async def test_admin_retry_fulfillment(client, customer_headers, admin_headers):
    # 1. Customer creates order
    create_res = await client.post(
        "/api/v1/orders",
        json={
            "product_id": "115-diamonds",
            "player_uid": "999-fail_temp-111",
            "quantity": 1,
            "payment_method": "BKASH",
        },
        headers=customer_headers,
    )
    public_id = create_res.json()["public_order_id"]

    # 2. Customer submits payment
    pay_res = await client.post(
        f"/api/v1/orders/{public_id}/manual-payment",
        json={"transaction_id": "TRX_RETRY_TEST_01", "sender_number": "01700000001"},
        headers=customer_headers,
    )
    payment_id = pay_res.json()["id"]

    # 3. Admin approves payment
    await client.post(f"/api/v1/admin/payments/{payment_id}/approve", headers=admin_headers)

    import asyncio

    await asyncio.sleep(0.1)

    # Order fulfillment should be failed/temporary
    # 4. Admin retries fulfillment
    retry_res = await client.post(f"/api/v1/admin/orders/{public_id}/retry-fulfillment", headers=admin_headers)
    assert retry_res.status_code == 200
    data = retry_res.json()
    assert data["attempt_count"] >= 1


@pytest.mark.asyncio
async def test_worker_handles_unexpected_exceptions_safely(client, customer_headers, admin_headers, monkeypatch):
    from app.modules.fulfillment.service import FulfillmentService
    from app.workers.tasks import _run_fulfillment_job

    # 1. Create order
    create_res = await client.post(
        "/api/v1/orders",
        json={"product_id": "115-diamonds", "player_uid": "888777666", "quantity": 1, "payment_method": "BKASH"},
        headers=customer_headers,
    )
    public_id = create_res.json()["public_order_id"]
    order_id = create_res.json()["id"]

    # 2. Force an unhandled exception inside FulfillmentService.execute_fulfillment
    async def mock_crashing_fulfillment(*args, **kwargs):
        raise RuntimeError("Simulated unhandled runtime failure in worker")

    monkeypatch.setattr(FulfillmentService, "execute_fulfillment", mock_crashing_fulfillment)

    # 3. Run worker directly
    await _run_fulfillment_job(order_id)

    # 4. Assert order state was recovered to FAILED
    order_res = await client.get(f"/api/v1/orders/{public_id}", headers=customer_headers)
    assert order_res.status_code == 200
    assert order_res.json()["fulfillment_status"] == "FAILED"
