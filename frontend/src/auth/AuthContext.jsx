import { createContext, useContext, useEffect, useState } from 'react'

const AuthCtx = createContext(null)
const TOKEN_KEY = 'one_token'

export function homeFor(user) {
  if (!user) return '/login'
  if (user.rol === 'superadmin') return '/admin'
  if (user.rol === 'admin_empresa') return '/empresa'
  return '/evaluado'
}

async function fetchMe(token) {
  const res = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) throw new Error('sesión inválida')
  return res.json()
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(Boolean(localStorage.getItem(TOKEN_KEY)))

  useEffect(() => {
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }
    let vivo = true
    fetchMe(token)
      .then((u) => { if (vivo) setUser(u) })
      .catch(() => {
        if (!vivo) return
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem('one_ee_brand')
        setToken(null)
        setUser(null)
      })
      .finally(() => { if (vivo) setLoading(false) })
    return () => { vivo = false }
  }, [token])

  async function login(email, password) {
    const body = new URLSearchParams({ username: email.trim().toLowerCase(), password })
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail || 'Email o contraseña incorrectos')
    }
    const { access_token } = await res.json()
    localStorage.setItem(TOKEN_KEY, access_token)
    const me = await fetchMe(access_token)
    setToken(access_token)
    setUser(me)
    return me
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem('one_ee_brand') // marca de empresa cacheada (ver EEShell)
    setToken(null)
    setUser(null)
  }

  return (
    <AuthCtx.Provider value={{ token, user, loading, login, logout }}>
      {children}
    </AuthCtx.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
