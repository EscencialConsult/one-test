import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import Plexus from '../Plexus.jsx'
import { useAuth } from '../auth/AuthContext.jsx'
import { api } from '../lib/api.js'
import Icon from '../superadmin/Icons.jsx'
import '../superadmin/sa.css'
import './ee.css'

const NAV = [
  { to: '/empresa', end: true, icon: 'grid', label: 'Dashboard' },
  { to: '/empresa/evaluados', end: false, icon: 'users', label: 'Evaluados' },
  { to: '/empresa/e360', end: false, icon: 'circle360', label: 'Evaluaciones' },
  { to: '/empresa/config', end: false, icon: 'cog', label: 'Configuración' },
]

function tituloDe(path) {
  if (path.startsWith('/empresa/evaluados')) return 'Evaluados'
  if (path.startsWith('/empresa/e360')) return 'Evaluaciones'
  if (path.startsWith('/empresa/config')) return 'Configuración'
  return 'Dashboard'
}

function sigla(n) { return (n || '?').split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase() }
function fechaCorta(iso) { try { return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }) } catch { return '' } }

export default function EEShell() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [sp] = useSearchParams()
  const [empresa, setEmpresa] = useState(null)
  const [bell, setBell] = useState(false)
  const [notis, setNotis] = useState({ no_leidas: 0, items: [] })
  const bellRef = useRef(null)

  useEffect(() => { api('/empresa/me').then(setEmpresa).catch(() => {}) }, [])

  async function cargarNotis() {
    try { setNotis(await api('/empresa/notificaciones')) } catch { /* ignora */ }
  }
  useEffect(() => {
    cargarNotis()
    const t = setInterval(cargarNotis, 60000) // refresca cada 60s
    return () => clearInterval(t)
  }, [])

  async function abrirBell() {
    const abrir = !bell
    setBell(abrir)
    if (abrir && notis.no_leidas > 0) {
      try { await api('/empresa/notificaciones/marcar-leidas', { method: 'POST' }) } catch { /* ignora */ }
      setNotis((n) => ({ ...n, no_leidas: 0 }))
    }
  }

  useEffect(() => {
    function onDoc(e) { if (bellRef.current && !bellRef.current.contains(e.target)) setBell(false) }
    document.addEventListener('click', onDoc)
    return () => document.removeEventListener('click', onDoc)
  }, [])

  const q = sp.get('q') || ''
  function buscar(val) {
    const t = `/empresa/evaluados${val ? `?q=${encodeURIComponent(val)}` : ''}`
    navigate(t, { replace: pathname.startsWith('/empresa/evaluados') })
  }

  function salir() { logout(); navigate('/login', { replace: true }) }

  const acento = empresa?.color_acento || 'var(--violeta)'
  const secundario = empresa?.color_secundario || '#6be1e3'
  const iniciales = user ? `${(user.nombre || '')[0] || ''}${(user.apellido || '')[0] || ''}`.toUpperCase() || 'AE' : 'AE'
  // Tema white-label PLANO: un color primario sólido (sin degradé) + secundario para detalles.
  const theme = empresa ? {
    '--violeta': empresa.color_acento,
    '--grad': empresa.color_acento,   // sólido (antes era degradé)
    '--acento2': secundario,
    '--rosa': secundario,             // detalles: foco de inputs, acentos
  } : undefined

  return (
    <>
      <Plexus />
      <div className={'sa-app' + (empresa ? ' ee-theme' : '')} style={theme}>
        <aside className="sa-side">
          <div className="ee-brand2">
            <div className="ee-clogo" style={{ background: empresa?.logo_url ? '#fff' : `linear-gradient(135deg, ${acento}, ${secundario})`, padding: empresa?.logo_url ? 4 : 0 }}>
              {empresa?.logo_url ? <img src={empresa.logo_url} alt={empresa.razon_social} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} /> : sigla(empresa?.razon_social || 'ONE')}
            </div>
            <div><b>{empresa?.razon_social || 'Tu empresa'}</b><small>Panel de evaluación</small></div>
          </div>
          <nav className="sa-nav">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => (isActive ? 'on' : undefined)}>
                <Icon name={n.icon} /> {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="sa-foot">
            <div className="av">{iniciales}</div>
            <div className="info"><b>{user ? `${user.nombre} ${user.apellido}` : 'Administrador'}</b><span>Administrador</span></div>
            <button className="out" title="Salir" onClick={salir}><Icon name="logout" /></button>
          </div>
        </aside>

        <div className="sa-main">
          <div className="sa-topbar">
            <h1>{tituloDe(pathname)}</h1>
            <div className="sa-tools" ref={bellRef}>
              <div className="sa-search">
                <Icon name="search" />
                <input placeholder="Buscar evaluado…" value={q} onChange={(e) => buscar(e.target.value)} />
              </div>
              <button className="sa-iconbtn" onClick={abrirBell} title="Notificaciones">
                <Icon name="bell" />
                {notis.no_leidas > 0 && <span className="dotr" />}
              </button>
              {bell && (
                <div className="sa-pop">
                  <h4>Notificaciones</h4>
                  {notis.items.length === 0 ? (
                    <p>No tenés notificaciones. Acá verás avisos cuando un evaluado complete sus pruebas.</p>
                  ) : (
                    <div className="sa-notis">
                      {notis.items.map((n) => (
                        <button
                          key={n.id}
                          className="sa-noti"
                          onClick={() => { setBell(false); if (n.link) navigate(n.link) }}
                        >
                          <span className="msg">{n.mensaje}</span>
                          <span className="fch">{fechaCorta(n.fecha)}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="sa-content">
            <div className="sa-view" key={pathname}>
              <Outlet context={{ empresa }} />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
