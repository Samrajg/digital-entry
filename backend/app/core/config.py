from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # BUG-15 FIX: CORS origins are now driven from the environment.
    # Set CORS_ORIGINS in .env as a comma-separated list, e.g.:
    #   CORS_ORIGINS=http://localhost:3000,http://10.10.3.29:3000
    # Defaults to localhost only if the variable is not set.
    CORS_ORIGINS: str = "http://localhost:3000"

    # Base URL used when building QR destination URLs (used by qr_code_service.py)
    FRONTEND_URL: str = "http://localhost:3000"

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS_ORIGINS CSV string into a list."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
