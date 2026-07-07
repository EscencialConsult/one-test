import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../lib/api.js'
import { confirmar } from '../lib/confirm.jsx'
import Icon from './Icons.jsx'
import MarcaFields from './MarcaFields.jsx'
import Loader from '../components/Loader.jsx'

export default function SAEmpresaDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [empresa, setEmpresa] = useState(null)
  const [tests, setTests] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(null)
  const [addOpen, setAddOpen] = useState(false)
  const [q, setQ] = useState('')
  const [edit, setEdit] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const [aviso, setAviso] = useState(null)
  const addRef = useRef(null)

  async function cargar() {
    setError(null)
    try {
      const [e, t] = await Promise.all([api(`/empresas/${id}`), api(`/empresas/${id}/tests`)])
      setEmpresa(e); setTests(t)
    } catch (ex) { setError(ex.message) }
  }
  useEffect(() => { cargar() }, [id])

  useEffect(() => {
    function onDoc(e) { if (addRef.current && !addRef.current.contains(e.target)) setAddOpen(false) }
    document.addEventListener('click', onDoc)
    return () => document.removeEventListener('click', onDoc)
  }, [])

  async function setTest(slug, habilitado) {
    setBusy(slug)
    try {
      await api(`/empresas/${id}/tests/${slug}`, { method: 'PUT', json: { habilitado } })
      setTests((ts) => ts.map((t) => (t.slug === slug ? { ...t, en_alcance: true, habilitado } : t)))
    } catch (ex) { setError(ex.message) } finally { setBusy(null) }
  }

  async function quitar(slug) {
    setBusy(slug)
    try {
      await api(`/empresas/${id}/tests/${slug}`, { method: 'DELETE' })
      setTests((ts) => ts.map((t) => (t.slug === slug ? { ...t, en_alcance: false, habilitado: false } : t)))
    } catch (ex) { setError(ex.message) } finally { setBusy(null) }
  }

  async function reenviarCreds() {
    if (!(await confirmar('Se generará una NUEVA contraseña y se enviará al correo del administrador de la empresa. El usuario y el link de acceso NO cambian. ¿Continuar?'))) return
    setBusy('reenv'); setAviso(null); setError(null)
    try {
      const r = await api(`/empresas/${id}/reenviar-credenciales`, { method: 'POST' })
      setAviso(r.email_habilitado ? `Nueva contraseña enviada a ${r.email}.` : 'Se generó la nueva contraseña, pero el correo no está configurado (SMTP).')
    } catch (ex) { setError(ex.message) } finally { setBusy(null) }
  }

  async function toggleEstado() {
    const nuevo = empresa.estado === 'activo' ? 'suspendido' : 'activo'
    setBusy('estado')
    try {
      const e = await api(`/empresas/${id}`, { method: 'PATCH', json: { estado: nuevo } })
      setEmpresa(e)
    } catch (ex) { setError(ex.message) } finally { setBusy(null) }
  }

  if (error && !empresa) return <div className="sa-err">{error}</div>
  if (!empresa || !tests) return <div className="sa-card sa-panel"><Loader /></div>

  const enAlcance = tests.filter((t) => t.en_alcance)
  const fuera = tests.filter((t) => !t.en_alcance && t.nombre.toLowerCase().includes(q.toLowerCase()))
  const activos = enAlcance.filter((t) => t.habilitado).length

  const accesoAdmin = `${window.location.origin}/acceso/${empresa.subdominio}`
  const accesoEval = `${accesoAdmin}/evaluado`
  async function copiar(url, cual) {
    try { await navigator.clipboard.writeText(url); setCopiado(cual); setTimeout(() => setCopiado(false), 2000) } catch { /* noop */ }
  }

  return (
    <>
      <button className="sa-backlink" onClick={() => navigate('/admin/empresas')}><Icon name="chevL" /> Volver a Empresas</button>
      {error && <div className="sa-err">{error}</div>}
      {aviso && <div className="ee-note" style={{ marginBottom: 12 }}><Icon name="check" /> {aviso}</div>}

      <div className="sa-card sa-emp-head">
        <div className="lg2">{sigla(empresa.razon_social)}</div>
        <div style={{ minWidth: 0 }}>
          <h2>{empresa.razon_social}</h2>
          <div className="meta"><span className="sa-subd">{empresa.subdominio}</span> · <span>{empresa.email_admin}</span></div>
          <div className="meta" style={{ marginTop: 8 }}>
            <b style={{ color: 'var(--tinta)', fontSize: 12.5 }}>Acceso administrador:</b>
            <span className="sa-subd" style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block', verticalAlign: 'middle' }} title={accesoAdmin}>{accesoAdmin}</span>
            <button className="sa-btn ghost" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => copiar(accesoAdmin, 'admin')}><Icon name="doc" /> {copiado === 'admin' ? '¡Copiado!' : 'Copiar'}</button>
            <button className="sa-btn ghost" style={{ padding: '5px 10px', fontSize: 12 }} disabled={busy === 'reenv'} onClick={reenviarCreds} title="Envía una nueva contraseña al admin (no cambia usuario ni link)"><Icon name="mail" /> {busy === 'reenv' ? 'Enviando…' : 'Reenviar credenciales'}</button>
          </div>
          <div className="meta" style={{ marginTop: 6 }}>
            <b style={{ color: 'var(--tinta)', fontSize: 12.5 }}>Acceso evaluado:</b>
            <span className="sa-subd" style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block', verticalAlign: 'middle' }} title={accesoEval}>{accesoEval}</span>
            <button className="sa-btn ghost" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => copiar(accesoEval, 'eval')}><Icon name="doc" /> {copiado === 'eval' ? '¡Copiado!' : 'Copiar'}</button>
          </div>
        </div>
        <div className="right">
          <div className="estado">
            {empresa.estado === 'activo' ? 'Empresa activa' : 'Empresa suspendida'}
            <button className={'sa-sw' + (empresa.estado === 'activo' ? ' on' : '')} disabled={busy === 'estado'} onClick={toggleEstado} aria-label="Cambiar estado" />
          </div>
          <button className="sa-btn ghost" onClick={() => setEdit(true)}><Icon name="edit" /> Editar</button>
        </div>
      </div>

      <div className="sa-toolbar">
        <div className="l">
          <h3 style={{ fontSize: 15 }}>Tests de la empresa</h3>
          <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>{activos} activos · {enAlcance.length} en alcance · {tests.length} en catálogo</span>
        </div>
        <div className="sa-addwrap" ref={addRef}>
          <button className="sa-btn prim" onClick={() => setAddOpen((o) => !o)}><Icon name="plus" /> Añadir test</button>
          {addOpen && (
            <div className="sa-addpanel">
              <div className="sa-search" style={{ width: '100%', marginBottom: 6 }}><Icon name="search" /><input placeholder="Buscar en el catálogo…" value={q} onChange={(e) => setQ(e.target.value)} autoFocus /></div>
              {fuera.length === 0 ? (
                <div className="sa-empty" style={{ padding: '8px 12px' }}>No hay más tests para añadir.</div>
              ) : fuera.map((t) => (
                <div key={t.slug} className="ai" onClick={() => setTest(t.slug, true)}>
                  <Icon name="doc" style={{ width: 18, color: 'var(--muted)' }} /> {t.nombre} <span className="pl">+</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="sa-card" style={{ padding: '6px 0' }}>
        {enAlcance.length === 0 ? (
          <div className="sa-empty" style={{ padding: 20 }}>Esta empresa todavía no tiene tests. Añadí el primero con “Añadir test”.</div>
        ) : enAlcance.map((t) => (
          <div className={'sa-listrow' + (t.habilitado ? '' : ' off')} key={t.slug}>
            <div className="li"><Icon name="doc" /></div>
            <div className="nm"><b>{t.nombre}</b><br /><small>{[cap(t.categoria), t.n_items ? `${t.n_items} ítems` : null, t.tomable ? 'tomable' : 'solo informe'].filter(Boolean).join(' · ')}</small></div>
            <div className="act">
              <span className={'st ' + (t.habilitado ? 'hab' : 'des')}>{t.habilitado ? 'Habilitado' : 'Deshabilitado'}</span>
              <button className={'sa-sw' + (t.habilitado ? ' on' : '')} disabled={busy === t.slug} onClick={() => setTest(t.slug, !t.habilitado)} aria-label="Habilitar/Deshabilitar" />
              <button className="sa-trash" disabled={busy === t.slug} onClick={() => quitar(t.slug)} title="Quitar del alcance"><Icon name="trash" /></button>
            </div>
          </div>
        ))}
      </div>
      <p className="sa-note">La empresa solo verá los tests <b>habilitados</b>. Podés deshabilitar temporalmente (switch) o quitar un test de su alcance (papelera).</p>

      {edit && <ModalEditar empresa={empresa} onClose={() => setEdit(false)} onGuardada={(e) => { setEmpresa(e); setEdit(false) }} />}
    </>
  )
}

function ModalEditar({ empresa, onClose, onGuardada }) {
  const [form, setForm] = useState({
    razon_social: empresa.razon_social, email_admin: empresa.email_admin,
    color_acento: empresa.color_acento, color_secundario: empresa.color_secundario || '#6be1e3',
    logo_url: empresa.logo_url || '',
  })
  const [err, setErr] = useState(null)
  const [busy, setBusy] = useState(false)
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  async function guardar(e) {
    e.preventDefault(); setErr(null); setBusy(true)
    try { onGuardada(await api(`/empresas/${empresa.id}`, { method: 'PATCH', json: form })) }
    catch (ex) { setErr(ex.message) } finally { setBusy(false) }
  }

  return (
    <div className="sa-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <form className="sa-modal" onSubmit={guardar}>
        <button type="button" className="x" onClick={onClose}><Icon name="x" /></button>
        <h2>Editar empresa</h2>
        <p className="ms">El subdominio no se puede cambiar.</p>
        {err && <div className="sa-err">{err}</div>}
        <div className="sa-field"><label>Razón social</label><input value={form.razon_social} onChange={(e) => set('razon_social', e.target.value)} required /></div>
        <div className="sa-field"><label>Correo del administrador</label><input type="email" value={form.email_admin} onChange={(e) => set('email_admin', e.target.value)} required /></div>
        <MarcaFields form={form} set={set} />
        <div className="sa-modalfoot">
          <button type="button" className="sa-btn ghost" onClick={onClose}>Cancelar</button>
          <button className="sa-btn dark" disabled={busy}>{busy ? 'Guardando…' : 'Guardar cambios'}</button>
        </div>
      </form>
    </div>
  )
}

function sigla(nombre) { return (nombre || '?').split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase() }
function cap(s) { return s ? s[0].toUpperCase() + s.slice(1) : s }
