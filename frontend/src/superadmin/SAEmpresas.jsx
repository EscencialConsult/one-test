import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api.js'
import Icon from './Icons.jsx'
import MarcaFields from './MarcaFields.jsx'

const FORM_VACIO = {
  razon_social: '', subdominio: '', email_admin: '',
  color_acento: '#4d248f', color_secundario: '#6be1e3', logo_url: '',
  admin_password: '', admin_nombre: 'Administrador', admin_apellido: '',
}

export default function SAEmpresas() {
  const [empresas, setEmpresas] = useState(null)
  const [error, setError] = useState(null)
  const [filtro, setFiltro] = useState('todas')
  const [modal, setModal] = useState(false)
  const navigate = useNavigate()

  async function cargar() {
    setError(null)
    try { setEmpresas(await api('/empresas')) } catch (e) { setError(e.message) }
  }
  useEffect(() => { cargar() }, [])

  const lista = (empresas || []).filter((e) =>
    filtro === 'todas' ? true : filtro === 'activas' ? e.estado === 'activo' : e.estado !== 'activo'
  )

  return (
    <>
      <div className="sa-toolbar">
        <div className="l">
          {['todas', 'activas', 'suspendidas'].map((f) => (
            <div key={f} className={'sa-chipf' + (filtro === f ? ' on' : '')} onClick={() => setFiltro(f)}>
              {f[0].toUpperCase() + f.slice(1)}
            </div>
          ))}
        </div>
        <button className="sa-btn prim" onClick={() => setModal(true)}><Icon name="plus" /> Nueva empresa</button>
      </div>

      {error && <div className="sa-err">{error}</div>}

      <div className="sa-card sa-panel">
        {!empresas ? (
          <div className="sa-empty">Cargando…</div>
        ) : lista.length === 0 ? (
          <div className="sa-empty">No hay empresas para este filtro.</div>
        ) : (
          <table className="sa-table">
            <thead><tr><th>Empresa</th><th>Subdominio</th><th>Admin principal</th><th>Evaluados</th><th>Tests</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              {lista.map((e) => (
                <tr key={e.id} className="click" onClick={() => navigate(`/admin/empresas/${e.id}`)}>
                  <td><div className="sa-co"><div className="lg">{sigla(e.razon_social)}</div><b>{e.razon_social}</b></div></td>
                  <td><span className="sa-subd">{e.subdominio}</span></td>
                  <td>{e.email_admin}</td>
                  <td>{e.evaluados}</td>
                  <td>{e.tests_habilitados}</td>
                  <td><span className={'sa-badge ' + (e.estado === 'activo' ? 'ok' : 'sus')}>{e.estado === 'activo' ? 'Activo' : 'Suspendido'}</span></td>
                  <td style={{ textAlign: 'right' }}><span className="sa-chev"><Icon name="chevR" style={{ width: 18 }} /></span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && <ModalNuevaEmpresa onClose={() => setModal(false)} onCreada={() => { setModal(false); cargar() }} />}
    </>
  )
}

function ModalNuevaEmpresa({ onClose, onCreada }) {
  const [form, setForm] = useState({ ...FORM_VACIO })
  const [err, setErr] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  async function guardar(e) {
    e.preventDefault()
    setErr(null); setGuardando(true)
    try {
      await api('/empresas', { method: 'POST', json: { ...form, admin_password: form.admin_password || null } })
      onCreada()
    } catch (ex) { setErr(ex.message) } finally { setGuardando(false) }
  }

  return (
    <div className="sa-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <form className="sa-modal" onSubmit={guardar}>
        <button type="button" className="x" onClick={onClose}><Icon name="x" /></button>
        <h2>Nueva empresa</h2>
        <p className="ms">Se creará un espacio de datos aislado para el nuevo cliente.</p>
        {err && <div className="sa-err">{err}</div>}
        <div className="sa-field"><label>Razón social</label><input value={form.razon_social} onChange={(e) => set('razon_social', e.target.value)} placeholder="Ej. TechSur S.A." required /></div>
        <div className="sa-field"><label>Identificador de subdominio</label><input value={form.subdominio} onChange={(e) => set('subdominio', e.target.value)} placeholder="techsur" required /><small style={{ display: 'block', color: 'var(--muted)', fontSize: 11.5, marginTop: 6 }}>Su espacio: techsur.one.com (identificador, solo minúsculas y guiones).</small></div>
        <div className="sa-field"><label>Correo del administrador principal</label><input type="email" value={form.email_admin} onChange={(e) => set('email_admin', e.target.value)} placeholder="admin@empresa.com" required /></div>

        <MarcaFields form={form} set={set} />

        <div className="sa-frow">
          <div className="sa-field"><label>Nombre del admin</label><input value={form.admin_nombre} onChange={(e) => set('admin_nombre', e.target.value)} /></div>
          <div className="sa-field"><label>Apellido del admin</label><input value={form.admin_apellido} onChange={(e) => set('admin_apellido', e.target.value)} /></div>
        </div>
        <div className="sa-field"><label>Contraseña del admin (opcional)</label><input type="password" value={form.admin_password} onChange={(e) => set('admin_password', e.target.value)} placeholder="Si lo dejás vacío, se genera una automática" /><small style={{ display: 'block', color: 'var(--muted)', fontSize: 11.5, marginTop: 6 }}>Se le envía por correo el acceso (link + usuario + contraseña).</small></div>
        <div className="sa-modalfoot">
          <button type="button" className="sa-btn ghost" onClick={onClose}>Cancelar</button>
          <button className="sa-btn dark" disabled={guardando}>{guardando ? 'Creando…' : 'Crear empresa'}</button>
        </div>
      </form>
    </div>
  )
}

function sigla(nombre) {
  return (nombre || '?').split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase()
}
