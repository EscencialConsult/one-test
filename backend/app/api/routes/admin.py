"""Métricas globales para el panel SuperAdmin (dashboard)."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_superadmin
from app.core import engine
from app.core.db import get_db
from app.models.empresa_test import EmpresaTest  # noqa: F401 (asegura metadata)
from app.models.enums import EstadoEmpresa
from app.models.evaluado import Evaluado
from app.models.resultado import Resultado
from app.models.tenant import Empresa

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_superadmin)])


@router.get("/resumen")
async def resumen(db: AsyncSession = Depends(get_db)) -> dict:
    empresas = (await db.execute(select(func.count()).select_from(Empresa))).scalar() or 0
    activas = (
        await db.execute(
            select(func.count()).select_from(Empresa).where(Empresa.estado == EstadoEmpresa.ACTIVO)
        )
    ).scalar() or 0
    evaluados = (await db.execute(select(func.count()).select_from(Evaluado))).scalar() or 0
    resultados = (await db.execute(select(func.count()).select_from(Resultado))).scalar() or 0

    cat = engine.listar_catalogo()
    catmap = {t["slug"]: t["nombre"] for t in cat}
    rows = (
        await db.execute(
            select(Resultado.test_slug, func.count().label("n"))
            .group_by(Resultado.test_slug)
            .order_by(func.count().desc())
            .limit(5)
        )
    ).all()
    top = [{"slug": s, "nombre": catmap.get(s, s), "n": n} for s, n in rows]

    return {
        "empresas": empresas,
        "empresas_activas": activas,
        "evaluados": evaluados,
        "resultados": resultados,
        "tests_catalogo": len(cat),
        "tests_tomables": sum(1 for t in cat if t.get("tomable")),
        "tests_mas_usados": top,
    }
