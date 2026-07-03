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
    to: str = Query(...), key: str = Query(...),
    port: int | None = Query(None), mode: str = Query("starttls"),
) -> dict:
    """Intenta un envío real desde este servidor y devuelve el error exacto si falla.

    Protegido con SECRET_KEY. Temporal: para diagnosticar el envío en producción.
    port/mode permiten probar puertos alternativos (2525, 465 con mode=ssl).
    """
    if key != settings.SECRET_KEY:
        raise HTTPException(403, "Clave inválida")
    if not settings.email_habilitado:
        return {"ok": False, "error": "SMTP no configurado (email_habilitado=False)"}

    import smtplib
    import ssl as _ssl
    from email.message import EmailMessage

    p = port or settings.SMTP_PORT

    def _send() -> None:
        msg = EmailMessage()
        msg["Subject"] = f"Prueba ONE (Render :{p}/{mode})"
        msg["From"] = f"ONE Core Analytics <{settings.SMTP_FROM or settings.SMTP_USER}>"
        msg["To"] = to
        msg.set_content("Prueba de envío desde Render.")
        msg.add_alternative("<p>Prueba de envío <b>desde Render</b>.</p>", subtype="html")
        ctx = _ssl.create_default_context()
        if mode == "ssl":
            with smtplib.SMTP_SSL(settings.SMTP_HOST, p, timeout=20, context=ctx) as s:
                s.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                s.send_message(msg)
        else:
            with smtplib.SMTP(settings.SMTP_HOST, p, timeout=20) as s:
                s.starttls(context=ctx)
                s.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                s.send_message(msg)

    try:
        await asyncio.to_thread(_send)
        return {"ok": True, "detalle": f"Enviado a {to} por :{p}/{mode}"}
    except Exception as e:  # noqa: BLE001
        return {"ok": False, "port": p, "mode": mode, "error": f"{type(e).__name__}: {e}"}
