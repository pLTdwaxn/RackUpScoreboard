# run.py
import uvicorn

from scoreboard.core.config import settings

if __name__ == "__main__":
    print(f"Starting Uvicorn server on port {settings.PORT}...")
    uvicorn.run("scoreboard.main:app", host="127.0.0.1", port=settings.PORT, reload=True)
