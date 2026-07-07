// Cliente HTTP autenticado: agrega el token Bearer y maneja errores/JSON.
const TOKEN_KEY = 'one_token'

export async function api(path, opts = {}) {
  const token = localStorage.getItem(TOKEN_KEY)
  const headers = { ...(opts.headers || {}) }
  if (token) headers.Authorization = `Bearer ${token}`

  let body = opts.body
  if (opts.json !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(opts.json)
  }

  const res = await fetch(`/api${path}`, { ...opts, headers, body })
  if (res.status === 204) return null
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(mensajeError(data))
  return data
}

// FastAPI devuelve `detail` como string (HTTPException) o como LISTA de errores (422 de
// validación). Sin esto, una lista se mostraba como "[object Object]".
function mensajeError(data) {
  const limpiar = (m) => String(m).replace(/^Value error,\s*/i, '')
  const d = data && data.detail
  if (typeof d === 'string') return limpiar(d)
  if (Array.isArray(d)) {
    const msgs = d.map((e) => (typeof e === 'string' ? e : e && e.msg)).filter(Boolean).map(limpiar)
    if (msgs.length) return [...new Set(msgs)].join(' · ')
  }
  if (d && typeof d === 'object' && d.msg) return limpiar(d.msg)
  return 'Error en la solicitud'
}
