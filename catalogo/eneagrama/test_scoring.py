"""Runner de regresión para Eneagrama. Ejecutar: python test_scoring.py"""

import json
from pathlib import Path

import scoring

_DIR = Path(__file__).parent
_N_ITEMS = 54


def _build_respuestas(caso: dict) -> dict:
    """Construye dict {indice_base_0: valor} a partir del caso (formato del front)."""
    if "fill" in caso:
        base = {i: caso["fill"] for i in range(_N_ITEMS)}
    else:
        base = {i: caso.get("fill_resto", 3) for i in range(_N_ITEMS)}
    for k, v in caso.get("respuestas", {}).items():
        base[int(k)] = v
    return base


def _check_bloque(nombre_bloque: str, esperado: dict, real: dict, errores: list) -> None:
    for clave, valor in esperado.items():
        if real.get(clave) != valor:
            errores.append(
                f"{nombre_bloque}.{clave}: esperado {valor!r}, obtenido {real.get(clave)!r}"
            )


def run() -> int:
    casos = json.loads((_DIR / "regresion.json").read_text(encoding="utf-8"))["casos"]
    fallos = 0
    for caso in casos:
        res = scoring.calcular(_build_respuestas(caso))
        esp = caso["esperado"]
        errores: list[str] = []

        for bloque in ("dominante", "secundario", "terciario"):
            if bloque in esp:
                _check_bloque(bloque, esp[bloque], res[bloque], errores)

        if "arquetipo" in esp and res["arquetipo"]["arq"] != esp["arquetipo"]:
            errores.append(
                f"arquetipo.arq: esperado {esp['arquetipo']!r}, obtenido {res['arquetipo']['arq']!r}"
            )

        for tipo, valor in esp.get("puntajes", {}).items():
            real = res["puntajes"][int(tipo)]
            if real != valor:
                errores.append(f"puntajes.{tipo}: esperado {valor!r}, obtenido {real!r}")

        for tipo, valor in esp.get("porcentajes", {}).items():
            real = res["porcentajes"][int(tipo)]
            if real != valor:
                errores.append(f"porcentajes.{tipo}: esperado {valor!r}, obtenido {real!r}")

        estado = "OK  " if not errores else "FALLA"
        if errores:
            fallos += 1
        print(f"[{estado}] {caso['nombre']}")
        for e in errores:
            print(f"        - {e}")
    print(f"\n{len(casos) - fallos}/{len(casos)} casos OK")
    return 1 if fallos else 0


if __name__ == "__main__":
    raise SystemExit(run())
