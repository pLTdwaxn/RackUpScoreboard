import json
from typing import Dict, List

from fastapi import FastAPI, WebSocket

app = FastAPI()


class ConnectionManager:
    def __init__(self):
        self.active_matches: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, matchroom_id: str):

        await websocket.accept()
        if matchroom_id not in self.active_matches:
            self.active_matches[matchroom_id] = []

        if len(self.active_matches[matchroom_id]) >= 2:
            await websocket.send_text(json.dumps({"error": "Match is full"}))
            await websocket.close()
            return False

        self.active_matches[matchroom_id].append(websocket)
        return True

    def disconnect(self, websocket: WebSocket, matchroom_id: str):
        if matchroom_id in self.active_matches:
            self.active_matches[matchroom_id].remove(websocket)
            if not self.active_matches[matchroom_id]:
                del self.active_matches[matchroom_id]

    async def broadcast(self, matchroom_id: str, message: dict):
        """Update the scores to all participants in the match."""
        if matchroom_id in self.active_matches:
            for websocket in self.active_matches[matchroom_id]:
                await websocket.send_text(json.dumps(message))


manager = ConnectionManager()


@app.get("/")
def home():
    return {"status": "Server is running."}


@app.get("/test-path")
def test_path():
    return {"message": "Uvicorn is definitely reading this exact file!"}
