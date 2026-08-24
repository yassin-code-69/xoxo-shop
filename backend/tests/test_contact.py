import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_public_contact_submission(client: AsyncClient):
    payload = {
        "name": "Tanvir Ahmed",
        "email": "tanvir@example.com",
        "order_id": "FF-260818-9999",
        "message": "I sent payment via bKash but have not received my diamond topup yet.",
    }
    response = await client.post("/api/v1/contact", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == payload["name"]
    assert data["email"] == payload["email"]
    assert data["order_id"] == payload["order_id"]
    assert data["status"] == "UNREAD"
    assert data["id"] is not None


@pytest.mark.asyncio
async def test_admin_contact_messages_crud(client: AsyncClient, admin_headers: dict):
    # 1. Create message
    create_res = await client.post(
        "/api/v1/contact",
        json={
            "name": "Rahim Khan",
            "email": "rahim@example.com",
            "message": "Need help with diamond pricing.",
        },
    )
    assert create_res.status_code == 200
    msg_id = create_res.json()["id"]

    # 2. Unauthenticated cannot list admin messages
    unauth_res = await client.get("/api/v1/admin/contact-messages")
    assert unauth_res.status_code == 401

    # 3. Admin List
    list_res = await client.get("/api/v1/admin/contact-messages", headers=admin_headers)
    assert list_res.status_code == 200
    items = list_res.json()["items"]
    assert any(m["id"] == msg_id for m in items)

    # 4. Admin Update (Mark as REPLIED)
    update_res = await client.patch(
        f"/api/v1/admin/contact-messages/{msg_id}",
        json={"status": "REPLIED", "reply_notes": "Replied via email with diamond pricing chart."},
        headers=admin_headers,
    )
    assert update_res.status_code == 200
    updated_data = update_res.json()
    assert updated_data["status"] == "REPLIED"
    assert "Replied via email" in updated_data["reply_notes"]

    # 5. Admin Delete
    del_res = await client.delete(f"/api/v1/admin/contact-messages/{msg_id}", headers=admin_headers)
    assert del_res.status_code == 200
