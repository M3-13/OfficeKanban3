import pytest
from fastapi.testclient import TestClient
from main import app


@pytest.fixture
def client():
    return TestClient(app)


def _register(client, email="searchtest@example.com", password="securepass123"):
    return client.post("/auth/register", json={"email": email, "password": password})


def _login(client, email="searchtest@example.com", password="securepass123"):
    return client.post("/auth/login", json={"email": email, "password": password})


def _token(client):
    _register(client)
    return _login(client).json()["access_token"]


def _auth_headers(client):
    return {"Authorization": f"Bearer {_token(client)}"}


def _setup_board_with_tickets(client, headers):
    board_resp = client.post("/boards/", json={"name": "Such-Board"}, headers=headers)
    board_id = board_resp.json()["id"]

    col_resp = client.post(
        f"/boards/{board_id}/columns",
        json={"name": "To Do", "position": 0},
        headers=headers,
    )
    col_id = col_resp.json()["id"]

    t1 = client.post(
        f"/tickets/columns/{col_id}/tickets",
        json={"title": "Login-Fehler beheben", "description": "Der Login wirft einen 500er Fehler"},
        headers=headers,
    ).json()

    t2 = client.post(
        f"/tickets/columns/{col_id}/tickets",
        json={"title": "Datenbank-Backup einrichten", "description": None},
        headers=headers,
    ).json()

    t3 = client.post(
        f"/tickets/columns/{col_id}/tickets",
        json={
            "title": "UI überarbeiten",
            "description": "Neue Farbpalette für das Dashboard",
        },
        headers=headers,
    ).json()

    client.post(
        f"/tickets/{t1['id']}/comments",
        json={"content": "Kann ich reproduzieren."},
        headers=headers,
    )
    client.post(
        f"/tickets/{t1['id']}/comments",
        json={"content": "Fix ist im Branch feature/login-fix."},
        headers=headers,
    )
    client.post(
        f"/tickets/{t3['id']}/comments",
        json={"content": "Bitte das neue Blau-Schema verwenden."},
        headers=headers,
    )

    return board_id, col_id, [t1, t2, t3]


class TestSearch:
    def test_search_by_title(self, client):
        headers = _auth_headers(client)
        board_id, _, _ = _setup_board_with_tickets(client, headers)

        resp = client.get(f"/boards/{board_id}/search", params={"q": "Login"}, headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 1
        assert data["tickets"][0]["title"] == "Login-Fehler beheben"

    def test_search_by_title_case_insensitive(self, client):
        headers = _auth_headers(client)
        board_id, _, _ = _setup_board_with_tickets(client, headers)

        resp = client.get(f"/boards/{board_id}/search", params={"q": "login"}, headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 1
        assert data["tickets"][0]["title"] == "Login-Fehler beheben"

    def test_search_by_description(self, client):
        headers = _auth_headers(client)
        board_id, _, _ = _setup_board_with_tickets(client, headers)

        resp = client.get(
            f"/boards/{board_id}/search", params={"q": "Farbpalette"}, headers=headers
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 1
        assert data["tickets"][0]["title"] == "UI überarbeiten"

    def test_search_by_comment(self, client):
        headers = _auth_headers(client)
        board_id, _, _ = _setup_board_with_tickets(client, headers)

        resp = client.get(
            f"/boards/{board_id}/search", params={"q": "reproduzieren"}, headers=headers
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 1
        assert data["tickets"][0]["title"] == "Login-Fehler beheben"

    def test_search_by_comment_case_insensitive(self, client):
        headers = _auth_headers(client)
        board_id, _, _ = _setup_board_with_tickets(client, headers)

        resp = client.get(
            f"/boards/{board_id}/search", params={"q": "Reproduzieren"}, headers=headers
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 1

    def test_search_multiple_results(self, client):
        headers = _auth_headers(client)
        board_id, _, _ = _setup_board_with_tickets(client, headers)

        resp = client.get(f"/boards/{board_id}/search", params={"q": "Daten"}, headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] >= 1

    def test_search_empty_query(self, client):
        headers = _auth_headers(client)
        board_id, _, _ = _setup_board_with_tickets(client, headers)

        resp = client.get(f"/boards/{board_id}/search", params={"q": ""}, headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 0
        assert data["tickets"] == []

    def test_search_whitespace_only_query(self, client):
        headers = _auth_headers(client)
        board_id, _, _ = _setup_board_with_tickets(client, headers)

        resp = client.get(f"/boards/{board_id}/search", params={"q": "   "}, headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 0

    def test_search_no_results(self, client):
        headers = _auth_headers(client)
        board_id, _, _ = _setup_board_with_tickets(client, headers)

        resp = client.get(
            f"/boards/{board_id}/search",
            params={"q": "xyznonexistent"},
            headers=headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 0
        assert data["tickets"] == []

    def test_search_board_not_found(self, client):
        headers = _auth_headers(client)
        _setup_board_with_tickets(client, headers)

        resp = client.get("/boards/99999/search", params={"q": "test"}, headers=headers)
        assert resp.status_code == 404

    def test_search_unauthorized(self, client):
        headers = _auth_headers(client)
        board_id, _, _ = _setup_board_with_tickets(client, headers)

        resp = client.get(f"/boards/{board_id}/search", params={"q": "test"})
        assert resp.status_code == 401

    def test_search_forbidden_other_user(self, client):
        headers = _auth_headers(client)
        board_id, _, _ = _setup_board_with_tickets(client, headers)

        _register(client, email="other@example.com", password="securepass123")
        token2 = _login(client, email="other@example.com", password="securepass123").json()[
            "access_token"
        ]
        headers2 = {"Authorization": f"Bearer {token2}"}

        resp = client.get(f"/boards/{board_id}/search", params={"q": "Login"}, headers=headers2)
        assert resp.status_code == 403

    def test_search_special_characters(self, client):
        headers = _auth_headers(client)
        board_id, col_id, _ = _setup_board_with_tickets(client, headers)

        client.post(
            f"/tickets/columns/{col_id}/tickets",
            json={"title": "Test % _ special", "description": "LIKE wildcards"},
            headers=headers,
        )

        resp = client.get(f"/boards/{board_id}/search", params={"q": "%"}, headers=headers)
        assert resp.status_code == 200

    def test_search_board_with_no_tickets(self, client):
        headers = _auth_headers(client)
        board_resp = client.post("/boards/", json={"name": "Leeres Board"}, headers=headers)
        board_id = board_resp.json()["id"]

        resp = client.get(f"/boards/{board_id}/search", params={"q": "irgendwas"}, headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 0
        assert data["tickets"] == []
