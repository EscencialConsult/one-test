"""Autenticación: login (JWT) y datos del usuario actual."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.db import get_db
from app.core.security import create_access_token, verify_password
from app.models.evaluado import Evaluado
from app.models.user import Usuario
from app.schemas.auth import Token, UsuarioOut

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=Token)
async def login(
    form: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
) -> Token:
    result = await db.execute(select(Usuario).where(Usuario.email == form.username.lower()))
    user = result.scalar_one_or_none()
    if user is None or not user.activo or not verify_password(form.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
        )
    claims = {
        "rol": user.rol.value,
        "tenant_id": str(user.tenant_id) if user.tenant_id else None,
    }
    return Token(access_token=create_access_token(str(user.id), claims))


@router.get("/me", response_model=UsuarioOut)
async def me(user: Usuario = Depends(get_current_user)) -> Usuario:
    return user


@router.post("/evaluado/login", response_model=Token)
async def login_evaluado(
    form: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
) -> Token:
    """Login del evaluado (email + contraseña que definió su empresa)."""
    email = form.username.lower().strip()
    result = await db.execute(select(Evaluado).where(Evaluado.email == email, Evaluado.activo.is_(True)))
    for ev in result.scalars().all():
        if ev.password_hash and verify_password(form.password, ev.password_hash):
            claims = {"rol": "evaluado", "tenant_id": str(ev.tenant_id)}
            return Token(access_token=create_access_token(str(ev.id), claims))
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Email o contraseña incorrectos",
    )
