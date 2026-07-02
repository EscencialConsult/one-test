// Cliente del backend (FastAPI). En dev, /api va por el proxy de Vite al puerto 8000.

export async function getPreguntas(slug) {
  const res = await fetch(`/api/tests/${slug}/preguntas`)
  if (!res.ok) throw new Error('No se pudieron cargar las preguntas del test.')
  return res.json()
}

export async function calcular(slug, respuestas) {
  const res = await fetch(`/api/tests/${slug}/calcular`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ respuestas }),
  })
  if (!res.ok) throw new Error('Hubo un problema al procesar tus respuestas.')
  return res.json()
}
