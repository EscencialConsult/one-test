import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import Plexus from '../Plexus.jsx'
import Loader from '../components/Loader.jsx'
import './eval.css'

const LIKERT = [
  { v: 1, l: 'Nunca' }, { v: 2, l: 'Rara vez' }, { v: 3, l: 'A veces' },
  { v: 4, l: 'Frecuentemente' }, { v: 5, l: 'Siempre' },
]
const SINO = [{ v: 0, l: 'No cumple' }, { v: 1, l: 'Cumple' }]
const relFrase = (r) => ({ auto: 'como autoevaluación', supervisor: 'como supervisor/a', par: 'como par', reporte: 'como reporte directo', observador: 'como observador/a' }[r] || '')

async function pub(path, opts = {}) {
  const headers = { ...(opts.headers || {}) }
  let body = opts.body
  if (opts.json !== undefined) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(opts.json) }
  const res = await fetch(`/api/publico${path}`, { ...opts, headers, body })
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error((data && data.detail) || 'Error')
  return data
}

export default function Responder() {
  const { token } = useParams()
  const [info, setInfo] = useState(null)
  const [error, setError] = useState(null)
  const [resp, setResp] = useState({})
  const [enviado, setEnviado] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => { pub(`/eval/${token}`).then(setInfo).catch((e) => setError(e.message)) }, [token])

  const preguntas = useMemo(() => {
    const out = []
    for (const c of info?.estructura?.competencias || []) for (const p of c.preguntas || []) out.push(p.id)
    return out
  }, [info])

  const marca = info?.marca
  const theme = marca ? { '--violeta': marca.color_acento, '--grad': `linear-gradient(135deg, ${marca.color_acento}, ${marca.color_secundario || '#6be1e3'})` } : undefined
  const opciones = info?.escala === 'sino' ? SINO : LIKERT
  const respondidas = preguntas.filter((id) => resp[id] !== undefined).length

  async function enviar() {
    if (respondidas < preguntas.length) { setError(`Te faltan ${preguntas.length - respondidas} respuestas.`); return }
    setBusy(true); setError(null)
    try { await pub(`/eval/${token}`, { method: 'POST', json: { respuestas: resp } }); setEnviado(true) }
    catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  // ---- Estados especiales ----
  if (error && !info) return <Marco theme={theme}><div className="resp-center"><h1>Enlace no válido</h1><p>{error}</p></div></Marco>
  if (!info) return <Marco theme={theme}><div className="resp-center"><Loader /></div></Marco>
  if (enviado || info.ya_respondido) return (
    <Marco theme={theme}><div className="resp-center">
      <div className="ok">✓</div>
      <h1>¡Gracias{info.evaluador_nombre ? `, ${info.evaluador_nombre.split(' ')[0]}` : ''}!</h1>
      <p>{enviado ? 'Tus respuestas se registraron correctamente.' : 'Ya habías completado esta evaluación.'} Tus respuestas son confidenciales y se procesan de forma promediada.</p>
    </div></Marco>
  )
  if (info.estado_campania !== 'abierta') return (
    <Marco theme={theme}><div className="resp-center"><h1>Evaluación no disponible</h1><p>Esta evaluación todavía no está abierta o ya fue cerrada. Consultá con quien te envió el enlace.</p></div></Marco>
  )

  return (
    <Marco theme={theme}>
      <div className="resp-wrap">
        <div className="resp-head" style={{ background: `linear-gradient(135deg, ${marca?.color_acento || '#4d248f'}, ${marca?.color_secundario || '#6be1e3'})` }}>
          {marca?.logo_url ? <img className="rlogo" src={marca.logo_url} alt={marca.razon_social} /> : <div className="rmarca">{marca?.razon_social || 'ONE'}</div>}
          <h1>Evaluación sobre {info.sujeto_nombre}</h1>
          <p>Hola {info.evaluador_nombre}, respondés {relFrase(info.relacion)}. No hay respuestas correctas ni incorrectas: elegí lo que mejor refleje tu percepción. {info.escala === 'sino' ? 'Indicá si se cumple o no.' : 'Escala del 1 (Nunca) al 5 (Siempre).'}</p>
        </div>

        {error && <div className="sa-err">{error}</div>}

        {(info.estructura?.competencias || []).map((c) => (
          <div className="resp-comp" key={c.id}>
            <div className="ct">{c.nombre}</div>
            {(c.preguntas || []).map((p) => (
              <div className="resp-q" key={p.id}>
                <div className="qt">{p.texto}</div>
                <div className="resp-scale">
                  {opciones.map((o) => (
                    <div key={o.v} className={'resp-opt' + (resp[p.id] === o.v ? ' sel' : '')} onClick={() => setResp((s) => ({ ...s, [p.id]: o.v }))}>
                      {info.escala !== 'sino' && <b>{o.v}</b>}{o.l}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}

        <div className="resp-bar">
          <span className="prog">{respondidas}/{preguntas.length} respondidas</span>
          <button className="sa-btn dark" disabled={busy} onClick={enviar}>{busy ? 'Enviando…' : 'Enviar respuestas'}</button>
        </div>
      </div>
    </Marco>
  )
}

function Marco({ theme, children }) {
  return (
    <div className="app" style={theme}>
      <Plexus />
      {children}
    </div>
  )
}
