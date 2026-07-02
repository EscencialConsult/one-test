"""
Motor de calculo DETERMINISTA - Test de Toulouse-Pieron (atencion/percepcion).

Port fiel de Test13/script.gs (analizarRespuestas / clasificarPorBaremo /
clasificarPorNivel / identificarPerfil / analizarDistribucionPorSegmentos).
Sin IA: mismo input -> mismo output. Logica aprobada, no se altera; solo se porta.

ENTRADA: los indices (0-based) de los cuadrados marcados por el evaluado.
  Acepta:
    - string formato front: "{4m 20s - 12,45,300}"  (se limpia el prefijo)
    - string crudo:         "12,45,300"
    - lista de enteros:     [12, 45, 300]

SALIDA: dict con totalMarcados, totalProcesado, porcentajeCompletado, aciertos,
  errores, omisiones, indices (aciertos/errores/productividad/aptitud), niveles
  (atencion/precision/velocidad), perfil y analisis por segmentos.

ADVERTENCIA (ver ANALISIS.md - BLOQUEO): el legacy NO calcula aciertos reales por
comparacion contra los objetivos (el front no los envia). Los ESTIMA como
round(totalMarcados * 0.20). Este port replica esa formula EXACTA del .gs.
"""

from __future__ import annotations

import json
import math
import re
from pathlib import Path
from typing import Sequence

_DIR = Path(__file__).parent

with (_DIR / "preguntas.json").open(encoding="utf-8") as _f:
    _PLANTILLA = json.load(_f)["plantilla_correccion"]
with (_DIR / "baremos.json").open(encoding="utf-8") as _f:
    _BAREMOS = json.load(_f)
with (_DIR / "interpretaciones.json").open(encoding="utf-8") as _f:
    _INT = json.load(_f)
    _PERFILES = _INT["perfiles"]
    _PERFILES_ORDEN = _INT["perfiles_orden"]

# Constantes portadas de CONSTANTES_TEST (script.gs).
TOTAL_CUADRADOS = _PLANTILLA["total_cuadrados"]            # 1600
OBJETIVOS_ESPERADOS = _PLANTILLA["objetivos_esperados"]    # 320
FACTOR_ACIERTOS = _PLANTILLA["factor_estimacion_aciertos"]  # 0.20

_BAREMO_ACIERTOS = _BAREMOS["aciertos"]["tabla"]
_CLAS_ERRORES = _BAREMOS["errores"]["tabla"]
_CLAS_VELOCIDAD = _BAREMOS["velocidad"]["tabla"]


def _round_half_up(x: float) -> int:
    """Replica JS Math.round (half-up para valores no negativos): floor(x + 0.5)."""
    return math.floor(x + 0.5)


def _to_fixed_2(x: float) -> str:
    """Replica JS Number.prototype.toFixed(2): 2 decimales con redondeo half-up."""
    return f"{_round_half_up(x * 100) / 100:.2f}"


def _parsear_respuestas(respuestas: str | Sequence[int]) -> list[int]:
    """
    Port de la limpieza/parseo de analizarRespuestas (.gs).
      - Si hay ' - ', toma lo que sigue al ultimo ' - ' (quita prefijo de tiempo).
      - Elimina llaves { }.
      - Separa por coma, parseInt(base 10) y descarta NaN.
    Acepta tambien una lista/secuencia de enteros directamente.
    """
    if not isinstance(respuestas, str):
        out = []
        for v in respuestas:
            try:
                out.append(int(v))
            except (TypeError, ValueError):
                continue
        return out

    limpio = (respuestas or "").strip()
    if " - " in limpio:
        limpio = limpio.split(" - ")[-1]
    limpio = limpio.replace("{", "").replace("}", "").strip()

    out = []
    for token in limpio.split(","):
        token = token.strip()
        # parseInt JS: lee el prefijo numerico (entero). Replicado con regex.
        m = re.match(r"[+-]?\d+", token)
        if m:
            out.append(int(m.group(0)))
    return out


def _clasificar_por_rango(valor: int, tabla: list[dict]) -> dict:
    """Port de clasificarPorBaremo / clasificarPorNivel: primer rango que contiene
    el valor (min..max inclusive); fallback = ultima fila."""
    for fila in tabla:
        if fila["min"] <= valor <= fila["max"]:
            return fila
    return tabla[-1]


def _evaluar_criterio(criterio: dict, a: int, e: int, tp: int) -> bool:
    if criterio["tipo"] == "siempre":
        return True
    ctx = {"a": a, "e": e, "tp": tp}
    ops = {
        ">": lambda x, y: x > y,
        "<": lambda x, y: x < y,
        ">=": lambda x, y: x >= y,
        "<=": lambda x, y: x <= y,
        "==": lambda x, y: x == y,
    }
    resultados = [ops[op](ctx[var], val) for var, op, val in criterio["condiciones"]]
    if criterio["tipo"] == "and":
        return all(resultados)
    if criterio["tipo"] == "or":
        return any(resultados)
    raise ValueError(f"Tipo de criterio desconocido: {criterio['tipo']}")


def _identificar_perfil(aciertos: int, errores: int, total_procesado: int) -> dict:
    """Port de identificarPerfil: evalua perfiles en orden, primero que cumple."""
    for clave in _PERFILES_ORDEN:
        perfil = _PERFILES[clave]
        if _evaluar_criterio(perfil["criterio"], aciertos, errores, total_procesado):
            return {
                "clave": clave,
                "nombre": perfil["nombre"],
                "interpretacion": perfil["interpretacion"],
                "fortalezas": perfil["fortalezas"],
                "recomendaciones": perfil["recomendaciones"],
            }
    p = _PERFILES["INTERMEDIO"]
    return {
        "clave": "INTERMEDIO",
        "nombre": p["nombre"],
        "interpretacion": p["interpretacion"],
        "fortalezas": p["fortalezas"],
        "recomendaciones": p["recomendaciones"],
    }


def _analizar_segmentos(respuestas: list[int]) -> list[dict]:
    """Port de analizarDistribucionPorSegmentos: 10 segmentos de 160 cuadrados."""
    segmentos = 10
    tamano = TOTAL_CUADRADOS / segmentos
    distribucion = []
    for i in range(segmentos):
        inicio = i * tamano
        fin = (i + 1) * tamano
        en_segmento = sum(1 for r in respuestas if inicio <= r < fin)
        densidad = (en_segmento / tamano) * 100
        distribucion.append({
            "segmento": i + 1,
            "inicio": _round_half_up(inicio),
            "fin": _round_half_up(fin),
            "cantidad": en_segmento,
            "densidad": _to_fixed_2(densidad),
        })
    return distribucion


def calcular(respuestas: str | Sequence[int]) -> dict:
    """Calcula el analisis Toulouse-Pieron. respuestas: ver docstring del modulo."""
    parsed = _parsear_respuestas(respuestas)

    total_marcados = len(parsed)
    # Math.max sobre lista vacia en JS devuelve -Infinity; aqui se documenta como
    # caso degenerado: sin marcas, totalProcesado = 0 (ver _max_index).
    max_index = max(parsed) if parsed else -1
    total_procesado = max_index + 1

    porcentaje_completado = (total_procesado / TOTAL_CUADRADOS) * 100

    # Estimacion legacy: 20% de los marcados son aciertos (Math.round half-up).
    aciertos = _round_half_up(total_marcados * FACTOR_ACIERTOS)
    errores = total_marcados - aciertos
    omisiones = OBJETIVOS_ESPERADOS - aciertos

    indice_aciertos = (aciertos / total_procesado) * 100 if total_procesado else 0.0
    indice_errores = (errores / total_procesado) * 100 if total_procesado else 0.0
    indice_productividad = aciertos - errores
    coeficiente_aptitud = aciertos - (errores / 2)

    nivel_atencion = _clasificar_por_rango(aciertos, _BAREMO_ACIERTOS)
    nivel_precision = _clasificar_por_rango(errores, _CLAS_ERRORES)
    nivel_velocidad = _clasificar_por_rango(total_procesado, _CLAS_VELOCIDAD)

    perfil = _identificar_perfil(aciertos, errores, total_procesado)
    analisis_segmentos = _analizar_segmentos(parsed)

    return {
        "totalMarcados": total_marcados,
        "totalProcesado": total_procesado,
        "porcentajeCompletado": porcentaje_completado,
        "aciertos": aciertos,
        "errores": errores,
        "omisiones": omisiones,
        "indiceAciertos": indice_aciertos,
        "indiceErrores": indice_errores,
        "indiceProductividad": indice_productividad,
        "coeficienteAptitud": coeficiente_aptitud,
        "nivelAtencion": nivel_atencion,
        "nivelPrecision": nivel_precision,
        "nivelVelocidad": nivel_velocidad,
        "perfil": perfil,
        "analisisPorSegmentos": analisis_segmentos,
        "tieneObjetivos": False,
    }


if __name__ == "__main__":
    import pprint

    pprint.pprint(calcular("{4m 20s - 12,45,300,899,1500}"))
