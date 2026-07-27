import pytest
from fastapi.testclient import TestClient
from main import app


@pytest.fixture
def client():
    return TestClient(app)


def _register(client, email="boardtest@example.com", password="securepass123"):
    return client.post("/auth/register", json={"email": email, "password": password})


def _login(client, email="boardtest@example.com", password="securepass123"):
    return client.post("/auth/login", json={"email": email, "password": password})


def _token(client):
    _register(client)
    return _login(client).json()["access_token"]


def _auth_headers(client):
    return {"Authorization": f"Bearer {_token(client)}"}


def _create_board(client, name="Mein Board"):
    return client.post("/boards/", json={"name": name}, headers=_auth_headers(client))


class TestBoardCRUD:
    def test_create_board(self, client):
        _auth_headers(client)
        resp = _create_board(client, "Mein Board")
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == "Mein Board"
        assert "id" in data
        assert "owner_id" in data

    def test_list_boards_empty(self, client):
        headers = _auth_headers(client)
        resp = client.get("/boards/", headers=headers)
        assert resp.status_code == 200
        assert resp.json() == []

    def test_list_boards(self, client):
        headers = _auth_headers(client)
        client.post("/boards/", json={"name": "Board A"}, headers=headers)
        client.post("/boards/", json={"name": "Board B"}, headers=headers)
        resp = client.get("/boards/", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 2

    def test_list_boards_only_own(self, client):
        headers = _auth_headers(client)
        client.post("/boards/", json={"name": "Mein Board"}, headers=headers)
        _register(client, email="other@example.com", password="securepass123")
        token2 = _login(client, email="other@example.com", password="securepass123").json()[
            "access_token"
        ]
        headers2 = {"Authorization": f"Bearer {token2}"}
        resp = client.get("/boards/", headers=headers2)
        assert resp.status_code == 200
        assert resp.json() == []

    def test_get_board(self, client):
        headers = _auth_headers(client)
        created = client.post("/boards/", json={"name": "Mein Board"}, headers=headers)
        board_id = created.json()["id"]
        resp = client.get(f"/boards/{board_id}", headers=headers)
        assert resp.status_code == 200
        assert resp.json()["name"] == "Mein Board"

    def test_get_board_not_found(self, client):
        headers = _auth_headers(client)
        resp = client.get("/boards/9999", headers=headers)
        assert resp.status_code == 404

    def test_get_board_forbidden(self, client):
        headers = _auth_headers(client)
        created = client.post("/boards/", json={"name": "Mein Board"}, headers=headers)
        board_id = created.json()["id"]
        _register(client, email="other@example.com", password="securepass123")
        token2 = _login(client, email="other@example.com", password="securepass123").json()[
            "access_token"
        ]
        headers2 = {"Authorization": f"Bearer {token2}"}
        resp = client.get(f"/boards/{board_id}", headers=headers2)
        assert resp.status_code == 403

    def test_update_board(self, client):
        headers = _auth_headers(client)
        created = client.post("/boards/", json={"name": "Mein Board"}, headers=headers)
        board_id = created.json()["id"]
        resp = client.put(f"/boards/{board_id}", json={"name": "Umbenannt"}, headers=headers)
        assert resp.status_code == 200
        assert resp.json()["name"] == "Umbenannt"

    def test_update_board_forbidden(self, client):
        headers = _auth_headers(client)
        created = client.post("/boards/", json={"name": "Mein Board"}, headers=headers)
        board_id = created.json()["id"]
        _register(client, email="other@example.com", password="securepass123")
        token2 = _login(client, email="other@example.com", password="securepass123").json()[
            "access_token"
        ]
        headers2 = {"Authorization": f"Bearer {token2}"}
        resp = client.put(f"/boards/{board_id}", json={"name": "Hacked"}, headers=headers2)
        assert resp.status_code == 403

    def test_delete_board(self, client):
        headers = _auth_headers(client)
        created = client.post("/boards/", json={"name": "Mein Board"}, headers=headers)
        board_id = created.json()["id"]
        resp = client.delete(f"/boards/{board_id}", headers=headers)
        assert resp.status_code == 204
        resp2 = client.get(f"/boards/{board_id}", headers=headers)
        assert resp2.status_code == 404

    def test_delete_board_forbidden(self, client):
        headers = _auth_headers(client)
        created = client.post("/boards/", json={"name": "Mein Board"}, headers=headers)
        board_id = created.json()["id"]
        _register(client, email="other@example.com", password="securepass123")
        token2 = _login(client, email="other@example.com", password="securepass123").json()[
            "access_token"
        ]
        headers2 = {"Authorization": f"Bearer {token2}"}
        resp = client.delete(f"/boards/{board_id}", headers=headers2)
        assert resp.status_code == 403

    def test_unauthorized_access(self, client):
        resp = client.get("/boards/")
        assert resp.status_code == 401
        resp = client.post("/boards/", json={"name": "x"})
        assert resp.status_code == 401


class TestColumnCRUD:
    def test_create_column(self, client):
        headers = _auth_headers(client)
        created = client.post("/boards/", json={"name": "Mein Board"}, headers=headers)
        board_id = created.json()["id"]
        resp = client.post(
            f"/boards/{board_id}/columns",
            json={"name": "To Do", "position": 0, "wip_limit": 5},
            headers=headers,
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == "To Do"
        assert data["position"] == 0
        assert data["wip_limit"] == 5
        assert data["board_id"] == board_id

    def test_create_column_defaults(self, client):
        headers = _auth_headers(client)
        created = client.post("/boards/", json={"name": "Mein Board"}, headers=headers)
        board_id = created.json()["id"]
        resp = client.post(
            f"/boards/{board_id}/columns",
            json={"name": "Backlog"},
            headers=headers,
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["position"] == 0
        assert data["wip_limit"] is None

    def test_list_columns(self, client):
        headers = _auth_headers(client)
        created = client.post("/boards/", json={"name": "Mein Board"}, headers=headers)
        board_id = created.json()["id"]
        client.post(
            f"/boards/{board_id}/columns",
            json={"name": "To Do", "position": 2},
            headers=headers,
        )
        client.post(
            f"/boards/{board_id}/columns",
            json={"name": "Done", "position": 1},
            headers=headers,
        )
        resp = client.get(f"/boards/{board_id}/columns", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 2
        assert data[0]["name"] == "Done"
        assert data[1]["name"] == "To Do"

    def test_update_column(self, client):
        headers = _auth_headers(client)
        created = client.post("/boards/", json={"name": "Mein Board"}, headers=headers)
        board_id = created.json()["id"]
        col_resp = client.post(
            f"/boards/{board_id}/columns",
            json={"name": "To Do", "position": 0},
            headers=headers,
        )
        col_id = col_resp.json()["id"]
        resp = client.put(
            f"/boards/{board_id}/columns/{col_id}",
            json={"name": "In Progress", "wip_limit": 3},
            headers=headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["name"] == "In Progress"
        assert data["wip_limit"] == 3

    def test_delete_column(self, client):
        headers = _auth_headers(client)
        created = client.post("/boards/", json={"name": "Mein Board"}, headers=headers)
        board_id = created.json()["id"]
        col_resp = client.post(
            f"/boards/{board_id}/columns",
            json={"name": "To Do"},
            headers=headers,
        )
        col_id = col_resp.json()["id"]
        resp = client.delete(f"/boards/{board_id}/columns/{col_id}", headers=headers)
        assert resp.status_code == 204
        resp2 = client.get(f"/boards/{board_id}/columns", headers=headers)
        assert resp2.json() == []

    def test_column_forbidden_board(self, client):
        headers = _auth_headers(client)
        created = client.post("/boards/", json={"name": "Mein Board"}, headers=headers)
        board_id = created.json()["id"]
        _register(client, email="other@example.com", password="securepass123")
        token2 = _login(client, email="other@example.com", password="securepass123").json()[
            "access_token"
        ]
        headers2 = {"Authorization": f"Bearer {token2}"}
        resp = client.post(
            f"/boards/{board_id}/columns",
            json={"name": "To Do"},
            headers=headers2,
        )
        assert resp.status_code == 403
