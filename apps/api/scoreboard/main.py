from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from scoreboard.config import settings
from scoreboard.routes.connect import router as connect_router
from scoreboard.routes.health import router as health_router
from scoreboard.routes.websocket import router as websocket_router

app = FastAPI(title="RackUpScoreboard Engine", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ALLOW_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register cleanly separated routing modules here
app.include_router(connect_router)
app.include_router(health_router)
app.include_router(websocket_router)
