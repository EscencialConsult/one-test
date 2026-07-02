"""Dependencias compartidas: usuario actual y guardas por rol."""
from __future__ import annotations

import uuid

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.security import decode_access_token
from app.models.enums import RolUsuario
from app.models.evaluado import Evaluado
from app.models.user import Usuario

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

_credentials_exc = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Credenciales inválidas",
    headers={"WWW-Authenticate": "Bearer"},
)


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> Usuario:
    try:
        payload = decode_access_token(token)
        sub = payload.get("sub")
        if not sub:
            raise _credentials_exc
        user_id = uuid.UUID(sub)
    except (jwt.PyJWTError, ValueError):
        raise _credentials_exc

    user = await db.get(Usuario, user_id)
    if user is None or not user.activo:
        raise _credentials_exc
    return user


def require_superadmin(user: Usuario = Depends(get_current_user)) -> Usuario:
    if user.rol != RolUsuario.SUPERADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Requiere rol SuperAdmin")
    return user


def require_admin_empresa(user: Usuario = Depends(get_current_user)) -> Usuario:
    if user.rol != RolUsuario.ADMIN_EMPRESA:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Requiere rol Admin de Empresa")
    return user


def get_current_tenant_id(user: Usuario = Depends(require_admin_empresa)) -> uuid.UUID:
    """Empresa (tenant) del admin logueado. Garantiza el aislamiento por empresa."""
    if user.tenant_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El administrador no tiene una empresa asociada",
        )
    return user.tenant_id


async def get_current_evaluado(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> Evaluado:
    """Evaluado autenticado (token con rol 'evaluado')."""
    try:
        payload = decode_access_token(token)
        if payload.get("rol") != "evaluado":
            raise _credentials_exc
        evaluado_id = uuid.UUID(payload.get("sub", ""))
    except (jwt.PyJWTError, ValueError):
        raise _credentials_exc

    evaluado = await db.get(Evaluado, evaluado_id)
    if evaluado is None or not evaluado.activo:
        raise _credentials_exc
    return evaluado
