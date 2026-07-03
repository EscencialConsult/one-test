"""Endpoints de salud del servicio y de la base de datos."""
from __future__ import annotations

import asyncio

from fastapi import APIRouter, Depends, HTTPException, Query
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


@router.get("/health/ia")
async def health_ia(key: str = Query(...)) -> dict:
    """Prueba real de conectividad con OpenAI desde este servidor.

    Protegido con SECRET_KEY. Temporal: para verificar la key/modelo en producción.
    """
    if key != settings.SECRET_KEY:
        raise HTTPException(403, "Clave inválida")
    if not settings.ia_habilitada:
        return {"ok": False, "error": "IA no configurada (falta OPENAI_API_KEY)"}

    def _ping() -> str:
        from openai import OpenAI
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        resp = client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[{"role": "user", "content": "Respondé solo con la palabra: OK"}],
            max_tokens=5,
        )
        return (resp.choices[0].message.content or "").strip()

    try:
        salida = await asyncio.to_thread(_ping)
        return {"ok": True, "modelo": settings.OPENAI_MODEL, "respuesta": salida}
    except Exception as e:  # noqa: BLE001
        return {"ok": False, "modelo": settings.OPENAI_MODEL, "error": f"{type(e).__name__}: {e}"}
