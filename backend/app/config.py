import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

BASE_DIR = Path(__file__).resolve().parent.parent.parent

def _get_default_database_url() -> str:
    env_url = os.environ.get("DATABASE_URL")
    is_serverless = bool(os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"))
    if env_url:
        if is_serverless and env_url.startswith("sqlite:///") and not env_url.startswith("sqlite:////tmp/"):
            return "sqlite:////tmp/sentinel.db"
        return env_url
    if is_serverless:
        return "sqlite:////tmp/sentinel.db"
    return "sqlite:///./sentinel.db"

class Settings(BaseSettings):
    PROJECT_NAME: str = "Sentinel Memory"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"

    # Hindsight Configuration
    HINDSIGHT_API_KEY: Optional[str] = None
    HINDSIGHT_BASE_URL: str = "https://api.hindsight.vectorize.io"
    HINDSIGHT_BANK_ID: str = "sentinel-memory"

    # LLM Configuration (Groq preferred)
    GROQ_API_KEY: Optional[str] = None
    LLM_MODEL: str = "llama-3.3-70b-versatile"

    # Database
    DATABASE_URL: str = _get_default_database_url()

    # Frontend
    FRONTEND_URL: str = "http://localhost:5173"

    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
