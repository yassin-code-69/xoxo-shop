import pytest


@pytest.mark.asyncio
async def test_audit_logs_recorded(client, admin_headers):
    # Admin updates settings
    await client.patch(
        "/api/v1/admin/settings",
        json={"settings": {"support_phone": "01799887766"}},
        headers=admin_headers,
    )

    # Check audit logs
    audit_res = await client.get("/api/v1/admin/audit-logs", headers=admin_headers)
    assert audit_res.status_code == 200
    data = audit_res.json()
    assert data["total"] > 0
    actions = [item["action"] for item in data["items"]]
    assert "SETTINGS_UPDATED" in actions or "PAYMENT_APPROVED" in actions
