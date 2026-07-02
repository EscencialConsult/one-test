import { useEffect, useState } from 'react'
import { api } from '../lib/api.js'
import Icon from './Icons.jsx'
import FormularioBuilder, { TIPOS, ESCALAS } from '../evaluaciones/FormularioBuilder.jsx'

const tipoLabel = (v) => TIPOS.find((t) => t.v === v)?.label || v
const escLabel = (v) => (ESCALAS.find((s) => s.v === v)?.label || v).split(' (')[0]

export default function SAPlantillas() {
  const [lista, setLista] = useState(null)
  const [error, setError] = useState(null)
  const [edit, setEdit] = useState(null) // null | { }(nueva) | formCompleto
  const [saving, setSaving] = useState(false)

  async function cargar() {
    setError(null)
    try { setLista(await api('/admin/eval-formularios')) } catch (e) { setError(e.message) }
  }
  useEffect(() => { cargar() }, [])

  async function abrir(id) {
    setError(null)
    try { setEdit(await api(`/admin/eval-formularios/${id}`)) } catch (e) { setError(e.message) }
  }

  async function guardar(payload) {
    setSaving(true); setError(null)
    try {
      if (edit?.id) await api(`/admin/eval-formularios/${edit.id}`, { method: 'PUT', json: payload })
      else await api('/admin/eval-formularios', { method: 'POST', json: payload })
      setEdit(null); await cargar()
    } catch (e) { setError(e.message) } finally { setSaving(false) }
  }

  async function eliminar(id) {
    if (!window.confirm('¿Eliminar esta plantilla? Las campañas ya creadas no se ven afectadas (guardan su propia copia).')) return
    try { await api(`/admin/eval-formularios/${id}`, { method: 'DELETE' }); await cargar() } catch (e) { setError(e.message) }
  }

  if (edit !== null) {
    return <FormularioBuilder inicial={edit.id ? edit : null} titulo={edit.id ? 'Editar plantilla' : 'Nueva plantilla'} onGuardar={guardar} onCancelar={() => setEdit(null)} guardando={saving} />
  }

  return (
    <>
      <div className="sa-toolbar">
        <div className="l"><h3 style={{ fontSize: 15 }}>Plantillas de evaluación</h3><span style={{ fontSize: 12.5, color: 'var(--muted)' }}>Formularios base que todas las empresas pueden usar o clonar.</span></div>
        <button className="sa-btn prim" onClick={() => setEdit({})}><Icon name="plus" /> Nueva plantilla</button>
      </div>

      {error && <div className="sa-err">{error}</div>}

      {!lista ? (
        <div className="sa-card sa-panel">Cargando…</div>
      ) : lista.length === 0 ? (
        <div className="sa-card sa-panel sa-empty">Todavía no hay plantillas. Creá la primera con “Nueva plantilla”.</div>
      ) : (
        <div className="ev-cards">
          {lista.map((f) => (
            <div className="ev-card" key={f.id}>
              <h3>{f.nombre}</h3>
              <p>{f.descripcion || 'Sin descripción.'}</p>
              <div className="ev-tags">
                <span className="ev-tag tipo">{tipoLabel(f.tipo)}</span>
                <span className="ev-tag esc">{escLabel(f.escala)}</span>
                <span className="ev-tag cnt">{f.n_competencias} comp · {f.n_preguntas} preg</span>
              </div>
              <div className="ev-card-foot">
                <button className="sa-btn ghost" onClick={() => abrir(f.id)}><Icon name="edit" /> Editar</button>
                <button className="sa-trash" title="Eliminar" onClick={() => eliminar(f.id)}><Icon name="trash" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
