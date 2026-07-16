import os

from dotenv import load_dotenv

load_dotenv()


class Settings:
    ENV: str = os.getenv("ENV", "dev")
    STUB_REDIS: bool = os.getenv("STUB_REDIS", "true").lower() in {"1", "true", "yes", "on"}
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    REDIS_KEY_PREFIX: str = os.getenv("REDIS_KEY_PREFIX", "rackup:scoreboard")
    RACKUP_URL: str = os.getenv("RACKUP_URL", "http://localhost:8001/api")
    INTERNAL_SECRET_TOKEN: str = os.getenv("INTERNAL_SECRET_TOKEN", "")
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", 8004))
    RELOAD: bool = os.getenv("RELOAD", "true").lower() in {"1", "true", "yes", "on"}
    CORS_ALLOW_ORIGINS: list[str] = [
        origin.strip() for origin in os.getenv("CORS_ALLOW_ORIGINS", "").split(",") if origin.strip()
    ]


settings = Settings()
