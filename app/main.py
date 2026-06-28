from fastapi import FastAPI

from app.api.websocket import router as websocket_router

app = FastAPI(title="RackUpScoreboard Engine", version="1.0.0")

# Register cleanly separated routing modules here
app.include_router(websocket_router)


@app.get("/")
def health_check():
    return {"status": "healthy", "service": "RackUpScoreboard"}
