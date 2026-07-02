"""Configuración central de la aplicación (lee variables de entorno / .env)."""
from __future__ import annotations

from functools import lru_cache
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    DATABASE_URL: str
    SECRET_KEY: str = "change-me-in-prod"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    ALGORITHM: str = "HS256"
    ENV: str = "dev"
    CORS_ORIGINS: str = "http://localhost:5173"
    # Conexión a Render desde fuera requiere SSL. Para un Postgres local sin SSL, poné DB_SSL=false.
    DB_SSL: bool = True

    # ── Correo (SMTP) ─────────────────────────────────────────────────────────
    # Si SMTP_HOST está vacío, el envío de correos queda deshabilitado (no rompe nada).
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = ""            # remitente (ej. no-reply@escencial.com); si vacío usa SMTP_USER
    SMTP_FROM_NAME: str = "PACK ONE MATCH"
    SMTP_STARTTLS: bool = True     # True para puerto 587; False + SMTP_SSL para 465

    # ── URLs de la app (para los links de los correos) ────────────────────────
    PUBLIC_BASE_URL: str = "http://localhost:5173"  # URL principal del frontend
    TENANT_DOMAIN: str = ""       # ej. "one.com" → links tipo https://techsur.one.com (cuando el subdominio esté activo)

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def email_habilitado(self) -> bool:
        return bool(self.SMTP_HOST.strip())

    def url_empresa(self, subdominio: str) -> str:
        """Link de acceso de una empresa (subdominio si está activo, si no la URL general)."""
        if self.TENANT_DOMAIN.strip():
            return f"https://{subdominio}.{self.TENANT_DOMAIN.strip()}"
        return f"{self.PUBLIC_BASE_URL.rstrip('/')}/login"

    def url_evaluado(self, subdominio: str) -> str:
        if self.TENANT_DOMAIN.strip():
            return f"https://{subdominio}.{self.TENANT_DOMAIN.strip()}/evaluado"
        return f"{self.PUBLIC_BASE_URL.rstrip('/')}/evaluado"

    def url_eval(self, token: str) -> str:
        """Link público para responder una campaña de evaluación (por token)."""
        return f"{self.PUBLIC_BASE_URL.rstrip('/')}/eval/{token}"

    def _base_url(self) -> str:
        # Render a veces entrega 'postgres://'; SQLAlchemy requiere 'postgresql://'.
        url = self.DATABASE_URL
        if url.startswith("postgres://"):
            url = "postgresql://" + url[len("postgres://"):]
        return url

    @property
    def async_database_url(self) -> str:
        """URL para asyncpg (app). El SSL se maneja por connect_args, no en la query."""
        parts = urlsplit(self._base_url().replace("postgresql://", "postgresql+asyncpg://", 1))
        query = [(k, v) for k, v in parse_qsl(parts.query) if k != "sslmode"]
        return urlunsplit(parts._replace(query=urlencode(query)))

    @property
    def sync_database_url(self) -> str:
        """URL para psycopg (Alembic). Acepta sslmode en la query."""
        parts = urlsplit(self._base_url().replace("postgresql://", "postgresql+psycopg://", 1))
        query = dict(parse_qsl(parts.query))
        if self.DB_SSL:
            query.setdefault("sslmode", "require")
        return urlunsplit(parts._replace(query=urlencode(query)))


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
