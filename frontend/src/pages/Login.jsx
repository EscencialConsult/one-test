import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import Plexus from '../Plexus.jsx'
import { useAuth, homeFor } from '../auth/AuthContext.jsx'

export default function Login() {
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [cargando, setCargando] = useState(false)

  // Si ya hay sesión, ir directo al portal correspondiente.
  // (Se hace con <Navigate>, no con navigate() en render, que dejaba la pantalla en blanco.)
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

  return (
    <div className="app">
      <Plexus />
      <div className="login-wrap">
        <form className="card login-card" onSubmit={enviar}>
          <Link to="/" className="login-brand"><span className="logo">O<b>NE</b></span></Link>
          <h1 className="login-h">Iniciar sesión</h1>
          <p className="login-sub">Accedé a tu panel de ONE Core Analytics.</p>

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
          <Link to="/" className="login-volver">← Volver al inicio</Link>
        </form>
      </div>
    </div>
  )
}
