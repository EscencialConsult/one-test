"""Generación de informes gerenciales integrales con IA (OpenAI).

Regla de oro (no negociable): la IA SOLO redacta e integra. Recibe los resultados
YA CALCULADOS de cada test (deterministas) y los trata como HECHOS INMODIFICABLES:
no recalcula, no cambia tipos/niveles/puntajes, no inventa datos. Si dos tests
parecen contradecirse, lo señala como observación, sin "corregir" ningún resultado.
"""
from __future__ import annotations

import asyncio
import json
import logging

from app.core.config import settings

logger = logging.getLogger("app.ia")

# Estructura de salida esperada (la IA debe devolver EXACTAMENTE estas claves).
_ESQUEMA_SALIDA = {
    "titulo": "string",
    "resumen_ejecutivo": "string (2-4 párrafos)",
    "perfil_por_test": [{"test": "nombre del test", "sintesis": "qué dice ese test sobre la persona, respetando literalmente sus resultados"}],
    "integracion": "string: coherencias y tensiones ENTRE los tests, sin alterar ningún resultado",
    "fortalezas": ["string"],
    "areas_desarrollo": ["string"],
    "recomendaciones": ["string: acciones concretas para gerencia/RRHH"],
    "cierre": "string: párrafo de cierre ejecutivo",
}

_SYSTEM = (
    "Sos un analista senior de Recursos Humanos. Redactás un INFORME GERENCIAL INTEGRAL "
    "en español rioplatense, con tono ejecutivo, claro y profesional, para presentar a la "
    "gerencia de una empresa. Integrás los resultados de varias pruebas psicométricas que "
    "rindió UNA misma persona.\n\n"
    "REGLAS ABSOLUTAS (obligatorias):\n"
    "1. Los resultados de cada test que te paso ya están CALCULADOS y son HECHOS. "
    "NO los modifiques, NO los recalcules, NO cambies ningún tipo, eneatipo, dimensión, "
    "nivel, categoría ni puntaje. Ejemplo: si el eneagrama dice eneatipo 5 y 3, en tu "
    "informe sigue siendo 5 y 3 — jamás otro número.\n"
    "2. NO inventes datos, puntajes ni resultados que no estén en la información provista.\n"
    "3. Tu trabajo es INTEGRAR e INTERPRETAR en conjunto: qué perfil surge al cruzar los "
    "tests, coherencias y tensiones entre ellos, fortalezas y áreas de desarrollo, y "
    "recomendaciones accionables. Si dos tests parecen contradecirse, señalalo como "
    "observación; nunca 'resuelvas' cambiando un resultado.\n"
    "4. Basá TODO exclusivamente en los datos provistos. No uses conocimiento externo "
    "sobre la persona.\n"
    "5. Devolvé ÚNICAMENTE un JSON válido con esta forma exacta (sin texto fuera del JSON):\n"
    + json.dumps(_ESQUEMA_SALIDA, ensure_ascii=False, indent=2)
)


def _construir_prompt(evaluado: str, empresa: str, tests: list[dict]) -> str:
    """Arma el mensaje de usuario con los resultados deterministas de cada test."""
    partes = [
        f"Persona evaluada: {evaluado}",
        f"Empresa: {empresa}",
        f"Cantidad de tests a integrar: {len(tests)}",
        "",
        "A continuación, los RESULTADOS YA CALCULADOS de cada test (son hechos inmodificables). "
        "Cada bloque trae el nombre del test y su salida en JSON:",
        "",
    ]
    for t in tests:
        partes.append(f"=== TEST: {t['nombre']} ===")
        partes.append(json.dumps(t["datos"], ensure_ascii=False))
        partes.append("")
    partes.append(
        "Redactá el informe gerencial integral respetando literalmente todos los resultados "
        "anteriores. Devolvé solo el JSON con la forma indicada."
    )
    return "\n".join(partes)


def _generar_sync(evaluado: str, empresa: str, tests: list[dict]) -> dict:
    from openai import OpenAI

    client = OpenAI(api_key=settings.OPENAI_API_KEY)
    resp = client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=[
            {"role": "system", "content": _SYSTEM},
            {"role": "user", "content": _construir_prompt(evaluado, empresa, tests)},
        ],
        response_format={"type": "json_object"},
        temperature=0.4,
        max_tokens=settings.OPENAI_MAX_TOKENS,
    )
    contenido = resp.choices[0].message.content or "{}"
    data = json.loads(contenido)
    if not isinstance(data, dict):
        raise ValueError("La IA no devolvió un objeto JSON válido")
    return data


async def generar_informe_integral(evaluado: str, empresa: str, tests: list[dict]) -> dict:
    """Genera el informe integral. Lanza excepción si la IA no está configurada o falla.

    tests: [{"nombre": str, "datos": dict}] — datos = salida determinista del scoring.
    """
    if not settings.ia_habilitada:
        raise RuntimeError("La IA no está configurada (falta OPENAI_API_KEY).")
    if not tests:
        raise ValueError("No hay tests para integrar.")
    data = await asyncio.to_thread(_generar_sync, evaluado, empresa, tests)
    logger.info("Informe integral generado para %s (%d tests)", evaluado, len(tests))
    return data
