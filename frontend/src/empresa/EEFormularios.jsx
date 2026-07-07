import { useEffect, useState } from 'react'
import { api } from '../lib/api.js'
import { confirmar } from '../lib/confirm.jsx'
import Icon from '../superadmin/Icons.jsx'
import FormularioBuilder, { TIPOS, ESCALAS } from '../evaluaciones/FormularioBuilder.jsx'

const tipoLabel = (v) => TIPOS.find((t) => t.v === v)?.label || v
const escLabel = (v) => (ESCALAS.find((s) => s.v === v)?.label || v).split(' (')[0]

export default function EEFormularios() {
  const [mios, setMios] = useState(null)
  const [error, setError] = useState(null)
  const [edit, setEdit] = useState(null)
  const [saving, setSaving] = useState(false)
  const [pickPlantilla, setPickPlantilla] = useState(false)

  async function cargar() {
    setError(null)
    try { setMios(await api('/empresa/eval-formularios')) } catch (e) { setError(e.message) }
  }
  useEffect(() => { cargar() }, [])

  async function abrir(id) {
    setError(null)
    try { setEdit(await api(`/empresa/eval-formularios/${id}`)) } catch (e) { setError(e.message) }
  }

  async function guardar(payload) {
    setSaving(true); setError(null)
    try {
      if (edit?.id) await api(`/empresa/eval-formularios/${edit.id}`, { method: 'PUT', json: payload })
      else await api('/empresa/eval-formularios', { method: 'POST', json: payload })
      setEdit(null); await cargar()
    } catch (e) { setError(e.message) } finally { setSaving(false) }
  }

  async function eliminar(id) {
    if (!(await confirmar('¿Eliminar este formulario?'))) return
    try { await api(`/empresa/eval-formularios/${id}`, { method: 'DELETE' }); await cargar() } catch (e) { setError(e.message) }
  }

  if (edit !== null) {
    const inicial = edit.id ? edit : (edit.competencias ? { ...edit, id: undefined } : null)
    const titulo = edit.id ? 'Editar formulario' : edit.competencias ? `Nuevo formulario (desde “${edit.nombre}”)` : 'Nuevo formulario'
    return <FormularioBuilder inicial={inicial} titulo={titulo} onGuardar={guardar} onCancelar={() => setEdit(null)} guardando={saving} />
  }

  return (
    <>
      <div className="sa-toolbar">
        <div className="l"><span style={{ fontSize: 12.5, color: 'var(--muted)' }}>Creá tus formularios o partí de una plantilla de ONE.</span></div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="sa-btn ghost" onClick={() => setPickPlantilla(true)}><Icon name="layers" /> Usar plantilla</button>
          <button className="sa-btn prim" onClick={() => setEdit({})}><Icon name="plus" /> Nuevo formulario</button>
        </div>
      </div>

      {error && <div className="sa-err">{error}</div>}

      {!mios ? (
        <div className="sa-card sa-panel">Cargando…</div>
      ) : mios.length === 0 ? (
        <div className="sa-card sa-panel sa-empty">Todavía no tenés formularios. Creá uno nuevo o partí de una plantilla de ONE.</div>
      ) : (
        <div className="ev-cards">
          {mios.map((f) => (
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

      {pickPlantilla && <ModalPlantillas onClose={() => setPickPlantilla(false)} onUsar={(pl) => { setPickPlantilla(false); setError(null); setEdit({ ...pl, id: undefined }) }} />}
    </>
  )
}

function ModalPlantillas({ onClose, onUsar }) {
  const [lista, setLista] = useState(null)
  const [error, setError] = useState(null)
  useEffect(() => { api('/empresa/eval-plantillas').then(setLista).catch((e) => setError(e.message)) }, [])

  return (
    <div className="sa-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="sa-modal" style={{ width: 560 }}>
        <button type="button" className="x" onClick={onClose}><Icon name="x" /></button>
        <h2>Plantillas de ONE</h2>
        <p className="ms">Elegí una plantilla para partir de ella. Se crea una copia editable en tu empresa.</p>
        {error && <div className="sa-err">{error}</div>}
        {!lista ? (
          <div className="sa-empty">Cargando…</div>
        ) : lista.length === 0 ? (
          <div className="sa-empty">Todavía no hay plantillas disponibles.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {lista.map((f) => (
              <div key={f.id} className="sa-listrow" style={{ border: '1px solid var(--linea)', borderRadius: 12, padding: 14 }}>
                <div className="nm"><b>{f.nombre}</b><br /><small>{tipoLabel(f.tipo)} · {escLabel(f.escala)} · {f.n_competencias} comp · {f.n_preguntas} preg</small></div>
                <div className="act"><button className="sa-btn dark" onClick={() => onUsar(f)}>Usar</button></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
