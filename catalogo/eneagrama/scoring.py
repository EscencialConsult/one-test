"""
Motor de cálculo DETERMINISTA — Eneagrama Profesional (54 ítems).

Port fiel de Test9/script.gs (calcularPuntajes + generarInformeHTML, selección de
arquetipo) y de Test9/index.html (calculateResults). Sin IA: mismo input -> mismo output.
Lógica aprobada, no se altera; solo se porta.

Entrada:  respuestas del evaluado por ítem en escala 1-5.
          - dict con claves base-0 (formato del front: {"0":v, ..., "53":v}),
          - dict con ids base-1 (1..54),
          - o lista/secuencia de 54 valores (posición 0 = primer ítem).
Salida:   por eneatipo -> puntaje (6-30) y porcentaje; ranking ordenado;
          dominante / secundario / terciario; arquetipo (combinación dom-ala).
"""

from __future__ import annotations

import json
import math
from pathlib import Path
from typing import Mapping, Sequence

_DIR = Path(__file__).parent

with (_DIR / "baremos.json").open(encoding="utf-8") as _f:
    _B = json.load(_f)
    # MAPEO_PREGUNTAS: eneatipo (1-9) -> lista de índices base-0.
    _MAPEO = {int(k): v for k, v in _B["mapeo_eneatipo_indices"].items()
              if not k.startswith("_")}
    _NOMBRES = {int(k): v for k, v in _B["nombres"].items()}
    _DENOM = _B["denominador_porcentaje"]
with (_DIR / "interpretaciones.json").open(encoding="utf-8") as _f:
    _I = json.load(_f)
    _POR_ENEATIPO = {int(k): v for k, v in _I["por_eneatipo"].items()}
    _COMBINACIONES = _I["combinaciones"]
    _ARQ_GENERICO = _I["arquetipo_generico"]

ENEATIPOS = list(range(1, 10))


def _round_half_up(x: float) -> int:
    """Replica JS Math.round (half-up) para valores no negativos."""
    return math.floor(x + 0.5)


def _normalizar(respuestas: Mapping | Sequence) -> dict[int, int]:
    """Devuelve un dict {indice_base_0: valor}.

    Acepta:
      - dict con claves base-0 (formato del front),
      - dict con ids base-1 (1..54) -> se convierten a base-0,
      - lista/tupla de 54 valores (posición 0 = índice 0).

    Heurística para distinguir base-0 de base-1 en dicts: si aparece la clave 0
    es base-0; si no aparece 0 pero sí 54, es base-1. En cualquier otro caso se
    asume base-0 (el formato real del legacy).
    """
    if isinstance(respuestas, Mapping):
        claves = {int(k): int(v) for k, v in respuestas.items()}
        if 0 in claves:
            return claves
        if 54 in claves and 0 not in claves:
            return {k - 1: v for k, v in claves.items()}
        return claves
    return {i: int(v) for i, v in enumerate(respuestas)}


def _arquetipo(dom_tipo: int, sec_tipo: int) -> dict:
    """Selección del arquetipo: dom-sec, luego sec-dom, luego genérico.

    Port de generarInformeHTML: key=`dom-sec`; si no existe key=`sec-dom`;
    si tampoco, arquetipo 'LA FUSIÓN' con cualidad/fortalezas construidas.
    """
    key = f"{dom_tipo}-{sec_tipo}"
    if key not in _COMBINACIONES:
        key = f"{sec_tipo}-{dom_tipo}"
    if key in _COMBINACIONES:
        return dict(_COMBINACIONES[key])
    nombre_dom = _POR_ENEATIPO[dom_tipo]["nombre"]
    nombre_sec = _POR_ENEATIPO[sec_tipo]["nombre"]
    return {
        "arq": _ARQ_GENERICO["arq"],
        "desc": _ARQ_GENERICO["desc"],
        "cualidad": f"Equilibrio entre {nombre_dom} y {nombre_sec}",
        "fortalezas": _POR_ENEATIPO[sec_tipo]["fortalezas"],
    }


def calcular(respuestas: Mapping | Sequence) -> dict:
    """Calcula el perfil de Eneagrama. respuestas en escala 1-5 (ver módulo)."""
    r = _normalizar(respuestas)

    puntajes: dict[int, int] = {}
    porcentajes: dict[int, int] = {}
    for tipo in ENEATIPOS:
        suma = 0
        for idx in _MAPEO[tipo]:
            # Sin inversión: suma directa. Faltantes -> 0 (como en el .gs).
            suma += int(r.get(idx, 0) or 0)
        puntajes[tipo] = suma
        porcentajes[tipo] = _round_half_up((suma / _DENOM) * 100)

    # Ranking: orden de eneatipo (1..9), sort estable descendente por puntaje.
    # En empate gana el eneatipo de MENOR número (estabilidad del sort del .gs).
    ranking = [
        {
            "tipo": tipo,
            "nombre": _NOMBRES[tipo],
            "puntaje": puntajes[tipo],
            "porcentaje": porcentajes[tipo],
        }
        for tipo in ENEATIPOS
    ]
    ranking.sort(key=lambda x: -x["puntaje"])  # estable: conserva orden de tipo

    dom = ranking[0]
    sec = ranking[1]
    ter = ranking[2]

    arquetipo = _arquetipo(dom["tipo"], sec["tipo"])

    def _detalle(entry: dict) -> dict:
        t = entry["tipo"]
        txt = _POR_ENEATIPO[t]
        return {
            "tipo": t,
            "nombre": txt["nombre"],
            "puntaje": entry["puntaje"],
            "porcentaje": entry["porcentaje"],
            "general": txt["general"],
            "motivacion": txt["motivacion"],
            "miedo": txt["miedo"],
            "rasgos": txt["rasgos"],
            "fortalezas": txt["fortalezas"],
            "areas": txt["areas"],
        }

    return {
        "puntajes": puntajes,
        "porcentajes": porcentajes,
        "ranking": ranking,
        "dominante": _detalle(dom),
        "secundario": _detalle(sec),
        "terciario": _detalle(ter),
        "arquetipo": arquetipo,
    }


if __name__ == "__main__":
    import pprint

    pprint.pprint(calcular({i: 3 for i in range(54)}))
