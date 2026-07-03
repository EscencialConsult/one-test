"""Endpoints de salud del servicio y de la base de datos."""
from __future__ import annotations

import asyncio

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.db import get_db
from app.core.email import _send_sync

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


@router.get("/health/email/test")
async def health_email_test(
    to: str = Query(...), key: str = Query(...)
) -> dict:
    """Intenta un envío real desde este servidor y devuelve el error exacto si falla.

    Protegido con SECRET_KEY. Temporal: para diagnosticar el envío en producción.
    """
    if key != settings.SECRET_KEY:
        raise HTTPException(403, "Clave inválida")
    if not settings.email_habilitado:
        return {"ok": False, "error": "SMTP no configurado (email_habilitado=False)"}
    try:
        await asyncio.to_thread(
            _send_sync, to, "Prueba de envío ONE (producción)",
            "<p>Prueba de envío <b>desde Render</b>.</p>", "ONE Core Analytics",
        )
        return {"ok": True, "detalle": f"Enviado a {to} (encolado por el SMTP)"}
    except Exception as e:  # noqa: BLE001
        return {"ok": False, "error": f"{type(e).__name__}: {e}"}
