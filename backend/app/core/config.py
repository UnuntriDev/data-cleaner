from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration, loaded from environment / .env."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "sqlite:///./app.db"
    storage_dir: Path = Path("./_storage")
    log_level: str = "INFO"
    preview_rows: int = 50
    max_upload_mb: int = 50

    # SQL import lets the caller hand the server an arbitrary DB connection URL
    # + query to dial out to — a classic SSRF / internal-network access vector
    # in a hosted deployment. Off by default; opt in only on trusted setups.
    enable_sql_import: bool = False

    # Comma-separated allowed CORS origins (env: CORS_ORIGINS). Defaults to the
    # local dev frontend. Never defaults to "*".
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    @property
    def max_upload_bytes(self) -> int:
        return self.max_upload_mb * 1024 * 1024

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def upload_dir(self) -> Path:
        return self.storage_dir / "uploads"

    @property
    def result_dir(self) -> Path:
        return self.storage_dir / "results"

    @property
    def export_dir(self) -> Path:
        return self.storage_dir / "exports"

    def ensure_dirs(self) -> None:
        for path in (self.upload_dir, self.result_dir, self.export_dir):
            path.mkdir(parents=True, exist_ok=True)


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    settings.ensure_dirs()
    return settings
