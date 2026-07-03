"""Endpoints públicos (sin auth): marca de una empresa por su subdominio.

Sirve para brandear el login cuando se entra por techsur.onecoreanalytics.escencialconsultora.com.
Solo expone datos de marca (nombre, logo, colores) — nada sensible.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.models.tenant import Empresa

router = APIRouter(prefix="/publico", tags=["público"])


@router.get("/marca/{subdominio}")
async def marca_por_subdominio(subdominio: str, db: AsyncSession = Depends(get_db)) -> dict:
    emp = (
        await db.execute(
            select(Empresa).where(func.lower(Empresa.subdominio) == subdominio.strip().lower())
        )
    ).scalar_one_or_none()
    if emp is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No hay una empresa con ese subdominio")
    return {
        "subdominio": emp.subdominio,
        "razon_social": emp.razon_social,
        "logo_url": emp.logo_url,
        "color_acento": emp.color_acento,
        "color_secundario": emp.color_secundario,
    }
