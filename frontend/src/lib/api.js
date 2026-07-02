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
  if (!res.ok) throw new Error((data && data.detail) || 'Error en la solicitud')
  return data
}
