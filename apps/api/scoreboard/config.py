import os

from dotenv import load_dotenv

load_dotenv()


class Settings:
    RACKUP_URL: str = os.getenv("RACKUP_URL", "http://localhost:8001/api")
    INTERNAL_SECRET_TOKEN: str = os.getenv("INTERNAL_SECRET_TOKEN", "")
    PORT: int = int(os.getenv("PORT", 8004))
    CORS_ALLOW_ORIGINS: list[str] = [
        origin.strip() for origin in os.getenv("CORS_ALLOW_ORIGINS", "").split(",") if origin.strip()
    ]


settings = Settings()
