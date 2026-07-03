import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../lib/api.js'
import Icon from '../superadmin/Icons.jsx'
import EEInformeIntegral from './EEInformeIntegral.jsx'

export default function EELegajo() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [ev, setEv] = useState(null)
  const [perfiles, setPerfiles] = useState([])
  const [tests, setTests] = useState([])
  const [asig, setAsig] = useState(null)
  const [resultados, setResultados] = useState([])
  const [error, setError] = useState(null)
  const [modal, setModal] = useState(false)
  const [busy, setBusy] = useState(null)
  const [cred, setCred] = useState(null) // null | 'enviando' | 'ok' | 'sin-smtp' | 'error'

  async function cargar() {
    setError(null)
    try {
      const [e, p, t, a, r] = await Promise.all([
        api(`/evaluados/${id}`), api('/perfiles'), api('/empresa/tests'),
        api(`/evaluados/${id}/asignaciones`), api(`/evaluados/${id}/resultados`),
      ])
      setEv(e); setPerfiles(p); setTests(t); setAsig(a); setResultados(r)
    } catch (ex) { setError(ex.message) }
  }
  useEffect(() => { cargar() }, [id])

  const nombreTest = (slug) => tests.find((t) => t.slug === slug)?.nombre || slug
  const metaTest = (slug) => { const t = tests.find((x) => x.slug === slug); return t ? [cap(t.categoria), t.n_items ? `${t.n_items} ítems` : null].filter(Boolean).join(' · ') : '' }
  const resultadoDe = (slug) => resultados.find((r) => r.test_slug === slug)
  const perfilNombre = ev?.perfil_id ? (perfiles.find((p) => p.id === ev.perfil_id)?.nombre) : null

  async function quitar(asignacionId) {
    setBusy(asignacionId)
    try { await api(`/asignaciones/${asignacionId}`, { method: 'DELETE' }); await cargar() }
    catch (ex) { setError(ex.message) } finally { setBusy(null) }
  }

  async function reenviarCredenciales() {
    if (!window.confirm('Se generará una NUEVA contraseña temporal y se enviará por correo al evaluado (la anterior deja de servir). ¿Continuar?')) return
    setCred('enviando')
    try {
      const r = await api(`/evaluados/${id}/reenviar-credenciales`, { method: 'POST' })
      setCred(r.email_enviado ? 'ok' : 'sin-smtp')
    } catch (ex) { setError(ex.message); setCred('error') }
  }

  if (error && !ev) return <div className="sa-err">{error}</div>
  if (!ev || !asig) return <div className="sa-card sa-panel">Cargando…</div>

  return (
    <>
      <button className="sa-backlink" onClick={() => navigate('/empresa/evaluados')}><Icon name="chevL" /> Volver a Evaluados</button>
      {error && <div className="sa-err">{error}</div>}

      <div className="sa-card ee-head">
        <div className="av2">{sigla(`${ev.nombre} ${ev.apellido}`)}</div>
        <div>
          <h2>{ev.nombre} {ev.apellido}</h2>
          <div className="meta"><span>{perfilNombre || 'Sin perfil'}</span> · <span>{ev.email}</span>{!ev.activo && <span className="ee-badge sin">inactivo</span>}</div>
        </div>
        <div className="right">
          <button className="sa-btn ghost" disabled={cred === 'enviando'} onClick={reenviarCredenciales}><Icon name="mail" /> {cred === 'enviando' ? 'Enviando…' : 'Reenviar credenciales'}</button>
          <button className="sa-btn prim" onClick={() => setModal(true)}><Icon name="plus" /> Asignar batería</button>
        </div>
      </div>
      {cred === 'ok' && <div className="ee-note" style={{ marginBottom: 14 }}><Icon name="check" /> Se envió una nueva contraseña al correo del evaluado.</div>}
      {cred === 'sin-smtp' && <div className="sa-err">Se generó una nueva contraseña, pero el correo no está configurado (SMTP). Configuralo para el envío automático.</div>}

      <div className="ee-sectitle">Pruebas asignadas</div>
      <div className="sa-card" style={{ padding: '6px 0' }}>
        {asig.length === 0 ? (
          <div className="sa-empty" style={{ padding: 20 }}>Sin pruebas asignadas. Usá “Asignar batería”.</div>
        ) : asig.map((a) => {
          const res = resultadoDe(a.test_slug)
          const comp = a.estado === 'completado'
          return (
            <div className="sa-listrow" key={a.id}>
              <div className="li"><Icon name="doc" /></div>
              <div className="nm"><b>{nombreTest(a.test_slug)}</b><br /><small>{metaTest(a.test_slug)}</small></div>
              <div className="act">
                <span className={'ee-badge ' + (comp ? 'comp' : 'sin')}>{comp ? 'Completado' : 'Pendiente'}</span>
                {comp && res && <button className="ee-lnk" onClick={() => navigate(`/empresa/informe/${res.id}`)}><Icon name="eye" /> Ver informe</button>}
                {!comp && <button className="sa-trash" disabled={busy === a.id} onClick={() => quitar(a.id)} title="Quitar asignación"><Icon name="trash" /></button>}
              </div>
            </div>
          )
        })}
      </div>

      <EEInformeIntegral
        evaluadoId={id}
        evaluadoNombre={`${ev.nombre} ${ev.apellido}`}
        resultados={resultados.map((r) => ({ id: r.id, test_slug: r.test_slug, nombre: nombreTest(r.test_slug) }))}
      />

      {modal && (
        <ModalAsignar
          nombre={`${ev.nombre} ${ev.apellido}`}
          tests={tests}
          yaAsignados={new Set(asig.map((a) => a.test_slug))}
          onClose={() => setModal(false)}
          onAsignar={async (slugs) => {
            for (const slug of slugs) {
              await api(`/evaluados/${id}/asignaciones`, { method: 'POST', json: { test_slug: slug } })
            }
            setModal(false); await cargar()
          }}
        />
      )}
    </>
  )
}

function ModalAsignar({ nombre, tests, yaAsignados, onClose, onAsignar }) {
  const [sel, setSel] = useState(() => new Set())
  const [err, setErr] = useState(null)
  const [busy, setBusy] = useState(false)
  const disponibles = tests.filter((t) => !yaAsignados.has(t.slug))

  function toggle(slug) {
    setSel((s) => { const n = new Set(s); n.has(slug) ? n.delete(slug) : n.add(slug); return n })
  }
  async function guardar(e) {
    e.preventDefault()
    if (sel.size === 0) return
    setErr(null); setBusy(true)
    try { await onAsignar([...sel]) } catch (ex) { setErr(ex.message); setBusy(false) }
  }

  return (
    <div className="sa-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <form className="sa-modal" onSubmit={guardar}>
        <button type="button" className="x" onClick={onClose}><Icon name="x" /></button>
        <h2>Asignar batería</h2>
        <p className="ms">Elegí las pruebas para <b>{nombre}</b>. Solo aparecen las habilitadas para tu empresa.</p>
        {err && <div className="sa-err">{err}</div>}
        {tests.length === 0 ? (
          <div className="ee-note"><Icon name="doc" /> Tu empresa no tiene tests habilitados todavía. Pedile a ONE que habilite pruebas.</div>
        ) : disponibles.length === 0 ? (
          <div className="ee-note"><Icon name="check" /> Ya tiene asignadas todas las pruebas habilitadas.</div>
        ) : (
          <div className="ee-picklist">
            {disponibles.map((t) => (
              <label key={t.slug}>
                <input type="checkbox" checked={sel.has(t.slug)} onChange={() => toggle(t.slug)} />
                {t.nombre} <small>{cap(t.categoria) || ''}</small>
              </label>
            ))}
          </div>
        )}
        <div className="sa-modalfoot">
          <button type="button" className="sa-btn ghost" onClick={onClose}>Cancelar</button>
          <button className="sa-btn dark" disabled={busy || sel.size === 0}>{busy ? 'Asignando…' : `Asignar${sel.size ? ` (${sel.size})` : ''}`}</button>
        </div>
      </form>
    </div>
  )
}

function sigla(n) { return (n || '?').split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase() }
function cap(s) { return s ? s[0].toUpperCase() + s.slice(1) : s }
