"""
CampusOps — Application Configuration
Zero-cost, offline configuration defaults using standard Python / Pydantic Settings.
"""

import os
from pathlib import Path
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
DATA_DIR = BASE_DIR / "data"

class Settings(BaseModel):
    # App Information
    PROJECT_NAME: str = "CampusOps"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "True").lower() in ("true", "1")

    # Host & Port
    BACKEND_HOST: str = os.getenv("BACKEND_HOST", "127.0.0.1")
    BACKEND_PORT: int = int(os.getenv("BACKEND_PORT", "8000"))

    # Security & JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "campusops-insecure-dev-secret-change-in-production-only")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

    # Database
    # Default: Async SQLite for friction-free zero-cost local dev.
    # Production alternative: postgresql+asyncpg://...
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        f"sqlite+aiosqlite:///{DATA_DIR / 'campusops.db'}"
    )

    # Campus & GeoJSON
    CAMPUS_GEOJSON_PATH: str = os.getenv("CAMPUS_GEOJSON_PATH", str(DATA_DIR / "campus.geojson"))
    DEFAULT_CAMPUS_NAME: str = os.getenv("DEFAULT_CAMPUS_NAME", "Sri Krishna Campus")

    # Layer 1 AI Config
    AI_LAYER1_ENABLED: bool = True
    AI_LAYER2_ENABLED: bool = os.getenv("AI_LAYER2_ENABLED", "False").lower() in ("true", "1")
    AI_LAYER3_ENABLED: bool = os.getenv("AI_LAYER3_ENABLED", "False").lower() in ("true", "1")

settings = Settings()

