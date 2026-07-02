"""Motor de base de datos asíncrono y sesión por request."""
from __future__ import annotations

import ssl
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings

# Render/Neon/Supabase (y la mayoría de Postgres gestionados) exigen SSL para conexiones externas.
# statement_cache_size=0 → compatibilidad con poolers tipo pgbouncer (Supabase Session/Transaction pooler).
_connect_args: dict = {"statement_cache_size": 0}
if settings.DB_SSL:
    _connect_args["ssl"] = ssl.create_default_context()

engine = create_async_engine(
    settings.async_database_url,
    pool_pre_ping=True,
    echo=(settings.ENV == "dev"),
    connect_args=_connect_args,
)

SessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependencia FastAPI: entrega una sesión y la cierra al terminar."""
    async with SessionLocal() as session:
        yield session
