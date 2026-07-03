"""Endpoints de salud del servicio y de la base de datos."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.db import get_db

router = APIRouter(tags=["health"])


@router.get("/health")
async def health() -> dict:
    return {"status": "ok", "env": settings.ENV}


@router.get("/health/db")
async def health_db(db: AsyncSession = Depends(get_db)) -> dict:
    await db.execute(text("SELECT 1"))
    return {"status": "ok", "db": "ok"}


@router.get("/health/email")
async def health_email() -> dict:
    """Diagnóstico de la config de correo (sin exponer la contraseña)."""
    return {
        "habilitado": settings.email_habilitado,
        "host": settings.SMTP_HOST or "(vacío)",
        "port": settings.SMTP_PORT,
        "starttls": settings.SMTP_STARTTLS,
        "user_set": bool(settings.SMTP_USER),
        "password_set": bool(settings.SMTP_PASSWORD),
        "from": settings.SMTP_FROM or settings.SMTP_USER or "(vacío)",
        "from_name": settings.SMTP_FROM_NAME,
        "public_base_url": settings.PUBLIC_BASE_URL,
    }
