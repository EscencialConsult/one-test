import { useEffect, useState } from 'react'
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, PolarAngleAxis, PolarGrid,
  PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { api } from '../lib/api.js'
import Icon from '../superadmin/Icons.jsx'
import './eval.css'

const COLORS = { auto: '#4d248f', supervisor: '#e17bd7', par: '#6be1e3', reporte: '#e4c76a', observador: '#4d248f' }
const cumpColor = (p) => (p >= 80 ? '#1b9aa0' : p >= 50 ? '#9a8330' : '#d6336c')

function brecha(gap) {
  if (gap > 0.5) return { tag: 'Punto ciego', style: { color: '#d6336c', background: 'rgba(214,51,108,.1)' }, txt: 'Te ves mejor de lo que te ven' }
  if (gap < -0.5) return { tag: 'Fortaleza no reconocida', style: { color: '#1b9aa0', background: 'rgba(107,225,227,.2)' }, txt: 'Te ven mejor de lo que te ves' }
  return { tag: 'Percepción alineada', style: { color: 'var(--violeta)', background: 'rgba(77,36,143,.1)' }, txt: 'Coincide tu visión con la del resto' }
}

export default function InformeCampania({ id, onBack }) {
  const [d, setD] = useState(null)
  const [error, setError] = useState(null)
  const [min, setMin] = useState('')
  const [saving, setSaving] = useState(false)

  async function cargar() {
    setError(null)
    try { const data = await api(`/empresa/eval-campanias/${id}/informe`); setD(data); setMin(String(data.campania.anonimato_min)) }
    catch (e) { setError(e.message) }
  }
  useEffect(() => { cargar() }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function aplicarMin() {
    setSaving(true); setError(null)
    try { await api(`/empresa/eval-campanias/${id}`, { method: 'PATCH', json: { anonimato_min: Number(min) || 1 } }); await cargar() }
    catch (e) { setError(e.message) } finally { setSaving(false) }
  }

  if (error) return <><button className="sa-backlink" onClick={onBack}><Icon name="chevL" /> Volver</button><div className="sa-err">{error}</div></>
  if (!d) return <div className="sa-card sa-panel">Cargando informe…</div>

  const c = d.campania
  const marca = d.marca
  const esSino = d.escala !== 'likert5'
  const acento = marca?.color_acento || '#4d248f'
  const sec = marca?.color_secundario || '#6be1e3'
  const gruposMostrados = (d.grupos || []).filter((g) => g.mostrado)
  const hayOcultos = (d.grupos || []).some((g) => !g.mostrado)
  const sinDatos = c.n_completados === 0

  return (
    <div className="inf-camp">
      <div className="sa-toolbar no-print">
        <button className="sa-backlink" style={{ margin: 0 }} onClick={onBack}><Icon name="chevL" /> Volver a la campaña</button>
        <button className="sa-btn dark" onClick={() => window.print()}><Icon name="down" /> Descargar PDF</button>
      </div>

      <div className="inf-camp-head" style={{ background: `linear-gradient(135deg, ${acento}, ${sec})` }}>
        <div className="m">{marca?.razon_social || 'ONE'} · Informe de evaluación</div>
        <h1>{c.nombre}</h1>
        <p>{tipoTxt(c.tipo)} · <b>{c.sujeto_nombre}</b> · {c.n_completados}/{c.n_evaluadores} respondieron · {esSino ? 'Escala Sí/No (% cumplimiento)' : 'Escala 1 a 5'}</p>
      </div>

      {sinDatos ? (
        <div className="inf-card"><div className="sa-empty">Todavía no hay respuestas para mostrar en el informe.</div></div>
      ) : (
        <>
          <div className="inf-card">
            <h3>Participación</h3>
            <div className="inf-chips">
              {(d.grupos || []).map((g) => (
                <span key={g.relacion} className="ev-tag tipo" style={{ opacity: g.mostrado ? 1 : .5 }}>{g.label}: {g.n}{!g.mostrado ? ' (oculto)' : ''}</span>
              ))}
            </div>
            {(() => {
              const pieData = (d.grupos || []).filter((g) => g.n > 0).map((g) => ({ name: g.label, value: g.n, rel: g.relacion }))
              if (pieData.length < 2) return null
              return (
                <ResponsiveContainer width="100%" height={230}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(e) => `${e.name}: ${e.value}`}>
                      {pieData.map((p) => <Cell key={p.rel} fill={COLORS[p.rel] || '#4d248f'} />)}
                    </Pie>
                    <Tooltip /><Legend />
                  </PieChart>
                </ResponsiveContainer>
              )
            })()}
            {hayOcultos && (
              <>
                <p className="ev-tipo-hint" style={{ marginTop: 10 }}>Algunos grupos no se muestran por separado para proteger el <b>anonimato</b> (menos de {c.anonimato_min} respuestas). {d.es360 ? 'Sus datos igual se promedian en “otros”.' : ''}</p>
                <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                  <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>Mínimo de respuestas para mostrar un grupo:</span>
                  <input type="number" min="1" value={min} onChange={(e) => setMin(e.target.value)} style={{ width: 64, padding: '6px 8px', border: '1px solid var(--linea)', borderRadius: 8 }} />
                  <button className="sa-btn ghost" disabled={saving} onClick={aplicarMin}>{saving ? 'Aplicando…' : 'Aplicar'}</button>
                </div>
              </>
            )}
          </div>

          {d.es360 ? (
            <Trescientos d={d} acento={acento} sec={sec} gruposMostrados={gruposMostrados} />
          ) : esSino ? (
            <Procesos d={d} acento={acento} />
          ) : (
            <Areas d={d} acento={acento} />
          )}
          <NivelPie d={d} esSino={esSino} />
          <Sintesis d={d} esSino={esSino} />
        </>
      )}
    </div>
  )
}

// ── 360° ──────────────────────────────────────────────────────────────────────
function Trescientos({ d, acento, sec, gruposMostrados }) {
  const radar = d.competencias.map((c) => ({ competencia: c.nombre, 'Autoevaluación': c.auto, 'Cómo lo ven': c.otros }))
  const relBar = gruposMostrados.map((g) => g.relacion)
  const barData = d.competencias.map((c) => ({ competencia: c.nombre, ...c.por_grupo }))
  const brechas = d.competencias.filter((c) => c.gap !== null && c.gap !== undefined).sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap))
  const radarConDatos = radar.some((r) => r['Autoevaluación'] != null || r['Cómo lo ven'] != null)
  const barConDatos = barData.some((row) => relBar.some((rel) => row[rel] != null))

  return (
    <>
      <div className="inf-card">
        <h3>Mapa de competencias</h3>
        <div className="sub">Tu autoevaluación (violeta) frente a cómo te ve el resto de la organización.</div>
        {radarConDatos ? (
          <ResponsiveContainer width="100%" height={340}>
            <RadarChart data={radar} outerRadius="72%">
              <PolarGrid />
              <PolarAngleAxis dataKey="competencia" tick={{ fontSize: 12 }} />
              <PolarRadiusAxis domain={[1, 5]} tick={{ fontSize: 10 }} />
              <Radar name="Autoevaluación" dataKey="Autoevaluación" stroke={acento} fill={acento} fillOpacity={0.3} />
              <Radar name="Cómo lo ven" dataKey="Cómo lo ven" stroke={sec} fill={sec} fillOpacity={0.25} />
              <Legend /><Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        ) : <div className="sa-empty">Todavía no hay datos suficientes: faltan respuestas o los grupos no alcanzan el mínimo de anonimato.</div>}
      </div>

      {relBar.length > 0 && barConDatos && (
        <div className="inf-card">
          <h3>Promedio por grupo</h3>
          <div className="sub">Cómo puntúa cada relación a {d.campania.sujeto_nombre}.</div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={barData} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="competencia" tick={{ fontSize: 11 }} interval={0} />
              <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
              <Tooltip /><Legend />
              {relBar.map((rel) => (
                <Bar key={rel} dataKey={rel} name={label(d, rel)} fill={COLORS[rel] || acento} radius={[5, 5, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="inf-card">
        <h3>Brechas y puntos ciegos</h3>
        <div className="sub">Diferencia entre tu autopercepción y la mirada del resto (autoevaluación − otros).</div>
        {brechas.length === 0 ? <div className="sa-empty">No hay datos suficientes para calcular brechas.</div> : brechas.map((c) => {
          const b = brecha(c.gap)
          return (
            <div className="inf-gaprow" key={c.nombre}>
              <span className="nm">{c.nombre}</span>
              <span className="tag" style={b.style}>{b.tag}</span>
              <span className="val" style={{ color: c.gap > 0 ? '#d6336c' : c.gap < 0 ? '#1b9aa0' : 'var(--muted)' }}>{c.gap > 0 ? '+' : ''}{c.gap}</span>
            </div>
          )
        })}
      </div>
    </>
  )
}

// ── Áreas (Likert, un grupo) ─────────────────────────────────────────────────
function Areas({ d, acento }) {
  const data = d.competencias.map((c) => ({ competencia: c.nombre, Promedio: c.promedio }))
  const conDatos = data.some((x) => x.Promedio !== null && x.Promedio !== undefined)
  return (
    <div className="inf-card">
      <h3>Promedio por competencia</h3>
      <div className="sub">Valoración de los observadores sobre {d.campania.sujeto_nombre} (escala 1 a 5).</div>
      {conDatos ? (
        <ResponsiveContainer width="100%" height={340}>
          <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="competencia" tick={{ fontSize: 11 }} interval={0} />
            <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="Promedio" fill={acento} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : <div className="sa-empty">Todavía no hay datos para mostrar: el grupo no alcanza el mínimo de anonimato. Bajá el mínimo arriba o sumá más respuestas.</div>}
    </div>
  )
}

// ── Procesos (Sí/No, cumplimiento) ───────────────────────────────────────────
function Procesos({ d, acento }) {
  const data = d.competencias.filter((c) => c.promedio !== null && c.promedio !== undefined).map((c) => ({ competencia: c.nombre, Cumplimiento: c.promedio }))
  const items = [...(d.preguntas || [])].sort((a, b) => a.cumplimiento - b.cumplimiento)
  return (
    <>
      <div className="inf-card">
        <h3>Cumplimiento por competencia</h3>
        <div className="sub">Porcentaje de cumplimiento observado en {d.campania.sujeto_nombre}.</div>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="competencia" tick={{ fontSize: 11 }} interval={0} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
              <Tooltip />
              <Bar dataKey="Cumplimiento" fill={acento} radius={[6, 6, 0, 0]} unit="%" />
            </BarChart>
          </ResponsiveContainer>
        ) : <div className="sa-empty">Todavía no hay datos para mostrar: el grupo no alcanza el mínimo de anonimato. Bajá el mínimo arriba o sumá más respuestas.</div>}
      </div>

      {items.length > 0 && (
        <div className="inf-card">
          <h3>Detalle por ítem</h3>
          <div className="sub">Ordenado de menor a mayor cumplimiento (lo que más falla, arriba).</div>
          {items.map((p, i) => (
            <div className="inf-item" key={i}>
              <div className="t">{p.texto} <small>· {p.competencia}</small></div>
              <div className="bar"><i style={{ width: `${p.cumplimiento}%`, background: cumpColor(p.cumplimiento) }} /></div>
              <div className="pct" style={{ color: cumpColor(p.cumplimiento) }}>{p.cumplimiento}%</div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

// Torta (dona) de competencias por nivel Alto/Medio/Bajo.
function NivelPie({ d, esSino }) {
  const comps = d.competencias.filter((c) => c.promedio !== null && c.promedio !== undefined)
  if (comps.length === 0) return null
  const nivelDe = (v) => (esSino ? (v >= 80 ? 'Alto' : v >= 50 ? 'Medio' : 'Bajo') : (v >= 4 ? 'Alto' : v >= 2.5 ? 'Medio' : 'Bajo'))
  const COLNIV = { Alto: '#1b9aa0', Medio: '#9a8330', Bajo: '#d6336c' }
  const cnt = { Alto: 0, Medio: 0, Bajo: 0 }
  comps.forEach((c) => { cnt[nivelDe(c.promedio)] += 1 })
  const data = ['Alto', 'Medio', 'Bajo'].map((n) => ({ name: n, value: cnt[n] })).filter((x) => x.value > 0)
  const umbral = esSino ? 'Alto ≥80% · Medio 50–79% · Bajo <50%' : 'Alto ≥4 · Medio 2,5–3,9 · Bajo <2,5'
  return (
    <div className="inf-card">
      <h3>Competencias por nivel</h3>
      <div className="sub">Cuántas competencias caen en cada nivel según cómo se percibe a {d.campania.sujeto_nombre} ({umbral}).</div>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2} label={(e) => `${e.name}: ${e.value}`}>
            {data.map((x) => <Cell key={x.name} fill={COLNIV[x.name]} />)}
          </Pie>
          <Tooltip /><Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

// Lista nombres de competencias con su valor: "A (4.2), B (3.9)"
const listar = (arr, key) => arr.map((c) => `${c.nombre} (${c[key]})`).join(', ')

function Sintesis({ d, esSino }) {
  const comps = d.competencias
  const sujeto = d.campania.sujeto_nombre

  let cuerpo = null
  if (d.es360) {
    const conOtros = comps.filter((c) => c.otros !== null && c.otros !== undefined)
    if (!conOtros.length) return null
    const orden = [...conOtros].sort((a, b) => b.otros - a.otros)
    const fort = orden.slice(0, Math.min(2, orden.length))
    const des = [...orden].reverse().slice(0, Math.min(2, orden.length)).filter((x) => !fort.includes(x))
    const prom = (conOtros.reduce((s, c) => s + c.otros, 0) / conOtros.length).toFixed(1)
    const ciegos = comps.filter((c) => c.gap !== null && c.gap > 0.5)
    const ocultas = comps.filter((c) => c.gap !== null && c.gap < -0.5)
    cuerpo = (
      <>
        <p className="inf-tx"><b>Valoración general:</b> en promedio, el resto de la organización valora a {sujeto} en <b>{prom}/5</b>.</p>
        <p className="inf-tx"><b>Fortalezas percibidas:</b> {listar(fort, 'otros')}.</p>
        {des.length > 0 && <p className="inf-tx"><b>Oportunidades de desarrollo:</b> {listar(des, 'otros')}.</p>}
        <p className="inf-tx"><b>Puntos ciegos:</b> {ciegos.length ? `${sujeto} se percibe mejor de lo que lo ve el resto en ${listar(ciegos, 'gap')}.` : 'no se detectaron brechas marcadas de sobreestimación.'}</p>
        {ocultas.length > 0 && <p className="inf-tx"><b>Fortalezas no reconocidas:</b> el resto valora mejor que su propia autoevaluación en {listar(ocultas, 'gap')}.</p>}
      </>
    )
  } else if (esSino) {
    const conDatos = comps.filter((c) => c.promedio !== null && c.promedio !== undefined)
    if (!conDatos.length) return null
    const prom = Math.round(conDatos.reduce((s, c) => s + c.promedio, 0) / conDatos.length)
    const criticos = (d.preguntas || []).filter((p) => p.cumplimiento < 50)
    cuerpo = (
      <>
        <p className="inf-tx"><b>Cumplimiento general:</b> {sujeto} alcanza un <b>{prom}%</b> de cumplimiento promedio.</p>
        <p className="inf-tx"><b>Puntos críticos:</b> {criticos.length ? `${criticos.length} ítem(s) por debajo del 50% — priorizar: ${criticos.slice(0, 3).map((p) => `“${p.texto}” (${p.cumplimiento}%)`).join(', ')}.` : 'no hay ítems por debajo del 50%.'}</p>
      </>
    )
  } else {
    const conDatos = comps.filter((c) => c.promedio !== null && c.promedio !== undefined)
    if (!conDatos.length) return null
    const orden = [...conDatos].sort((a, b) => b.promedio - a.promedio)
    const prom = (conDatos.reduce((s, c) => s + c.promedio, 0) / conDatos.length).toFixed(1)
    cuerpo = (
      <>
        <p className="inf-tx"><b>Valoración general:</b> {sujeto} promedia <b>{prom}/5</b> según los observadores.</p>
        <p className="inf-tx"><b>Mejor valoradas:</b> {listar(orden.slice(0, 2), 'promedio')}.</p>
        {orden.length > 2 && <p className="inf-tx"><b>A reforzar:</b> {listar([...orden].reverse().slice(0, 2), 'promedio')}.</p>}
      </>
    )
  }

  return (
    <div className="inf-card">
      <h3>Síntesis</h3>
      <div className="sub">Lectura automática de los resultados (cálculo determinista, sin IA).</div>
      {cuerpo}
      <div className="ev-tipo-hint" style={{ marginTop: 10 }}>
        {esSino
          ? 'Cada ítem se valoró como “Cumple” (1) o “No cumple” (0); el % es la proporción de “Cumple”.'
          : 'Escala: 1 Nunca · 2 Rara vez · 3 A veces · 4 Frecuentemente · 5 Siempre.'}
      </div>
    </div>
  )
}

function label(d, rel) { return (d.grupos.find((g) => g.relacion === rel) || {}).label || rel }
function tipoTxt(t) { return t === 'personas_360' ? 'Evaluación 360°' : t === 'areas' ? 'Evaluación de área' : 'Evaluación de proceso' }
