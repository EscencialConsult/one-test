"""Enumeraciones del dominio."""
from __future__ import annotations

import enum


class RolUsuario(str, enum.Enum):
    SUPERADMIN = "superadmin"
    ADMIN_EMPRESA = "admin_empresa"


class EstadoEmpresa(str, enum.Enum):
    ACTIVO = "activo"
    SUSPENDIDO = "suspendido"
