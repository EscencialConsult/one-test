# Análisis de migración — Eneagrama Profesional (54 ítems)

## Fuentes legacy
- `Test9/index.html` → front-end con la lógica INLINE en `<script type="module">`:
  - `questions[]` (54 ítems, cada uno con `type` 1-9), `calculateResults()` (scoring del front),
    `formatAnswersFromIndexedObject()` (formato de envío: objeto con claves base-0).
- `Test9/script.gs` → **AUTORIDAD** del scoring server-side y de los textos del informe:
  - `MAPEO_PREGUNTAS` (eneatipo → índices base-0), `calcularPuntajes()`, selección de arquetipo
    en `generarInformeHTML()`, `DB_TEXTOS` (9 eneatipos), `DB_COMBINACIONES` (18 arquetipos de ala).

## Consistencia front ↔ back: ✅ OK
- Los 54 ítems y su asignación a eneatipo coinciden exactamente entre `index.html` (`questions[i].type`)
  y `script.gs` (`MAPEO_PREGUNTAS`): tipo 1 = índices {0,9,18,27,36,45}, tipo 2 = {1,10,...}, etc.
  (patrón cíclico 1..9 a lo largo de 6 bloques de 9 ítems).
- **NO hay ítems inversos.** Todos suman directo (escala 1=Nunca ... 5=Siempre).
- El front envía las respuestas crudas como objeto base-0 `{"0":v,...,"53":v}` (con un prefijo
  opcional `tiempo: ... —` que el `.gs` separa antes de `JSON.parse`). El `.gs` recalcula el puntaje;
  esa recálculo server-side es la que se porta aquí.

## Determinación del tipo dominante y empates (revisado)
- `script.gs · calcularPuntajes`: arma `ranking` en orden de eneatipo (1→9) y aplica
  `ranking.sort((a,b) => b.puntaje - a.puntaje)`. `Array.prototype.sort` es **estable** → en empate
  se conserva el orden original ⇒ **gana el eneatipo de MENOR número**. `dominante`/`secundario`/`terciario`
  = posiciones 0/1/2 del ranking.
- `index.html · calculateResults`: bucle `for type in scores` (1→9) con comparación estricta `>`
  ⇒ el primer máximo (menor número) gana. **Coincide** con el `.gs`.
- Portado con `sort(key=lambda x: -x["puntaje"])` (sort estable de Python sobre la lista en orden 1..9),
  reproduciendo el desempate por menor número. Verificado en regresión (caso tipo 3 vs tipo 8).

## Lógica reconstruida (fiel al `.gs`)
1. Sumar por eneatipo los 6 ítems asignados (sin inversión) → puntaje crudo, rango 6-30.
2. Porcentaje = `Math.round((suma / 30) * 100)`. Denominador **fijo = 30** (6 ítems × 5), no varía
   con los ítems contestados. Faltantes → 0 (igual que `parseInt(...) || 0` del `.gs`).
3. Ranking descendente por puntaje, empate por menor número de eneatipo.
4. Arquetipo (combinación dominante + ala): `key = "${dom}-${sec}"`; si no existe en
   `DB_COMBINACIONES`, probar `"${sec}-${dom}"`; si ninguna existe, arquetipo genérico
   **"LA FUSIÓN"** con `cualidad = "Equilibrio entre {nombre_dom} y {nombre_sec}"` y
   `fortalezas = fortalezas del eneatipo secundario`.
5. Textos por eneatipo (general, motivación, miedo, rasgos, fortalezas, áreas) = `DB_TEXTOS`, verbatim.
6. Redondeo half-up idéntico a `Math.round` (`math.floor(x + 0.5)`; ver `_round_half_up`).

## Mapa de datos vs código
- DATOS: `preguntas.json` (54 ítems), `baremos.json` (mapeo eneatipo→índices, denominador, reglas de
  ranking/arquetipo), `interpretaciones.json` (`DB_TEXTOS` + `DB_COMBINACIONES` + genérico),
  `informe.json`, `regresion.json`.
- CÓDIGO: `scoring.py` (motor determinista) + `test_scoring.py` (runner).

## Estado
- ✅ Completo: preguntas (54), scoring, baremos/esquema, interpretaciones, informe, regresión (6/6).
- 9 eneatipos; 18 arquetipos de ala definidos + 1 genérico de fallback.

## BLOQUEOS / faltantes / decisiones
- **(Resuelto, no bloqueante) "Baremos":** el Eneagrama NO tiene baremos poblacionales ni percentiles.
  El esquema de puntaje (crudo + porcentaje + ranking + arquetipo) se documentó en `baremos.json`.
  Se conservó el nombre `baremos.json` (esquema de puntaje por eneatipo) tal como permite el enunciado.
- **(Sin salidas históricas)** El `.gs` no almacenaba salidas accesibles; los esperados de
  `regresion.json` se derivaron del propio algoritmo portado. Pendiente fino: validar contra
  informes reales emitidos si llegaran a estar disponibles.
- **(Cobertura de arquetipos)** `DB_COMBINACIONES` solo define 18 de los 72 pares posibles dom-sec
  (más sus inversos). El resto cae intencionalmente en el genérico "LA FUSIÓN" — comportamiento
  idéntico al legacy, no es un faltante a completar.
- **(No portado a propósito)** Lógica de e-mail/planilla/triggers del `.gs` (`MailApp`,
  `SpreadsheetApp`, `analizarTiempo`, plantilla HTML) es infraestructura de entrega, no scoring.
  `analizarTiempo` (categoría rápido/óptimo/extendido por umbrales 12 y 15 min) queda fuera del motor
  determinista de puntaje; si se requiere, se puede portar como utilidad aparte (el tiempo es
  informativo y no afecta el eneatipo).
- **(Inconsistencia menor de etiquetas, documentada)** Los nombres de eneatipo difieren entre fuentes:
  tipo 8 = "EL DESAFIANTE" (`DB_TEXTOS`/front `typeNames`) pero "8. LÍDER" en las labels del radar del
  `.gs`; tipo 9 = "EL PACIFICADOR" en textos pero "9. CONCILIADOR" en el radar. Se conservaron ambos:
  nombres canónicos de `DB_TEXTOS` en `interpretaciones.json`/`scoring.py`, y las labels exactas del
  radar en `informe.json`. No afecta el cálculo.
