import pytest
from fastapi.testclient import TestClient
from main import app


@pytest.fixture
def client():
    return TestClient(app)


def _register(client, email="tickettest@example.com", password="securepass123"):
    return client.post("/auth/register", json={"email": email, "password": password})


def _login(client, email="tickettest@example.com", password="securepass123"):
    return client.post("/auth/login", json={"email": email, "password": password})


def _token(client):
    _register(client)
    return _login(client).json()["access_token"]


def _auth_headers(client):
    return {"Authorization": f"Bearer {_token(client)}"}


def _create_board(client, name="Mein Board"):
    return client.post("/boards/", json={"name": name}, headers=_auth_headers(client))


def _create_column(client, board_id, name="To Do", position=0, wip_limit=None):
    return client.post(
        f"/boards/{board_id}/columns",
        json={"name": name, "position": position, "wip_limit": wip_limit},
        headers=_auth_headers(client),
    )


def _create_ticket(client, column_id, title="Mein Ticket", **kwargs):
    payload = {"title": title, **kwargs}
    return client.post(
        f"/tickets/columns/{column_id}/tickets", json=payload, headers=_auth_headers(client)
    )


class TestTicketCRUD:
    def test_create_ticket(self, client):
        headers = _auth_headers(client)
        board_id = _create_board(client).json()["id"]
        col_id = client.post(
            f"/boards/{board_id}/columns",
            json={"name": "To Do"},
            headers=headers,
        ).json()["id"]
        resp = client.post(
            f"/tickets/columns/{col_id}/tickets",
            json={"title": "Bug fix"},
            headers=headers,
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["title"] == "Bug fix"
        assert data["column_id"] == col_id
        assert data["priority"] == 3
        assert data["tags"] is None

    def test_create_ticket_with_all_fields(self, client):
        headers = _auth_headers(client)
        board_id = _create_board(client).json()["id"]
        col_id = client.post(
            f"/boards/{board_id}/columns",
            json={"name": "To Do"},
            headers=headers,
        ).json()["id"]
        resp = client.post(
            f"/tickets/columns/{col_id}/tickets",
            json={
                "title": "Complex",
                "description": "Markdown desc",
                "priority": 5,
                "due_date": "2025-12-31",
                "tags": ["bug", "urgent"],
            },
            headers=headers,
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["priority"] == 5
        assert data["tags"] == ["bug", "urgent"]
        assert data["due_date"] == "2025-12-31"
        assert data["description"] == "Markdown desc"

    def test_list_tickets(self, client):
        headers = _auth_headers(client)
        board_id = _create_board(client).json()["id"]
        col_id = client.post(
            f"/boards/{board_id}/columns",
            json={"name": "To Do"},
            headers=headers,
        ).json()["id"]
        client.post(
            f"/tickets/columns/{col_id}/tickets",
            json={"title": "Ticket 1"},
            headers=headers,
        )
        client.post(
            f"/tickets/columns/{col_id}/tickets",
            json={"title": "Ticket 2"},
            headers=headers,
        )
        resp = client.get(f"/tickets/columns/{col_id}/tickets", headers=headers)
        assert resp.status_code == 200
        assert len(resp.json()) == 2

    def test_get_ticket(self, client):
        headers = _auth_headers(client)
        board_id = _create_board(client).json()["id"]
        col_id = client.post(
            f"/boards/{board_id}/columns",
            json={"name": "To Do"},
            headers=headers,
        ).json()["id"]
        ticket_id = client.post(
            f"/tickets/columns/{col_id}/tickets",
            json={"title": "My Ticket"},
            headers=headers,
        ).json()["id"]
        resp = client.get(f"/tickets/{ticket_id}", headers=headers)
        assert resp.status_code == 200
        assert resp.json()["title"] == "My Ticket"

    def test_get_ticket_not_found(self, client):
        headers = _auth_headers(client)
        resp = client.get("/tickets/99999", headers=headers)
        assert resp.status_code == 404

    def test_update_ticket(self, client):
        headers = _auth_headers(client)
        board_id = _create_board(client).json()["id"]
        col_id = client.post(
            f"/boards/{board_id}/columns",
            json={"name": "To Do"},
            headers=headers,
        ).json()["id"]
        ticket_id = client.post(
            f"/tickets/columns/{col_id}/tickets",
            json={"title": "Old Title"},
            headers=headers,
        ).json()["id"]
        resp = client.put(
            f"/tickets/{ticket_id}",
            json={"title": "New Title", "priority": 1},
            headers=headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["title"] == "New Title"
        assert data["priority"] == 1

    def test_move_ticket_between_columns(self, client):
        headers = _auth_headers(client)
        board_id = _create_board(client).json()["id"]
        col1_id = client.post(
            f"/boards/{board_id}/columns",
            json={"name": "To Do", "position": 0},
            headers=headers,
        ).json()["id"]
        col2_id = client.post(
            f"/boards/{board_id}/columns",
            json={"name": "Done", "position": 1},
            headers=headers,
        ).json()["id"]
        ticket_id = client.post(
            f"/tickets/columns/{col1_id}/tickets",
            json={"title": "Move me"},
            headers=headers,
        ).json()["id"]
        resp = client.put(
            f"/tickets/{ticket_id}",
            json={"column_id": col2_id},
            headers=headers,
        )
        assert resp.status_code == 200
        assert resp.json()["column_id"] == col2_id

    def test_move_ticket_wrong_board(self, client):
        headers = _auth_headers(client)
        board1_id = client.post("/boards/", json={"name": "Board 1"}, headers=headers).json()["id"]
        board2_id = client.post("/boards/", json={"name": "Board 2"}, headers=headers).json()["id"]
        col1_id = client.post(
            f"/boards/{board1_id}/columns", json={"name": "To Do"}, headers=headers
        ).json()["id"]
        col2_id = client.post(
            f"/boards/{board2_id}/columns", json={"name": "Done"}, headers=headers
        ).json()["id"]
        ticket_id = client.post(
            f"/tickets/columns/{col1_id}/tickets",
            json={"title": "Cross-board"},
            headers=headers,
        ).json()["id"]
        resp = client.put(
            f"/tickets/{ticket_id}",
            json={"column_id": col2_id},
            headers=headers,
        )
        assert resp.status_code == 400

    def test_delete_ticket(self, client):
        headers = _auth_headers(client)
        board_id = _create_board(client).json()["id"]
        col_id = client.post(
            f"/boards/{board_id}/columns",
            json={"name": "To Do"},
            headers=headers,
        ).json()["id"]
        ticket_id = client.post(
            f"/tickets/columns/{col_id}/tickets",
            json={"title": "Delete me"},
            headers=headers,
        ).json()["id"]
        resp = client.delete(f"/tickets/{ticket_id}", headers=headers)
        assert resp.status_code == 204
        resp2 = client.get(f"/tickets/{ticket_id}", headers=headers)
        assert resp2.status_code == 404

    def test_ticket_forbidden_other_user(self, client):
        headers = _auth_headers(client)
        board_id = client.post("/boards/", json={"name": "Mein Board"}, headers=headers).json()[
            "id"
        ]
        col_id = client.post(
            f"/boards/{board_id}/columns", json={"name": "To Do"}, headers=headers
        ).json()["id"]
        ticket_id = client.post(
            f"/tickets/columns/{col_id}/tickets",
            json={"title": "Secret"},
            headers=headers,
        ).json()["id"]
        _register(client, email="other@example.com", password="securepass123")
        token2 = _login(client, email="other@example.com", password="securepass123").json()[
            "access_token"
        ]
        headers2 = {"Authorization": f"Bearer {token2}"}
        resp = client.get(f"/tickets/{ticket_id}", headers=headers2)
        assert resp.status_code == 403


class TestWIPLimit:
    def test_wip_limit_enforced_on_create(self, client):
        headers = _auth_headers(client)
        board_id = client.post("/boards/", json={"name": "Mein Board"}, headers=headers).json()[
            "id"
        ]
        col_id = client.post(
            f"/boards/{board_id}/columns",
            json={"name": "In Progress", "position": 0, "wip_limit": 2},
            headers=headers,
        ).json()["id"]
        client.post(
            f"/tickets/columns/{col_id}/tickets",
            json={"title": "Ticket 1"},
            headers=headers,
        )
        client.post(
            f"/tickets/columns/{col_id}/tickets",
            json={"title": "Ticket 2"},
            headers=headers,
        )
        resp = client.post(
            f"/tickets/columns/{col_id}/tickets",
            json={"title": "Ticket 3 - should fail"},
            headers=headers,
        )
        assert resp.status_code == 409

    def test_wip_limit_enforced_on_move(self, client):
        headers = _auth_headers(client)
        board_id = client.post("/boards/", json={"name": "Mein Board"}, headers=headers).json()[
            "id"
        ]
        col1_id = client.post(
            f"/boards/{board_id}/columns",
            json={"name": "Backlog", "position": 0},
            headers=headers,
        ).json()["id"]
        col2_id = client.post(
            f"/boards/{board_id}/columns",
            json={"name": "Review", "position": 1, "wip_limit": 1},
            headers=headers,
        ).json()["id"]
        client.post(
            f"/tickets/columns/{col2_id}/tickets",
            json={"title": "Already there"},
            headers=headers,
        )
        ticket_id = client.post(
            f"/tickets/columns/{col1_id}/tickets",
            json={"title": "Move me"},
            headers=headers,
        ).json()["id"]
        resp = client.put(
            f"/tickets/{ticket_id}",
            json={"column_id": col2_id},
            headers=headers,
        )
        assert resp.status_code == 409

    def test_wip_limit_not_exceeded_when_no_limit(self, client):
        headers = _auth_headers(client)
        board_id = client.post("/boards/", json={"name": "Mein Board"}, headers=headers).json()[
            "id"
        ]
        col_id = client.post(
            f"/boards/{board_id}/columns",
            json={"name": "Backlog", "position": 0},
            headers=headers,
        ).json()["id"]
        for i in range(10):
            resp = client.post(
                f"/tickets/columns/{col_id}/tickets",
                json={"title": f"Ticket {i}"},
                headers=headers,
            )
            assert resp.status_code == 201


class TestCommentCRUD:
    def test_create_comment(self, client):
        headers = _auth_headers(client)
        board_id = client.post("/boards/", json={"name": "Mein Board"}, headers=headers).json()[
            "id"
        ]
        col_id = client.post(
            f"/boards/{board_id}/columns", json={"name": "To Do"}, headers=headers
        ).json()["id"]
        ticket_id = client.post(
            f"/tickets/columns/{col_id}/tickets",
            json={"title": "Discuss"},
            headers=headers,
        ).json()["id"]
        resp = client.post(
            f"/tickets/{ticket_id}/comments",
            json={"content": "Nice idea!"},
            headers=headers,
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["content"] == "Nice idea!"
        assert data["ticket_id"] == ticket_id

    def test_list_comments(self, client):
        headers = _auth_headers(client)
        board_id = client.post("/boards/", json={"name": "Mein Board"}, headers=headers).json()[
            "id"
        ]
        col_id = client.post(
            f"/boards/{board_id}/columns", json={"name": "To Do"}, headers=headers
        ).json()["id"]
        ticket_id = client.post(
            f"/tickets/columns/{col_id}/tickets",
            json={"title": "Thread"},
            headers=headers,
        ).json()["id"]
        client.post(
            f"/tickets/{ticket_id}/comments",
            json={"content": "First"},
            headers=headers,
        )
        client.post(
            f"/tickets/{ticket_id}/comments",
            json={"content": "Second"},
            headers=headers,
        )
        resp = client.get(f"/tickets/{ticket_id}/comments", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 2
        assert data[0]["content"] == "First"
        assert data[1]["content"] == "Second"

    def test_delete_comment(self, client):
        headers = _auth_headers(client)
        board_id = client.post("/boards/", json={"name": "Mein Board"}, headers=headers).json()[
            "id"
        ]
        col_id = client.post(
            f"/boards/{board_id}/columns", json={"name": "To Do"}, headers=headers
        ).json()["id"]
        ticket_id = client.post(
            f"/tickets/columns/{col_id}/tickets",
            json={"title": "Thread"},
            headers=headers,
        ).json()["id"]
        comment_id = client.post(
            f"/tickets/{ticket_id}/comments",
            json={"content": "Delete me"},
            headers=headers,
        ).json()["id"]
        resp = client.delete(f"/tickets/{ticket_id}/comments/{comment_id}", headers=headers)
        assert resp.status_code == 204

    def test_comment_forbidden_other_user(self, client):
        headers = _auth_headers(client)
        board_id = client.post("/boards/", json={"name": "Mein Board"}, headers=headers).json()[
            "id"
        ]
        col_id = client.post(
            f"/boards/{board_id}/columns", json={"name": "To Do"}, headers=headers
        ).json()["id"]
        ticket_id = client.post(
            f"/tickets/columns/{col_id}/tickets",
            json={"title": "Secret"},
            headers=headers,
        ).json()["id"]
        _register(client, email="other@example.com", password="securepass123")
        token2 = _login(client, email="other@example.com", password="securepass123").json()[
            "access_token"
        ]
        headers2 = {"Authorization": f"Bearer {token2}"}
        resp = client.post(
            f"/tickets/{ticket_id}/comments",
            json={"content": "Sneaky"},
            headers=headers2,
        )
        assert resp.status_code == 403
