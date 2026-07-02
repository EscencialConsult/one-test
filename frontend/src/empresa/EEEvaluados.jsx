import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api.js'
import Icon from '../superadmin/Icons.jsx'

const ESTADOS = {
  completado: { cls: 'comp', txt: 'Completado' },
  en_curso: { cls: 'curso', txt: 'En curso' },
  sin_iniciar: { cls: 'sin', txt: 'Sin iniciar' },
  sin_asignar: { cls: 'sinasig', txt: 'Sin asignar' },
}
const FILTROS = [
  { k: 'todos', txt: 'Todos' },
  { k: 'sin', txt: 'Sin iniciar' },
  { k: 'en_curso', txt: 'En curso' },
  { k: 'completado', txt: 'Completados' },
]
const tipoBadge = (t) => (t === 'postulante'
  ? { txt: 'Postulante', style: { color: '#9a8330', background: 'rgba(228,199,106,.26)' } }
  : { txt: 'Colaborador', style: { color: 'var(--violeta)', background: 'rgba(77,36,143,.10)' } })

export default function EEEvaluados() {
  const [evs, setEvs] = useState(null)
  const [perfiles, setPerfiles] = useState([])
  const [areas, setAreas] = useState([])
  const [error, setError] = useState(null)
  const [filtro, setFiltro] = useState('todos')
  const [fTipo, setFTipo] = useState('todos')
  const [modal, setModal] = useState(false)
  const [imp, setImp] = useState(false)
  const [sp] = useSearchParams()
  const q = (sp.get('q') || '').toLowerCase().trim()
  const navigate = useNavigate()

  async function cargar() {
    setError(null)
    try {
      const [e, p, a] = await Promise.all([api('/empresa/evaluados'), api('/perfiles'), api('/empresa/areas')])
      setEvs(e); setPerfiles(p); setAreas(a)
    } catch (ex) { setError(ex.message) }
  }
  useEffect(() => { cargar() }, [])

  const lista = (evs || []).filter((e) => {
    const estadoOk = filtro === 'todos' ? true
      : filtro === 'sin' ? (e.estado === 'sin_iniciar' || e.estado === 'sin_asignar')
        : e.estado === filtro
    if (!estadoOk) return false
    if (fTipo !== 'todos' && (e.tipo || 'colaborador') !== fTipo) return false
    if (!q) return true
    const txt = `${e.nombre} ${e.apellido} ${e.email} ${e.perfil_nombre || ''} ${e.area_nombre || ''}`.toLowerCase()
    return txt.includes(q)
  })

  return (
    <>
      <div className="sa-toolbar">
        <div className="l">
          {FILTROS.map((f) => (
            <div key={f.k} className={'sa-chipf' + (filtro === f.k ? ' on' : '')} onClick={() => setFiltro(f.k)}>{f.txt}</div>
          ))}
          <select value={fTipo} onChange={(e) => setFTipo(e.target.value)} style={{ padding: '9px 12px', borderRadius: 10, border: '1px solid var(--linea)', background: '#fff', fontSize: 12.5, fontWeight: 700, color: 'var(--tinta)', cursor: 'pointer' }}>
            <option value="todos">Colab. y postulantes</option>
            <option value="colaborador">Solo colaboradores</option>
            <option value="postulante">Solo postulantes</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="sa-btn ghost" onClick={() => setImp(true)}><Icon name="up" /> Importar (Excel/CSV)</button>
          <button className="sa-btn prim" onClick={() => setModal(true)}><Icon name="plus" /> Nuevo evaluado</button>
        </div>
      </div>

      {error && <div className="sa-err">{error}</div>}

      <div className="sa-card sa-panel">
        {!evs ? (
          <div className="sa-empty">Cargando…</div>
        ) : lista.length === 0 ? (
          <div className="sa-empty">{evs.length === 0 ? 'Todavía no hay evaluados. Creá el primero.' : q ? `Sin resultados para “${sp.get('q')}”.` : 'No hay evaluados para este filtro.'}</div>
        ) : (
          <table className="sa-table">
            <thead><tr><th>Evaluado</th><th>Tipo</th><th>Perfil</th><th>Área</th><th>Email</th><th>Pruebas</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              {lista.map((e) => {
                const st = ESTADOS[e.estado] || ESTADOS.sin_asignar
                const tb = tipoBadge(e.tipo)
                return (
                  <tr key={e.id} className="click" onClick={() => navigate(`/empresa/evaluados/${e.id}`)}>
                    <td><div className="sa-co"><div className="ee-av">{sigla(`${e.nombre} ${e.apellido}`)}</div><b>{e.nombre} {e.apellido}</b></div></td>
                    <td><span className="ee-badge" style={tb.style}>{tb.txt}</span></td>
                    <td>{e.perfil_nombre || '—'}</td>
                    <td>{e.area_nombre || '—'}</td>
                    <td>{e.email}</td>
                    <td>{e.completadas}/{e.asignadas}</td>
                    <td><span className={'ee-badge ' + st.cls}>{st.txt}</span></td>
                    <td style={{ textAlign: 'right' }}><span className="sa-chev"><Icon name="chevR" style={{ width: 18 }} /></span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {modal && <ModalNuevo perfiles={perfiles} areas={areas} onClose={() => setModal(false)} onCreado={() => { setModal(false); cargar() }} />}
      {imp && <ModalImportar onClose={() => setImp(false)} onDone={() => { setImp(false); cargar() }} />}
    </>
  )
}

function ModalNuevo({ perfiles, areas, onClose, onCreado }) {
  const [form, setForm] = useState({ nombre: '', apellido: '', email: '', tipo: 'colaborador', perfil_id: '', area_id: '', password: '' })
  const [err, setErr] = useState(null)
  const [busy, setBusy] = useState(false)
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  async function guardar(e) {
    e.preventDefault(); setErr(null); setBusy(true)
    try {
      await api('/evaluados', { method: 'POST', json: { ...form, perfil_id: form.perfil_id || null, area_id: form.area_id || null, password: form.password || null } })
      onCreado()
    } catch (ex) { setErr(ex.message) } finally { setBusy(false) }
  }

  return (
    <div className="sa-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <form className="sa-modal" onSubmit={guardar}>
        <button type="button" className="x" onClick={onClose}><Icon name="x" /></button>
        <h2>Nuevo evaluado</h2>
        <p className="ms">Se crea la persona que rendirá las pruebas y su acceso al portal.</p>
        {err && <div className="sa-err">{err}</div>}
        <div className="sa-frow">
          <div className="sa-field"><label>Nombre</label><input value={form.nombre} onChange={(e) => set('nombre', e.target.value)} required /></div>
          <div className="sa-field"><label>Apellido</label><input value={form.apellido} onChange={(e) => set('apellido', e.target.value)} required /></div>
        </div>
        <div className="sa-field"><label>Email</label><input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required /></div>
        <div className="sa-field"><label>Tipo de usuario</label>
          <select value={form.tipo} onChange={(e) => set('tipo', e.target.value)}>
            <option value="colaborador">Colaborador (empleado — 360°, áreas, procesos)</option>
            <option value="postulante">Postulante (candidato — tests de selección)</option>
          </select>
        </div>
        <div className="sa-frow">
          <div className="sa-field"><label>Perfil</label>
            <PerfilPicker perfiles={perfiles} value={form.perfil_id} onChange={(v) => set('perfil_id', v)} />
          </div>
          <div className="sa-field"><label>Área</label>
            <select value={form.area_id} onChange={(e) => set('area_id', e.target.value)}>
              <option value="">(sin área)</option>
              {areas.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
            </select>
          </div>
        </div>
        <div className="sa-field"><label>Contraseña de acceso (opcional)</label><input type="password" value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="Si lo dejás vacío, se genera una automática" /><small style={{ display: 'block', color: 'var(--muted)', fontSize: 11.5, marginTop: 6 }}>Se le envía por correo la invitación (link + usuario + contraseña).</small></div>
        <div className="sa-modalfoot">
          <button type="button" className="sa-btn ghost" onClick={onClose}>Cancelar</button>
          <button className="sa-btn dark" disabled={busy}>{busy ? 'Creando…' : 'Crear evaluado'}</button>
        </div>
      </form>
    </div>
  )
}

// ── Importación masiva (CSV; Excel → Guardar como CSV) ────────────────────────
function parseCSV(texto) {
  const lineas = texto.replace(/\r/g, '').split('\n').filter((l) => l.trim())
  if (lineas.length < 2) return { items: [], error: 'El archivo está vacío o solo tiene encabezados.' }
  const delim = lineas[0].includes(';') ? ';' : ','
  const norm = (s) => (s || '').trim().toLowerCase()
  const heads = lineas[0].split(delim).map(norm)
  const idx = (nombres) => heads.findIndex((h) => nombres.includes(h))
  const iN = idx(['nombre', 'nombres'])
  const iA = idx(['apellido', 'apellidos'])
  const iE = idx(['email', 'correo', 'e-mail', 'mail'])
  const iT = idx(['tipo'])
  const iAr = idx(['area', 'área', 'departamento', 'depto'])
  const iP = idx(['puesto', 'perfil', 'cargo'])
  if (iN < 0 || iE < 0) return { items: [], error: 'El CSV debe tener al menos las columnas "nombre" y "email".' }
  const items = []
  for (let i = 1; i < lineas.length; i++) {
    const c = lineas[i].split(delim)
    const email = (c[iE] || '').trim()
    const nombre = (c[iN] || '').trim()
    if (!email || !nombre) continue
    const tipoRaw = iT >= 0 ? (c[iT] || '').trim().toLowerCase() : ''
    items.push({
      nombre,
      apellido: iA >= 0 ? (c[iA] || '').trim() : '',
      email,
      tipo: tipoRaw.startsWith('postul') ? 'postulante' : 'colaborador',
      area: iAr >= 0 ? (c[iAr] || '').trim() || null : null,
      puesto: iP >= 0 ? (c[iP] || '').trim() || null : null,
    })
  }
  return { items, error: items.length ? null : 'No se encontraron filas válidas.' }
}

function ModalImportar({ onClose, onDone }) {
  const [items, setItems] = useState(null)
  const [err, setErr] = useState(null)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)
  const fileRef = useRef(null)

  function onFile(e) {
    setErr(null); setResult(null); setItems(null)
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => {
      // Excel suele guardar el CSV en ANSI (Windows-1252). Si UTF-8 falla (aparecen �),
      // reintentamos con Windows-1252 para no romper los acentos.
      const buf = reader.result
      let texto
      try {
        texto = new TextDecoder('utf-8', { fatal: false }).decode(buf)
        if (texto.includes('�')) texto = new TextDecoder('windows-1252').decode(buf)
      } catch { texto = new TextDecoder('windows-1252').decode(buf) }
      const { items, error } = parseCSV(texto)
      if (error) setErr(error); else setItems(items)
    }
    reader.readAsArrayBuffer(f)
  }

  function plantilla() {
    const csv = 'nombre;apellido;email;tipo;area;puesto\nJuan;Pérez;juan.perez@empresa.com;colaborador;Enfermería;Enfermero\nAna;Gómez;ana.gomez@empresa.com;postulante;Ventas;Vendedora\n'
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a'); a.href = url; a.download = 'plantilla-miembros.csv'; a.click(); URL.revokeObjectURL(url)
  }

  async function importar() {
    setBusy(true); setErr(null)
    try { setResult(await api('/evaluados/importar', { method: 'POST', json: { items } })) }
    catch (ex) { setErr(ex.message) } finally { setBusy(false) }
  }

  return (
    <div className="sa-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="sa-modal" style={{ width: 560 }}>
        <button type="button" className="x" onClick={onClose}><Icon name="x" /></button>
        <h2>Importar miembros</h2>
        <p className="ms">Subí un archivo <b>CSV</b> con columnas <b>nombre, apellido, email, tipo, area, puesto</b>. En <b>tipo</b> poné “colaborador” o “postulante” (si lo dejás vacío, queda colaborador). Las áreas y puestos se crean solos; los emails repetidos se omiten.</p>
        {err && <div className="sa-err">{err}</div>}

        {result ? (
          <div className="ee-note" style={{ background: 'rgba(107,225,227,.12)' }}>
            <Icon name="check" /> Importación lista: <b>{result.creados}</b> creados, <b>{result.omitidos}</b> omitidos (ya existían){result.errores?.length ? `, ${result.errores.length} con error` : ''}.
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              <button type="button" className="sa-btn ghost" onClick={() => fileRef.current?.click()}><Icon name="up" /> Elegir archivo CSV</button>
              <button type="button" className="sa-btn ghost" onClick={plantilla}><Icon name="down" /> Descargar plantilla</button>
              <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={onFile} style={{ display: 'none' }} />
            </div>
            {items && (
              <div className="ee-note" style={{ background: 'rgba(77,36,143,.06)', color: 'var(--tinta)' }}>
                <Icon name="users" /> Se detectaron <b>{items.length}</b> miembros válidos para importar.
              </div>
            )}
            <p style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 4 }}>Tip: en Excel, guardá tu planilla como “CSV (delimitado por comas o punto y coma)”.</p>
          </>
        )}

        <div className="sa-modalfoot">
          <button type="button" className="sa-btn ghost" onClick={result ? onDone : onClose}>{result ? 'Listo' : 'Cancelar'}</button>
          {!result && <button type="button" className="sa-btn dark" disabled={!items || busy} onClick={importar}>{busy ? 'Importando…' : `Importar ${items ? `(${items.length})` : ''}`}</button>}
        </div>
      </div>
    </div>
  )
}

// Selector de perfil con búsqueda (typeahead).
function PerfilPicker({ perfiles, value, onChange }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const ref = useRef(null)
  const sel = perfiles.find((p) => p.id === value)

  useEffect(() => {
    function onDoc(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('click', onDoc)
    return () => document.removeEventListener('click', onDoc)
  }, [])

  const filtered = perfiles.filter((p) => p.nombre.toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="ee-combo" ref={ref}>
      <input
        value={open ? q : (sel?.nombre || '')}
        placeholder="Buscar perfil…"
        onFocus={() => { setOpen(true); setQ('') }}
        onChange={(e) => { setQ(e.target.value); setOpen(true) }}
      />
      {open && (
        <div className="ee-combo-list">
          <div className={'opt' + (!value ? ' on' : '')} onMouseDown={() => { onChange(''); setOpen(false) }}>(sin perfil)</div>
          {filtered.map((p) => (
            <div key={p.id} className={'opt' + (p.id === value ? ' on' : '')} onMouseDown={() => { onChange(p.id); setOpen(false) }}>{p.nombre}</div>
          ))}
          {filtered.length === 0 && <div className="empty">Sin coincidencias. Podés crear perfiles en Configuración.</div>}
        </div>
      )}
    </div>
  )
}

function sigla(n) { return (n || '?').split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase() }
