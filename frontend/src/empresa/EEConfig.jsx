import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { api } from '../lib/api.js'
import Icon from '../superadmin/Icons.jsx'

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
        <div className="sa-empty">Cargando…</div>
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
