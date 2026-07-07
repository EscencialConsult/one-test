import { useState } from 'react'
import Icon from '../superadmin/Icons.jsx'
import './eval.css'

export const TIPOS = [
  { v: 'personas_360', label: 'Evaluación 360° (personas)', hint: 'El sujeto es una persona; se la evalúa desde varias relaciones (auto, supervisor, pares, reportes).' },
  { v: 'areas', label: 'Áreas / Departamentos', hint: 'El sujeto es un área o departamento; lo evalúan los colaboradores.' },
  { v: 'procesos', label: 'Procesos internos', hint: 'El sujeto es un proceso o protocolo; se verifica su cumplimiento (ideal con escala Sí/No).' },
  { v: 'clientes', label: 'Clientes (satisfacción)', hint: 'Los evaluadores son clientes externos; evalúan el sujeto que definas (una persona, un servicio o la empresa). Ideal con la escala de Satisfacción.' },
]
export const ESCALAS = [
  { v: 'likert5', label: 'Likert 1-5 (Nunca → Siempre)' },
  { v: 'sino', label: 'Sí / No (Cumple / No cumple)' },
  { v: 'satisfaccion', label: 'Satisfacción 1-5 (Muy insatisfecho → Muy satisfecho)' },
]

let _uid = 0
const nid = () => `k${++_uid}`

function normalizar(inicial) {
  if (!inicial) return { nombre: '', descripcion: '', tipo: 'personas_360', escala: 'likert5', competencias: [nuevaComp()] }
  return {
    nombre: inicial.nombre || '',
    descripcion: inicial.descripcion || '',
    tipo: inicial.tipo || 'personas_360',
    escala: inicial.escala || 'likert5',
    competencias: (inicial.competencias || []).map((c) => ({
      key: nid(), nombre: c.nombre || '', descripcion: c.descripcion || '',
      preguntas: (c.preguntas || []).map((p) => ({ key: nid(), texto: p.texto || '' })),
    })),
  }
}
function nuevaComp() { return { key: nid(), nombre: '', descripcion: '', preguntas: [{ key: nid(), texto: '' }] } }

export default function FormularioBuilder({ inicial, titulo, onGuardar, onCancelar, guardando }) {
  const [f, setF] = useState(() => normalizar(inicial))
  const [err, setErr] = useState(null)
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }))

  const setComp = (key, patch) => setF((s) => ({ ...s, competencias: s.competencias.map((c) => (c.key === key ? { ...c, ...patch } : c)) }))
  const addComp = () => setF((s) => ({ ...s, competencias: [...s.competencias, nuevaComp()] }))
  const delComp = (key) => setF((s) => ({ ...s, competencias: s.competencias.filter((c) => c.key !== key) }))
  const addPreg = (ck) => setComp(ck, { preguntas: [...f.competencias.find((c) => c.key === ck).preguntas, { key: nid(), texto: '' }] })
  const setPreg = (ck, pk, texto) => setComp(ck, { preguntas: f.competencias.find((c) => c.key === ck).preguntas.map((p) => (p.key === pk ? { ...p, texto } : p)) })
  const delPreg = (ck, pk) => setComp(ck, { preguntas: f.competencias.find((c) => c.key === ck).preguntas.filter((p) => p.key !== pk) })

  async function guardar() {
    setErr(null)
    if (!f.nombre.trim()) { setErr('Poné un nombre al formulario.'); return }
    const comps = f.competencias
      .map((c) => ({ nombre: c.nombre.trim(), descripcion: c.descripcion.trim() || null, preguntas: c.preguntas.filter((p) => p.texto.trim()).map((p) => ({ texto: p.texto.trim() })) }))
      .filter((c) => c.nombre && c.preguntas.length > 0)
    if (comps.length === 0) { setErr('Agregá al menos una competencia con una pregunta.'); return }
    await onGuardar({ nombre: f.nombre.trim(), descripcion: f.descripcion.trim() || null, tipo: f.tipo, escala: f.escala, competencias: comps })
  }

  const tipoHint = TIPOS.find((t) => t.v === f.tipo)?.hint

  return (
    <div className="ev-builder">
      <button className="sa-backlink" onClick={onCancelar}><Icon name="chevL" /> Volver</button>
      <h2 style={{ fontSize: 20, marginBottom: 16 }}>{titulo}</h2>
      {err && <div className="sa-err">{err}</div>}

      <div className="sa-card sa-panel">
        <div className="sa-field"><label>Nombre</label><input className="ev-input" value={f.nombre} onChange={(e) => set('nombre', e.target.value)} placeholder="Ej. Evaluación de Liderazgo 360°" /></div>
        <div className="sa-field"><label>Descripción (opcional)</label><textarea className="ev-input" value={f.descripcion} onChange={(e) => set('descripcion', e.target.value)} placeholder="Para qué sirve este formulario…" /></div>
        <div className="sa-frow">
          <div className="sa-field"><label>Tipo</label>
            <select className="ev-input" value={f.tipo} onChange={(e) => set('tipo', e.target.value)}>
              {TIPOS.map((t) => <option key={t.v} value={t.v}>{t.label}</option>)}
            </select>
            {tipoHint && <div className="ev-tipo-hint">{tipoHint}</div>}
          </div>
          <div className="sa-field"><label>Escala de respuesta</label>
            <select className="ev-input" value={f.escala} onChange={(e) => set('escala', e.target.value)}>
              {ESCALAS.map((s) => <option key={s.v} value={s.v}>{s.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="ev-sec-t">Competencias y preguntas</div>
      {f.competencias.map((c, ci) => (
        <div className="ev-comp" key={c.key}>
          <div className="ev-comp-head">
            <div className="cnum">{ci + 1}</div>
            <div className="grow">
              <input className="ev-input" value={c.nombre} onChange={(e) => setComp(c.key, { nombre: e.target.value })} placeholder="Competencia (ej. Comunicación, Liderazgo)" />
            </div>
            <button className="ev-xbtn" title="Quitar competencia" onClick={() => delComp(c.key)}><Icon name="trash" /></button>
          </div>
          <div className="ev-pregs">
            {c.preguntas.map((p, pi) => (
              <div className="ev-preg" key={p.key}>
                <span className="pn">{pi + 1}</span>
                <input className="ev-input" value={p.texto} onChange={(e) => setPreg(c.key, p.key, e.target.value)} placeholder="Afirmación (ej. Escucha activamente a su equipo)" />
                <button className="ev-xbtn" title="Quitar pregunta" onClick={() => delPreg(c.key, p.key)}><Icon name="x" /></button>
              </div>
            ))}
            <button className="ev-addbtn" style={{ marginTop: 4, marginBottom: 8 }} onClick={() => addPreg(c.key)}><Icon name="plus" /> Añadir pregunta</button>
          </div>
        </div>
      ))}
      <button className="ev-addbtn" onClick={addComp}><Icon name="plus" /> Añadir competencia</button>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 22 }}>
        <button className="sa-btn ghost" onClick={onCancelar}>Cancelar</button>
        <button className="sa-btn dark" disabled={guardando} onClick={guardar}>{guardando ? 'Guardando…' : 'Guardar formulario'}</button>
      </div>
    </div>
  )
}
