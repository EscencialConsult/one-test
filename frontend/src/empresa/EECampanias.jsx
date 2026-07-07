import { lazy, Suspense, useEffect, useState } from 'react'
import { api } from '../lib/api.js'
import { confirmar } from '../lib/confirm.jsx'
import Icon from '../superadmin/Icons.jsx'
import { TIPOS, ESCALAS } from '../evaluaciones/FormularioBuilder.jsx'

// El informe usa Recharts (pesado): se carga bajo demanda al abrirlo.
const InformeCampania = lazy(() => import('../evaluaciones/InformeCampania.jsx'))

const tipoLabel = (v) => TIPOS.find((t) => t.v === v)?.label || v
const escLabel = (v) => (ESCALAS.find((s) => s.v === v)?.label || v).split(' (')[0]
const REL_360 = [
  { v: 'auto', l: 'Autoevaluación' }, { v: 'supervisor', l: 'Supervisor' },
  { v: 'par', l: 'Par' }, { v: 'reporte', l: 'Reporte directo' },
]
const relLabel = (v) => REL_360.find((r) => r.v === v)?.l || (v === 'observador' ? 'Observador' : v)
const ESTADO_CAMP = { borrador: ['Borrador', 'sinasig'], abierta: ['Abierta', 'curso'], cerrada: ['Cerrada', 'comp'] }
const sujetoLabel = (tipo) => (tipo === 'personas_360' ? 'Persona a evaluar' : tipo === 'areas' ? 'Área / Departamento' : 'Proceso a evaluar')

export default function EECampanias() {
  const [vista, setVista] = useState('lista') // 'lista' | 'nueva' | {id}
  const [lista, setLista] = useState(null)
  const [error, setError] = useState(null)

  async function cargar() {
    setError(null)
    try { setLista(await api('/empresa/eval-campanias')) } catch (e) { setError(e.message) }
  }
  useEffect(() => { if (vista === 'lista') cargar() }, [vista])

  if (vista === 'nueva') return <CampaniaNueva onCancel={() => setVista('lista')} onCreada={(c) => setVista({ id: c.id })} />
  if (typeof vista === 'object' && vista?.informe) return (
    <Suspense fallback={<div className="sa-card sa-panel">Cargando informe…</div>}>
      <InformeCampania id={vista.informe} onBack={() => setVista({ id: vista.informe })} />
    </Suspense>
  )
  if (typeof vista === 'object' && vista?.id) return <CampaniaDetalle id={vista.id} onBack={() => setVista('lista')} onVerInforme={(cid) => setVista({ informe: cid })} />

  return (
    <>
      <div className="sa-toolbar">
        <div className="l"><span style={{ fontSize: 12.5, color: 'var(--muted)' }}>Aplicá un formulario a un sujeto y mapeá quiénes lo evalúan.</span></div>
        <button className="sa-btn prim" onClick={() => setVista('nueva')}><Icon name="plus" /> Nueva campaña</button>
      </div>
      {error && <div className="sa-err">{error}</div>}
      {!lista ? (
        <div className="sa-card sa-panel">Cargando…</div>
      ) : lista.length === 0 ? (
        <div className="sa-card sa-panel sa-empty">Todavía no hay campañas. Creá la primera con “Nueva campaña”.</div>
      ) : (
        <div className="sa-card sa-panel">
          <table className="sa-table">
            <thead><tr><th>Campaña</th><th>Sujeto</th><th>Tipo</th><th>Avance</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              {lista.map((c) => {
                const [txt, cls] = ESTADO_CAMP[c.estado] || [c.estado, 'sinasig']
                return (
                  <tr key={c.id} className="click" onClick={() => setVista({ id: c.id })}>
                    <td><b>{c.nombre}</b></td>
                    <td>{c.sujeto_nombre}</td>
                    <td>{tipoLabel(c.tipo)}</td>
                    <td>{c.n_completados}/{c.n_evaluadores}</td>
                    <td><span className={'ee-badge ' + cls}>{txt}</span></td>
                    <td style={{ textAlign: 'right' }}><span className="sa-chev"><Icon name="chevR" style={{ width: 18 }} /></span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

function CampaniaNueva({ onCancel, onCreada }) {
  const [forms, setForms] = useState(null)
  const [formId, setFormId] = useState('')
  const [nombre, setNombre] = useState('')
  const [sujeto, setSujeto] = useState('')
  const [anon, setAnon] = useState(3)
  const [evs, setEvs] = useState([{ relacion: 'auto', nombre: '', email: '' }])
  const [areas, setAreas] = useState([])
  const [areaSel, setAreaSel] = useState('')
  const [evaluados, setEvaluados] = useState([])
  const [sujetoEvaluadoId, setSujetoEvaluadoId] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => { api('/empresa/eval-formularios').then(setForms).catch((e) => setError(e.message)) }, [])
  useEffect(() => { api('/empresa/areas').then(setAreas).catch(() => {}) }, [])
  useEffect(() => { api('/empresa/evaluados').then(setEvaluados).catch(() => {}) }, [])
  const form = (forms || []).find((f) => f.id === formId)
  const es360 = form?.tipo === 'personas_360'
  // Solo colaboradores participan de evaluaciones (los postulantes no).
  const colaboradores = evaluados.filter((e) => e.tipo === 'colaborador')
  const nombreCompleto = (e) => `${e.nombre} ${e.apellido || ''}`.trim()

  const setEv = (i, patch) => setEvs((s) => s.map((e, j) => (j === i ? { ...e, ...patch } : e)))
  const addEv = () => setEvs((s) => [...s, { relacion: es360 ? 'par' : 'observador', nombre: '', email: '' }])
  const delEv = (i) => setEvs((s) => s.filter((_, j) => j !== i))

  // Suma personas a la lista evitando duplicados por email; conserva evaluado_id (vínculo al usuario cargado).
  const mergeEvs = (nuevos) => setEvs((s) => {
    const emails = new Set(s.map((e) => (e.email || '').toLowerCase()).filter(Boolean))
    const add = nuevos.filter((n) => n.email && !emails.has(n.email.toLowerCase()))
    if (add.length === 0) { setError('Esas personas ya están en la lista (o no tienen email).'); return s }
    const base = s.filter((e) => e.nombre.trim() || e.email.trim())
    return [...base, ...add]
  })
  const rel0 = () => (es360 ? 'par' : 'observador')
  const agregarEvaluado = (ev) => { setError(null); mergeEvs([{ relacion: rel0(), nombre: nombreCompleto(ev), email: ev.email, evaluado_id: ev.id }]) }
  const agregarTodos = () => { setError(null); mergeEvs(colaboradores.map((ev) => ({ relacion: rel0(), nombre: nombreCompleto(ev), email: ev.email, evaluado_id: ev.id }))) }

  async function agregarArea() {
    if (!areaSel) return
    setError(null)
    try {
      const miembros = await api(`/empresa/areas/${areaSel}/miembros`)
      mergeEvs(miembros.map((m) => ({ relacion: rel0(), nombre: m.nombre, email: m.email, evaluado_id: m.id })))
    } catch (e) { setError(e.message) }
  }

  async function crear() {
    setError(null)
    if (!formId) { setError('Elegí un formulario.'); return }
    if (!nombre.trim()) { setError('Poné un nombre a la campaña.'); return }
    if (!sujeto.trim()) { setError(`Indicá el ${sujetoLabel(form.tipo).toLowerCase()}.`); return }
    const evaluadores = evs
      .filter((e) => e.nombre.trim() && e.email.trim())
      .map((e) => ({ relacion: es360 ? e.relacion : 'observador', nombre: e.nombre.trim(), email: e.email.trim(), evaluado_id: e.evaluado_id || null }))
    if (evaluadores.length === 0) { setError('Agregá al menos un evaluador con nombre y email.'); return }
    setBusy(true)
    try {
      const c = await api('/empresa/eval-campanias', {
        method: 'POST',
        json: { nombre: nombre.trim(), formulario_id: formId, sujeto_nombre: sujeto.trim(), sujeto_evaluado_id: sujetoEvaluadoId || null, anonimato_min: Number(anon) || 3, evaluadores },
      })
      onCreada(c)
    } catch (e) { setError(e.message); setBusy(false) }
  }

  return (
    <div style={{ maxWidth: 780 }}>
      <button className="sa-backlink" onClick={onCancel}><Icon name="chevL" /> Volver</button>
      <h2 style={{ fontSize: 20, marginBottom: 16 }}>Nueva campaña</h2>
      {error && <div className="sa-err">{error}</div>}

      <div className="sa-card sa-panel">
        <div className="sa-field"><label>Formulario</label>
          {!forms ? <div className="sa-empty" style={{ padding: 0 }}>Cargando…</div> : forms.length === 0 ? (
            <div className="ee-note"><Icon name="doc" /> No tenés formularios. Creá uno en la pestaña “Formularios”.</div>
          ) : (
            <select className="ev-input" value={formId} onChange={(e) => { setFormId(e.target.value); const f = forms.find((x) => x.id === e.target.value); setEvs([{ relacion: f?.tipo === 'personas_360' ? 'auto' : 'observador', nombre: '', email: '' }]) }}>
              <option value="">Elegí un formulario…</option>
              {forms.map((f) => <option key={f.id} value={f.id}>{f.nombre} — {tipoLabel(f.tipo)} · {escLabel(f.escala)}</option>)}
            </select>
          )}
        </div>
        {form && (
          <>
            <div className="sa-field"><label>Nombre de la campaña</label><input className="ev-input" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Liderazgo Q3 2026" /></div>
            <div className="sa-frow">
              <div className="sa-field"><label>{sujetoLabel(form.tipo)}</label>
                <input className="ev-input" value={sujeto} onChange={(e) => { setSujeto(e.target.value); setSujetoEvaluadoId('') }} placeholder={form.tipo === 'personas_360' ? 'Ej. Juan Pérez' : form.tipo === 'areas' ? 'Ej. Departamento de Enfermería' : 'Ej. Preparación de habitación'} />
                {es360 && colaboradores.length > 0 && (
                  <select className="ev-input" style={{ marginTop: 6 }} value={sujetoEvaluadoId} onChange={(e) => { const id = e.target.value; setSujetoEvaluadoId(id); const ev = colaboradores.find((x) => x.id === id); if (ev) setSujeto(nombreCompleto(ev)) }}>
                    <option value="">…o elegí un colaborador cargado</option>
                    {colaboradores.map((ev) => <option key={ev.id} value={ev.id}>{nombreCompleto(ev)}</option>)}
                  </select>
                )}
              </div>
              <div className="sa-field"><label>Anonimato: mínimo de respuestas por grupo</label><input className="ev-input" type="number" min="1" value={anon} onChange={(e) => setAnon(e.target.value)} /></div>
            </div>
          </>
        )}
      </div>

      {form && (
        <>
          <div className="ev-sec-t">Evaluadores {es360 ? '(por relación)' : '(observadores)'}</div>
          <div className="sa-card sa-panel">
            {(colaboradores.length > 0 || areas.length > 0) && (
              <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid var(--linea)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {colaboradores.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <select className="ev-input" style={{ flex: 1, minWidth: 200 }} value="" onChange={(e) => { const ev = colaboradores.find((x) => x.id === e.target.value); if (ev) agregarEvaluado(ev) }}>
                      <option value="">Agregar colaborador ya cargado…</option>
                      {colaboradores.map((ev) => <option key={ev.id} value={ev.id}>{nombreCompleto(ev)} — {ev.email}</option>)}
                    </select>
                    <button type="button" className="sa-btn ghost" onClick={agregarTodos}><Icon name="users" /> Agregar todos</button>
                  </div>
                )}
                {areas.length > 0 && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <select className="ev-input" style={{ flex: 1 }} value={areaSel} onChange={(e) => setAreaSel(e.target.value)}>
                      <option value="">Agregar todos los miembros de un área…</option>
                      {areas.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                    </select>
                    <button type="button" className="sa-btn ghost" disabled={!areaSel} onClick={agregarArea}><Icon name="users" /> Agregar área</button>
                  </div>
                )}
              </div>
            )}
            {evs.map((e, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                {es360 && (
                  <select className="ev-input" style={{ width: 160, flex: 'none' }} value={e.relacion} onChange={(ev) => setEv(i, { relacion: ev.target.value })}>
                    {REL_360.map((r) => <option key={r.v} value={r.v}>{r.l}</option>)}
                  </select>
                )}
                <input className="ev-input" placeholder="Nombre" value={e.nombre} onChange={(ev) => setEv(i, { nombre: ev.target.value, evaluado_id: undefined })} />
                <input className="ev-input" placeholder="Email" type="email" value={e.email} onChange={(ev) => setEv(i, { email: ev.target.value, evaluado_id: undefined })} />
                {e.evaluado_id && <span className="ev-tag tipo" title="Vinculado a un colaborador cargado" style={{ flex: 'none' }}>✓</span>}
                <button className="ev-xbtn" title="Quitar" onClick={() => delEv(i)}><Icon name="x" /></button>
              </div>
            ))}
            <button className="ev-addbtn" onClick={addEv}><Icon name="plus" /> Añadir manualmente (persona externa)</button>
            {es360 && <p className="ev-tipo-hint" style={{ marginTop: 10 }}>Tip: la <b>autoevaluación</b> es la propia persona evaluada. Los grupos con menos de {anon || 3} respuestas no se muestran por separado (anonimato).</p>}
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
            <button className="sa-btn ghost" onClick={onCancel}>Cancelar</button>
            <button className="sa-btn dark" disabled={busy} onClick={crear}>{busy ? 'Creando…' : 'Crear campaña (borrador)'}</button>
          </div>
        </>
      )}
    </div>
  )
}

function CampaniaDetalle({ id, onBack, onVerInforme }) {
  const [c, setC] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [add, setAdd] = useState(null) // {relacion,nombre,email,evaluado_id} | null
  const [msg, setMsg] = useState(null)
  const [fEval, setFEval] = useState('todos') // todos | resp | pend
  const [evaluados, setEvaluados] = useState([])
  const colaboradores = evaluados.filter((e) => e.tipo === 'colaborador')
  const nombreCompleto = (e) => `${e.nombre} ${e.apellido || ''}`.trim()

  async function cargar() {
    setError(null)
    try { setC(await api(`/empresa/eval-campanias/${id}`)) } catch (e) { setError(e.message) }
  }
  useEffect(() => { cargar() }, [id])
  useEffect(() => { api('/empresa/evaluados').then(setEvaluados).catch(() => {}) }, [])

  if (error && !c) return <><button className="sa-backlink" onClick={onBack}><Icon name="chevL" /> Volver</button><div className="sa-err">{error}</div></>
  if (!c) return <div className="sa-card sa-panel">Cargando…</div>

  const es360 = c.tipo === 'personas_360'
  const [estTxt, estCls] = ESTADO_CAMP[c.estado] || [c.estado, 'sinasig']
  const filtrados = c.evaluadores.filter((e) => (fEval === 'todos' ? true : fEval === 'resp' ? e.estado === 'completado' : e.estado !== 'completado'))

  async function lanzar() {
    if (!(await confirmar('Se enviarán las invitaciones por correo a los evaluadores. ¿Lanzar la campaña?'))) return
    setBusy(true); setMsg(null)
    try { const r = await api(`/empresa/eval-campanias/${id}/lanzar`, { method: 'POST' }); setMsg(r.email_habilitado ? `Campaña lanzada. Se enviaron ${r.enviados} invitación(es).` : 'Campaña lanzada, pero el correo no está configurado (SMTP). Compartí los links manualmente.'); await cargar() }
    catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  async function cerrar() {
    if (!(await confirmar('Cerrar la campaña impide nuevas respuestas y habilita el informe. ¿Continuar?'))) return
    setBusy(true)
    try { await api(`/empresa/eval-campanias/${id}/cerrar`, { method: 'POST' }); await cargar() } catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  async function reabrir() {
    if (!(await confirmar('Reabrir la campaña permite que los evaluadores pendientes (o nuevos que agregues) respondan. Quienes ya respondieron mantienen su respuesta y no la repiten. ¿Continuar?'))) return
    setBusy(true)
    try { await api(`/empresa/eval-campanias/${id}/reabrir`, { method: 'POST' }); await cargar() } catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  async function reenviar(eid) {
    setMsg(null)
    try { const r = await api(`/empresa/eval-evaluadores/${eid}/reenviar`, { method: 'POST' }); setMsg(r.email_habilitado ? 'Invitación reenviada.' : 'El correo no está configurado (SMTP).') } catch (e) { setError(e.message) }
  }
  async function quitar(eid) {
    if (!(await confirmar('¿Quitar este evaluador?'))) return
    try { await api(`/empresa/eval-evaluadores/${eid}`, { method: 'DELETE' }); await cargar() } catch (e) { setError(e.message) }
  }
  async function copiar(link) {
    try { await navigator.clipboard.writeText(link); setMsg('Link copiado al portapapeles.') } catch { setMsg(link) }
  }
  async function guardarAdd() {
    if (!add.nombre.trim() || !add.email.trim()) { setError('Completá nombre y email.'); return }
    try {
      await api(`/empresa/eval-campanias/${id}/evaluadores`, { method: 'POST', json: { relacion: es360 ? add.relacion : 'observador', nombre: add.nombre.trim(), email: add.email.trim(), evaluado_id: add.evaluado_id || null } })
      setAdd(null); await cargar()
    } catch (e) { setError(e.message) }
  }

  return (
    <>
      <button className="sa-backlink" onClick={onBack}><Icon name="chevL" /> Volver a Campañas</button>
      {error && <div className="sa-err">{error}</div>}
      {msg && <div className="ee-note" style={{ marginBottom: 14 }}><Icon name="check" /> {msg}</div>}

      <div className="sa-card sa-emp-head">
        <div>
          <h2>{c.nombre}</h2>
          <div className="meta"><span className="ev-tag tipo">{tipoLabel(c.tipo)}</span> · <b>{sujetoLabel(c.tipo)}:</b> {c.sujeto_nombre} · <span className={'ee-badge ' + estCls}>{estTxt}</span> · {c.n_completados}/{c.n_evaluadores} respondieron</div>
        </div>
        <div className="right">
          {c.estado === 'borrador' && <button className="sa-btn prim" disabled={busy} onClick={lanzar}><Icon name="send" /> Lanzar campaña</button>}
          {c.estado === 'abierta' && (
            <>
              {c.n_completados > 0 && <button className="sa-btn ghost" onClick={() => onVerInforme(id)}><Icon name="chart" /> Ver avance</button>}
              <button className="sa-btn dark" disabled={busy} onClick={cerrar}><Icon name="check" /> Cerrar campaña</button>
            </>
          )}
          {c.estado === 'cerrada' && (
            <>
              <button className="sa-btn ghost" disabled={busy} onClick={reabrir}><Icon name="send" /> Reabrir campaña</button>
              <button className="sa-btn prim" onClick={() => onVerInforme(id)}><Icon name="chart" /> Ver informe</button>
            </>
          )}
        </div>
      </div>

      {c.estado === 'borrador' && <div className="ee-note" style={{ marginBottom: 12 }}><Icon name="send" /> La campaña está en <b>borrador</b>: los links todavía no funcionan. Hacé <b>“Lanzar campaña”</b> para activarlos y enviar las invitaciones.</div>}

      <div className="sa-toolbar">
        <div className="l">
          <h3 style={{ fontSize: 15, marginRight: 4 }}>Evaluadores</h3>
          {[['todos', 'Todos'], ['resp', 'Respondieron'], ['pend', 'Pendientes']].map(([k, t]) => {
            const n = k === 'todos' ? c.evaluadores.length : c.evaluadores.filter((e) => (k === 'resp' ? e.estado === 'completado' : e.estado !== 'completado')).length
            return <div key={k} className={'sa-chipf' + (fEval === k ? ' on' : '')} onClick={() => setFEval(k)}>{t} ({n})</div>
          })}
        </div>
        {c.estado !== 'cerrada' && <button className="sa-btn ghost" onClick={() => setAdd({ relacion: es360 ? 'par' : 'observador', nombre: '', email: '' })}><Icon name="plus" /> Añadir evaluador</button>}
      </div>

      <div className="sa-card" style={{ padding: '6px 0' }}>
        {c.evaluadores.length === 0 ? (
          <div className="sa-empty" style={{ padding: 20 }}>Sin evaluadores.</div>
        ) : filtrados.length === 0 ? (
          <div className="sa-empty" style={{ padding: 20 }}>Nadie en este filtro.</div>
        ) : filtrados.map((e) => (
          <div className="sa-listrow" key={e.id}>
            <div className="li"><Icon name="users" /></div>
            <div className="nm"><b>{e.nombre}</b> <span className="ev-tag tipo" style={{ marginLeft: 6 }}>{relLabel(e.relacion)}</span><br /><small>{e.email}</small></div>
            <div className="act">
              <span className={'ee-badge ' + (e.estado === 'completado' ? 'comp' : 'curso')}>{e.estado === 'completado' ? 'Respondió' : 'Pendiente'}</span>
              <button className="ee-lnk" title="Copiar link" onClick={() => copiar(e.link)}><Icon name="doc" /> Link</button>
              {e.estado !== 'completado' && <button className="ee-lnk" title="Reenviar invitación" onClick={() => reenviar(e.id)}><Icon name="mail" /> Reenviar</button>}
              <button className="sa-trash" title="Quitar" onClick={() => quitar(e.id)}><Icon name="trash" /></button>
            </div>
          </div>
        ))}
      </div>

      {add && (
        <div className="sa-card sa-panel" style={{ marginTop: 12 }}>
          {colaboradores.length > 0 && (
            <select className="ev-input" style={{ marginBottom: 8 }} value=""
              onChange={(e) => { const ev = colaboradores.find((x) => x.id === e.target.value); if (ev) setAdd((a) => ({ ...a, nombre: nombreCompleto(ev), email: ev.email, evaluado_id: ev.id })) }}>
              <option value="">Elegí un colaborador ya cargado…</option>
              {colaboradores.map((ev) => <option key={ev.id} value={ev.id}>{nombreCompleto(ev)} — {ev.email}</option>)}
            </select>
          )}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {es360 && (
              <select className="ev-input" style={{ width: 160, flex: 'none' }} value={add.relacion} onChange={(e) => setAdd({ ...add, relacion: e.target.value })}>
                {REL_360.map((r) => <option key={r.v} value={r.v}>{r.l}</option>)}
              </select>
            )}
            <input className="ev-input" placeholder="Nombre" value={add.nombre} onChange={(e) => setAdd({ ...add, nombre: e.target.value, evaluado_id: undefined })} />
            <input className="ev-input" placeholder="Email" type="email" value={add.email} onChange={(e) => setAdd({ ...add, email: e.target.value, evaluado_id: undefined })} />
            <button className="sa-btn dark" onClick={guardarAdd}>Agregar</button>
            <button className="sa-btn ghost" onClick={() => setAdd(null)}>Cancelar</button>
          </div>
          <p className="ev-tipo-hint" style={{ marginTop: 8 }}>Elegí un colaborador cargado (autocompleta) o escribí a mano una persona externa. Si la campaña ya está abierta, se le envía la invitación al agregarlo.</p>
        </div>
      )}
    </>
  )
}
