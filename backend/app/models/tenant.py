"""Empresa = tenant. Cada empresa es un espacio de datos aislado."""
from __future__ import annotations

from typing import Optional

from sqlalchemy import Enum as SAEnum
from sqlalchemy import String, Text, text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDPkMixin
from app.models.enums import EstadoEmpresa


class Empresa(UUIDPkMixin, TimestampMixin, Base):
    __tablename__ = "empresa"

    razon_social: Mapped[str] = mapped_column(String(255), nullable=False)
    subdominio: Mapped[str] = mapped_column(String(63), unique=True, index=True, nullable=False)
    email_admin: Mapped[str] = mapped_column(String(255), nullable=False)
    # Guarda una URL externa o un data URI base64 (por eso Text, no String corto).
    logo_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    color_acento: Mapped[str] = mapped_column(String(9), default="#4d248f", nullable=False)
    color_secundario: Mapped[str] = mapped_column(
        String(9), default="#6be1e3", server_default=text("'#6be1e3'"), nullable=False
    )
    estado: Mapped[EstadoEmpresa] = mapped_column(
        SAEnum(EstadoEmpresa, name="estado_empresa", values_callable=lambda e: [m.value for m in e]),
        default=EstadoEmpresa.ACTIVO,
        nullable=False,
    )
