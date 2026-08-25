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
async def test_well_known_default_admin_password_no_longer_works(client):
    """The old hardcoded bootstrap password must not open the admin account."""
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": "admin@xoxoshop.com", "password": "Admin@123456"},
    )
    assert login_res.status_code == 401


@pytest.mark.asyncio
async def test_bootstrap_admin_created_from_configured_password(client, monkeypatch):
    """An admin is bootstrapped only from ADMIN_INITIAL_PASSWORD, and can then sign in."""
    from app.core.config import settings
    from app.db.init_db import seed_bootstrap_admin
    from app.db.session import AsyncSessionLocal

    monkeypatch.setattr(settings, "ADMIN_EMAIL", "bootstrap-admin@test.com")
    monkeypatch.setattr(settings, "ADMIN_INITIAL_PASSWORD", "Bootstrap-Pass-9271!")

    async with AsyncSessionLocal() as db:
        await seed_bootstrap_admin(db)

    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": "bootstrap-admin@test.com", "password": "Bootstrap-Pass-9271!"},
    )
    assert login_res.status_code == 200
    data = login_res.json()
    assert "SUPER_ADMIN" in data["user"]["roles"]

    admin_headers = {"Authorization": f"Bearer {data['access_token']}"}
    dash_res = await client.get("/api/v1/admin/dashboard", headers=admin_headers)
    assert dash_res.status_code == 200


@pytest.mark.asyncio
async def test_registering_with_admin_email_does_not_grant_admin(client, monkeypatch):
    """Self-registration must never hand out elevated roles, whatever the email is."""
    from app.core.config import settings

    monkeypatch.setattr(settings, "ADMIN_EMAIL", "not-yet-seeded-admin@test.com")

    reg_res = await client.post(
        "/api/v1/auth/register",
        json={"email": "not-yet-seeded-admin@test.com", "password": "Attacker-Pass-1!"},
    )
    assert reg_res.status_code == 201
    assert reg_res.json()["user"]["roles"] == ["CUSTOMER"]

    headers = {"Authorization": f"Bearer {reg_res.json()['access_token']}"}
    dash_res = await client.get("/api/v1/admin/dashboard", headers=headers)
    assert dash_res.status_code == 403
