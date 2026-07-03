import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import Plexus from '../Plexus.jsx'
import { useAuth } from '../auth/AuthContext.jsx'
import Icon from './Icons.jsx'
import './sa.css'

const NAV = [
  { to: '/admin', end: true, icon: 'grid', label: 'Dashboard' },
  { to: '/admin/empresas', end: false, icon: 'build', label: 'Empresas' },
  { to: '/admin/catalogo', end: false, icon: 'layers', label: 'Catálogo de tests' },
  { to: '/admin/plantillas', end: false, icon: 'doc', label: 'Plantillas 360°' },
  // 'Configuración' oculta hasta implementar el almacenamiento real (settings/integraciones).
]

function tituloDe(path) {
  if (path.startsWith('/admin/empresas')) return 'Empresas'
  if (path.startsWith('/admin/catalogo')) return 'Catálogo de tests'
  if (path.startsWith('/admin/plantillas')) return 'Plantillas de evaluación'
  return 'Dashboard'
}

export default function SuperAdminShell() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  function salir() {
    logout()
    navigate('/login', { replace: true })
  }

  const iniciales = user
    ? `${(user.nombre || '')[0] || ''}${(user.apellido || '')[0] || ''}`.toUpperCase() || 'SA'
    : 'SA'

  return (
    <>
      <Plexus />
      <div className="sa-app">
        <aside className="sa-side">
          <div className="sa-brand">
            <span className="one-brand"><img className="one-logo" src="/logo.png" alt="ONE" style={{ height: 34 }} /><span className="one-sub" style={{ fontSize: 15 }}>Core Analytics</span></span>
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
            <div className="info"><b>{user ? `${user.nombre} ${user.apellido}` : 'SuperAdmin'}</b><span>SuperAdmin</span></div>
            <button className="out" title="Salir" onClick={salir}><Icon name="logout" /></button>
          </div>
        </aside>

        <div className="sa-main">
          <div className="sa-topbar">
            <h1>{tituloDe(pathname)}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="userpill" style={{ fontSize: 13, color: 'var(--muted)' }}>{user?.email}</span>
            </div>
          </div>
          <div className="sa-content">
            <div className="sa-view" key={pathname}>
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
