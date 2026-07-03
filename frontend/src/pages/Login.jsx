import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import Plexus from '../Plexus.jsx'
import { useAuth, homeFor } from '../auth/AuthContext.jsx'

export default function Login() {
  const { login, user } = useAuth()
  const { sub } = useParams() // /acceso/:sub → marca de esa empresa
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [brand, setBrand] = useState(null)

  // Si se entró por /acceso/:sub, traemos la marca de esa empresa para el login.
  useEffect(() => {
    if (!sub) { setBrand(null); return }
    let vivo = true
    fetch(`/api/publico/marca/${encodeURIComponent(sub)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((b) => { if (vivo) setBrand(b) })
      .catch(() => {})
    return () => { vivo = false }
  }, [sub])

  // Si ya hay sesión, ir directo al portal correspondiente.
  if (user) return <Navigate to={homeFor(user)} replace />

  async function enviar(e) {
    e.preventDefault()
    setError(null)
    setCargando(true)
    try {
      const me = await login(email, password)
      navigate(homeFor(me), { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  const theme = brand ? { '--violeta': brand.color_acento, '--grad': brand.color_acento, '--rosa': brand.color_secundario || '#6be1e3' } : undefined

  return (
    <div className="app" style={theme}>
      <Plexus />
      <div className="login-wrap">
        <form className="card login-card" onSubmit={enviar}>
          {brand ? (
            <span className="login-brand">
              {brand.logo_url
                ? <img className="one-logo" src={brand.logo_url} alt={brand.razon_social} style={{ height: 42, maxWidth: 220 }} />
                : <span className="one-sub" style={{ fontSize: 20, fontWeight: 800 }}>{brand.razon_social}</span>}
            </span>
          ) : (
            <Link to="/" className="login-brand"><span className="one-brand"><img className="one-logo" src="/logo.png" alt="ONE" /><span className="one-sub">Core Analytics</span></span></Link>
          )}
          <h1 className="login-h">Iniciar sesión</h1>
          <p className="login-sub">{brand ? `Accedé al panel de ${brand.razon_social}.` : 'Accedé a tu panel de ONE Core Analytics.'}</p>

          <label className="login-lbl">Email</label>
          <input
            className="login-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@empresa.com"
            autoComplete="username"
            required
          />

          <label className="login-lbl">Contraseña</label>
          <input
            className="login-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />

          {error && <div className="login-error">{error}</div>}

          <button className="btn prim" type="submit" disabled={cargando} style={{ width: '100%', marginTop: 8 }}>
            {cargando ? 'Ingresando…' : 'Ingresar →'}
          </button>
          {!brand && <Link to="/" className="login-volver">← Volver al inicio</Link>}
        </form>
      </div>
    </div>
  )
}
