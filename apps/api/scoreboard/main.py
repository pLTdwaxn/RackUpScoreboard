from fastapi import FastAPI

from scoreboard.routes.health import router as health_router
from scoreboard.routes.websocket import router as websocket_router

app = FastAPI(title="RackUpScoreboard Engine", version="1.0.0")

# Register cleanly separated routing modules here
app.include_router(health_router)
app.include_router(websocket_router)
