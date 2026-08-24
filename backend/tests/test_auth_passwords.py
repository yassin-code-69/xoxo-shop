import pytest


@pytest.mark.asyncio
async def test_register_and_login_with_password(client):
    # 1. Register a new user
    reg_payload = {
        "email": "gamer123@example.com",
        "password": "Password123!",
        "full_name": "Pro Gamer",
        "phone": "01711223344",
    }
    reg_res = await client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_res.status_code == 201
    reg_data = reg_res.json()
    assert "access_token" in reg_data
    assert reg_data["user"]["email"] == "gamer123@example.com"
    assert "CUSTOMER" in reg_data["user"]["roles"]

    # 2. Duplicate registration should fail
    dup_res = await client.post("/api/v1/auth/register", json=reg_payload)
    assert dup_res.status_code == 409

    # 3. Login with wrong password
    bad_login = await client.post(
        "/api/v1/auth/login",
        json={"email": "gamer123@example.com", "password": "WrongPassword"},
    )
    assert bad_login.status_code == 401

    # 4. Login with correct password
    good_login = await client.post(
        "/api/v1/auth/login",
        json={"email": "gamer123@example.com", "password": "Password123!"},
    )
    assert good_login.status_code == 200
    token = good_login.json()["access_token"]

    # 5. Access /me with token
    headers = {"Authorization": f"Bearer {token}"}
    me_res = await client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "gamer123@example.com"

    # 6. Change password
    change_res = await client.post(
        "/api/v1/auth/change-password",
        json={"old_password": "Password123!", "new_password": "NewSecretPassword123!"},
        headers=headers,
    )
    assert change_res.status_code == 200

    # 7. Login with old password should now fail
    old_fail = await client.post(
        "/api/v1/auth/login",
        json={"email": "gamer123@example.com", "password": "Password123!"},
    )
    assert old_fail.status_code == 401

    # 8. Login with new password succeeds
    new_ok = await client.post(
        "/api/v1/auth/login",
        json={"email": "gamer123@example.com", "password": "NewSecretPassword123!"},
    )
    assert new_ok.status_code == 200


@pytest.mark.asyncio
async def test_admin_default_login_credentials(client):
    # Login with default admin credentials
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": "admin@xoxoshop.com", "password": "Admin@123456"},
    )
    assert login_res.status_code == 200
    data = login_res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "admin@xoxoshop.com"
    assert "ADMIN" in data["user"]["roles"] or "SUPER_ADMIN" in data["user"]["roles"]

    # Test admin endpoint with this token
    admin_token = data["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    dash_res = await client.get("/api/v1/admin/dashboard", headers=admin_headers)
    assert dash_res.status_code == 200
