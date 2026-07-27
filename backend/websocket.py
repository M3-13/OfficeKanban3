from fastapi import WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        self._connections: dict[int, list[WebSocket]] = {}

    async def connect(self, board_id: int, websocket: WebSocket) -> None:
        await websocket.accept()
        self._connections.setdefault(board_id, []).append(websocket)

    def disconnect(self, board_id: int, websocket: WebSocket) -> None:
        connections = self._connections.get(board_id, [])
        if websocket in connections:
            connections.remove(websocket)

    async def broadcast(self, board_id: int, event_type: str, payload: dict) -> None:
        pass


manager = ConnectionManager()
