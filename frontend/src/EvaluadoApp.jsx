import { useEffect, useState } from 'react'
import Plexus from './Plexus.jsx'
import TestRunner from './TestRunner.jsx'
import DominoRunner from './DominoRunner.jsx'
import KuderRunner from './KuderRunner.jsx'
import StaiRunner from './StaiRunner.jsx'
import './evaluado/pe.css'

const EVAL_KEY = 'one_eval_token'

// Cliente HTTP del evaluado (token propio, separado del de los admins).
async function apiEval(path, opts = {}) {
  const token = localStorage.getItem(EVAL_KEY)
  const headers = { ...(opts.headers || {}) }
  if (token) headers.Authorization = `Bearer ${token}`
  let body = opts.body
  if (opts.json !== undefined) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(opts.json) }
  const res = await fetch(`/api${path}`, { ...opts, headers, body })
  if (res.status === 204) return null
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error((data && data.detail) || 'Error en la solicitud')
  return data
}

// Tests que hoy se pueden rendir en línea (tienen runner compatible).
const RUNNABLE = new Set([
  'big-five', 'chaside', 'dnla-percepcion-personal', 'baron-eqi',
  'ipp-r', 'gds-15', 'domino-48', 'kuder', 'stai',
])

function runnerFor(slug) {
  if (slug === 'domino-48') return DominoRunner
  if (slug === 'kuder') return KuderRunner
  if (slug === 'stai') return StaiRunner
  return TestRunner
}

const DOT = { psicometrico: 'var(--rosa)', psicotecnico: 'var(--cian)', vocacional: 'var(--oro)', clinico: 'var(--violeta)' }
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s)
const sigla = (n) => (n || '?').split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase()

export default function EvaluadoApp() {
  const [token, setToken] = useState(() => localStorage.getItem(EVAL_KEY))
  const [me, setMe] = useState(null)
  const [asigs, setAsigs] = useState(null)
  const [error, setError] = useState(null)
  const [activo, setActivo] = useState(null) // slug del test en curso

  async function cargar() {
    setError(null)
    try {
      const [m, a] = await Promise.all([apiEval('/yo/me'), apiEval('/yo/asignaciones')])
      setMe(m); setAsigs(a)
    } catch (e) {
      localStorage.removeItem(EVAL_KEY)
      setToken(null); setMe(null)
    }
  }

  useEffect(() => { if (token) cargar() }, [token])

  function logout() {
    localStorage.removeItem(EVAL_KEY)
    setToken(null); setMe(null); setAsigs(null); setActivo(null)
  }

  // ----- Sin sesión: login del evaluado -----
  if (!token) return <LoginEvaluado onLogged={(t) => { localStorage.setItem(EVAL_KEY, t); setToken(t) }} />

  // ----- Tomando un test -----
  if (activo) {
    const Runner = runnerFor(activo)
    return (
      <Runner
        slug={activo}
        onExit={() => { setActivo(null); cargar() }}
        onSubmit={(respuestas) => apiEval(`/yo/asignaciones/${activo}/resultado`, { method: 'POST', json: { respuestas } })}
      />
    )
  }

  // ----- Home: saludo + lista de pruebas -----
  const total = asigs?.length || 0
  const completadas = (asigs || []).filter((a) => a.estado === 'completado').length
  const pendientes = total - completadas
  const emp = me?.empresa
  const theme = emp ? { '--violeta': emp.color_acento, '--grad': `linear-gradient(135deg, ${emp.color_acento}, ${emp.color_secundario || '#6be1e3'})` } : undefined

  return (
    <div className="app" style={theme}>
      <Plexus />
      <nav className="pe-nav">
        {emp?.logo_url ? <img className="pe-logoimg" src={emp.logo_url} alt={emp.razon_social} /> : <span className="pe-logo">O<b>NE</b></span>}
        <div className="pe-user">
          <span className="pe-pill"><span className="av">{me ? sigla(`${me.nombre} ${me.apellido}`) : '—'}</span>{me ? `${me.nombre} ${me.apellido}` : 'Evaluado'}</span>
          <button className="pe-out" onClick={logout}>Salir</button>
        </div>
      </nav>

      <div className="pe-wrap">
        <div className="card pe-hello">
          <span className="eb">MIS PRUEBAS</span>
          <h1>Hola, {me?.nombre || ''} 👋</h1>
          <p>Estas son las pruebas que tu empresa te asignó. Elegí una para comenzar; las completadas no se vuelven a rendir. Los resultados los recibe tu empresa.</p>
          {total > 0 && (
            <div className="pe-stats">
              <div className="pe-stat"><span className="dotc" style={{ background: 'var(--oro)' }} /><div><div className="n">{pendientes}</div><div className="l">Pendientes</div></div></div>
              <div className="pe-stat"><span className="dotc" style={{ background: 'var(--cian)' }} /><div><div className="n">{completadas}</div><div className="l">Completadas</div></div></div>
              <div className="pe-stat"><span className="dotc" style={{ background: 'var(--rosa)' }} /><div><div className="n">{total}</div><div className="l">En total</div></div></div>
            </div>
          )}
        </div>

        {error && <div className="pe-err">{error}</div>}

        {!asigs ? (
          <div className="card pe-empty">Cargando…</div>
        ) : asigs.length === 0 ? (
          <div className="card pe-empty">Todavía no tenés pruebas asignadas. Tu empresa te las asignará y las verás acá.</div>
        ) : (
          <>
            <div className="pe-sec">Pruebas asignadas</div>
            <div className="pe-grid">
              {asigs.map((a) => {
                const hecho = a.estado === 'completado'
                const disponible = a.tomable && RUNNABLE.has(a.test_slug)
                return (
                  <div className={'pe-card' + (hecho ? ' done' : disponible ? ' can' : '')} key={a.id}>
                    <span className="pe-cat">{cap(a.categoria) || 'Evaluación'}</span>
                    <h3>{a.nombre}</h3>
                    <div className="pe-meta">
                      {a.n_items ? <span className="pe-chip"><span className="dot" style={{ background: DOT[a.categoria] || 'var(--rosa)' }} /> {a.n_items} preguntas</span> : null}
                      <span className="pe-chip"><span className="dot" style={{ background: 'var(--cian)' }} /> {hecho ? 'Finalizada' : 'Sin comenzar'}</span>
                    </div>
                    <div className="pe-foot">
                      <span className={'pe-estado ' + a.estado}>{hecho ? 'Completado' : 'Pendiente'}</span>
                      {hecho ? (
                        <button className="pe-btn ghost" disabled>Completado ✓</button>
                      ) : !disponible ? (
                        <button className="pe-btn ghost" disabled>No disponible aún</button>
                      ) : (
                        <button className="pe-btn prim" onClick={() => setActivo(a.test_slug)}>Comenzar →</button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function LoginEvaluado({ onLogged }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [cargando, setCargando] = useState(false)

  async function enviar(e) {
    e.preventDefault()
    setError(null); setCargando(true)
    try {
      const body = new URLSearchParams({ username: email.trim().toLowerCase(), password })
      const res = await fetch('/api/auth/evaluado/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || 'Email o contraseña incorrectos')
      }
      const { access_token } = await res.json()
      onLogged(access_token)
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
          <span className="login-brand"><span className="logo">O<b>NE</b></span></span>
          <h1 className="login-h">Portal del evaluado</h1>
          <p className="login-sub">Ingresá con los datos que te dio tu empresa.</p>

          <label className="login-lbl">Email</label>
          <input className="login-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" autoComplete="username" required />

          <label className="login-lbl">Contraseña</label>
          <input className="login-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" required />

          {error && <div className="login-error">{error}</div>}

          <button className="btn prim" type="submit" disabled={cargando} style={{ width: '100%', marginTop: 8 }}>
            {cargando ? 'Ingresando…' : 'Ingresar →'}
          </button>
        </form>
      </div>
    </div>
  )
}
