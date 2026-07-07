import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { api } from '../lib/api.js'
import Icon from '../superadmin/Icons.jsx'
import Loader from '../components/Loader.jsx'

export default function EEConfig() {
  const { empresa } = useOutletContext()
  return (
    <div style={{ maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="sa-card sa-panel">
        <h3 style={{ fontSize: 15, marginBottom: 3 }}>Datos de la empresa</h3>
        <p className="d" style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 16 }}>Tu razón social y datos de contacto. Para cambiarlos, escribinos a soporte.</p>
        <div className="sa-field"><label>Razón social</label><input value={empresa?.razon_social || ''} disabled /></div>
        <div className="sa-field" style={{ marginBottom: 0 }}><label>Email de contacto</label><input value={empresa?.email_admin || ''} disabled /></div>
      </div>

      <CambiarPassword />

      <Etiquetas
        endpoint="/perfiles"
        titulo="Perfiles / Puestos"
        desc="Etiquetas para clasificar a tus miembros por puesto (ej. Vendedor, Supervisor). Al crear un evaluado elegís uno."
        placeholder="Nuevo perfil (ej. Vendedor, Supervisor…)"
        btn="Añadir perfil"
      />

      <Etiquetas
        endpoint="/empresa/areas"
        titulo="Áreas / Departamentos"
        desc="Las áreas de tu organización (ej. Enfermería, Ventas, Administración). Sirven para agrupar miembros y enviar campañas a un área completa."
        placeholder="Nueva área (ej. Enfermería, Ventas…)"
        btn="Añadir área"
      />
    </div>
  )
}

function CambiarPassword() {
  const [actual, setActual] = useState('')
  const [nueva, setNueva] = useState('')
  const [repetir, setRepetir] = useState('')
  const [error, setError] = useState(null)
  const [ok, setOk] = useState(false)
  const [busy, setBusy] = useState(false)

  async function enviar(e) {
    e.preventDefault(); setError(null); setOk(false)
    if (nueva.length < 8) { setError('La nueva contraseña debe tener al menos 8 caracteres.'); return }
    if (nueva !== repetir) { setError('La nueva contraseña y su repetición no coinciden.'); return }
    setBusy(true)
    try {
      await api('/auth/cambiar-password', { method: 'POST', json: { password_actual: actual, password_nueva: nueva } })
      setOk(true); setActual(''); setNueva(''); setRepetir('')
    } catch (ex) { setError(ex.message) } finally { setBusy(false) }
  }

  return (
    <div className="sa-card sa-panel">
      <h3 style={{ fontSize: 15, marginBottom: 3 }}>Seguridad</h3>
      <p className="d" style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 16 }}>Cambiá la contraseña de acceso a tu panel.</p>
      {error && <div className="sa-err">{error}</div>}
      {ok && <div className="ee-note" style={{ marginBottom: 12 }}><Icon name="check" /> Contraseña actualizada. Usá la nueva la próxima vez que ingreses.</div>}
      <form onSubmit={enviar} style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 380 }}>
        <div className="sa-field" style={{ margin: 0 }}><label>Contraseña actual</label><input type="password" value={actual} onChange={(e) => setActual(e.target.value)} autoComplete="current-password" required /></div>
        <div className="sa-field" style={{ margin: 0 }}><label>Nueva contraseña (mín. 8 caracteres)</label><input type="password" value={nueva} onChange={(e) => setNueva(e.target.value)} autoComplete="new-password" required /></div>
        <div className="sa-field" style={{ margin: 0 }}><label>Repetir nueva contraseña</label><input type="password" value={repetir} onChange={(e) => setRepetir(e.target.value)} autoComplete="new-password" required /></div>
        <div><button className="sa-btn dark" disabled={busy}>{busy ? 'Guardando…' : 'Cambiar contraseña'}</button></div>
      </form>
    </div>
  )
}

function Etiquetas({ endpoint, titulo, desc, placeholder, btn }) {
  const [items, setItems] = useState(null)
  const [nombre, setNombre] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function cargar() {
    try { setItems(await api(endpoint)) } catch (e) { setError(e.message) }
  }
  useEffect(() => { cargar() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function agregar(e) {
    e.preventDefault()
    const n = nombre.trim()
    if (!n) return
    setBusy(true); setError(null)
    try { await api(endpoint, { method: 'POST', json: { nombre: n } }); setNombre(''); await cargar() }
    catch (ex) { setError(ex.message) } finally { setBusy(false) }
  }

  async function eliminar(id) {
    setError(null)
    try { await api(`${endpoint}/${id}`, { method: 'DELETE' }); await cargar() } catch (ex) { setError(ex.message) }
  }

  return (
    <div className="sa-card sa-panel">
      <h3 style={{ fontSize: 15, marginBottom: 3 }}>{titulo}</h3>
      <p className="d" style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 16 }}>{desc}</p>
      {error && <div className="sa-err">{error}</div>}
      {!items ? (
        <div className="sa-empty"><Loader /></div>
      ) : (
        <div className="ee-tags">
          {items.length === 0 && <span className="sa-empty" style={{ padding: 0 }}>Todavía no hay.</span>}
          {items.map((p) => (
            <span className="ee-tag" key={p.id}>{p.nombre}<button onClick={() => eliminar(p.id)} title="Eliminar"><Icon name="x" /></button></span>
          ))}
        </div>
      )}
      <form className="ee-addtag" onSubmit={agregar}>
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder={placeholder} />
        <button className="sa-btn dark" disabled={busy}><Icon name="plus" /> {btn}</button>
      </form>
    </div>
  )
}
