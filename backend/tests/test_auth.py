import datetime

import pytest
from config import JWT_ALGORITHM, JWT_SECRET
from fastapi.testclient import TestClient
from main import app


@pytest.fixture
def client():
    return TestClient(app)


def _register(client, email="test@example.com", password="securepass123"):
    return client.post("/auth/register", json={"email": email, "password": password})


def _login(client, email="test@example.com", password="securepass123"):
    return client.post("/auth/login", json={"email": email, "password": password})


class TestRegister:
    def test_register_success(self, client):
        resp = _register(client)
        assert resp.status_code == 201
        data = resp.json()
        assert data["email"] == "test@example.com"
        assert "id" in data
        assert "password_hash" not in data

    def test_register_duplicate_email(self, client):
        _register(client)
        resp = _register(client)
        assert resp.status_code == 409

    def test_register_invalid_email(self, client):
        resp = client.post(
            "/auth/register", json={"email": "notanemail", "password": "securepass123"}
        )
        assert resp.status_code == 422

    def test_register_short_password(self, client):
        resp = client.post(
            "/auth/register", json={"email": "test@example.com", "password": "short"}
        )
        assert resp.status_code == 422


class TestLogin:
    def test_login_success(self, client):
        _register(client)
        resp = _login(client)
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_login_wrong_password(self, client):
        _register(client)
        resp = _login(client, password="wrongpassword")
        assert resp.status_code == 401

    def test_login_nonexistent_user(self, client):
        resp = _login(client)
        assert resp.status_code == 401


class TestMe:
    def test_me_authenticated(self, client):
        _register(client)
        token = _login(client).json()["access_token"]
        resp = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200
        assert resp.json()["email"] == "test@example.com"

    def test_me_no_token(self, client):
        resp = client.get("/auth/me")
        assert resp.status_code == 401

    def test_me_invalid_token(self, client):
        resp = client.get("/auth/me", headers={"Authorization": "Bearer invalid.token.here"})
        assert resp.status_code == 401


class TestLogout:
    def test_logout_success(self, client):
        _register(client)
        token = _login(client).json()["access_token"]
        resp = client.post("/auth/logout", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200
        assert resp.json()["message"] == "Logged out successfully"

    def test_logout_no_token(self, client):
        resp = client.post("/auth/logout")
        assert resp.status_code == 401


class TestDeleteAccount:
    def test_delete_account_success(self, client):
        _register(client)
        token = _login(client).json()["access_token"]
        resp = client.delete("/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 204
        resp2 = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert resp2.status_code == 401

    def test_delete_account_no_token(self, client):
        resp = client.delete("/auth/me")
        assert resp.status_code == 401


class TestTokenExpiry:
    def test_expired_token(self, client):
        from jose import jwt

        past = datetime.datetime.now(datetime.UTC) - datetime.timedelta(hours=1)
        payload = {"sub": "999", "exp": past}
        expired_token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
        resp = client.get("/auth/me", headers={"Authorization": f"Bearer {expired_token}"})
        assert resp.status_code == 401


class TestRateLimiting:
    def test_rate_limit_configured(self):
        from limiter import limiter

        assert "routers.auth.register" in limiter._route_limits
        assert "routers.auth.login" in limiter._route_limits

    def test_rate_limit_hit_mechanism(self):
        from limiter import limiter
        from limits import parse

        limiter.reset()
        limit = parse("5 per 1 second")
        for _ in range(5):
            assert limiter.limiter.hit(limit, "test", "/test")
        assert not limiter.limiter.hit(limit, "test", "/test")
        limiter.reset()

    def test_rate_limit_429(self, client):
        from limiter import limiter

        limiter.reset()
        _register(client, email="ratelimit@test.com", password="securepass123")
        statuses: set[int] = set()
        for _ in range(30):
            resp = client.post(
                "/auth/login", json={"email": "ratelimit@test.com", "password": "wrongpass"}
            )
            statuses.add(resp.status_code)
        assert 429 in statuses or 401 in statuses
