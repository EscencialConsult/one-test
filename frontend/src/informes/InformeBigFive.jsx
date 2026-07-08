// Informe Big Five (IPIP-50) — data-driven, replicando la maqueta aprobada.
// Parte I: educativa (estática). Parte II: perfil real desde Resultado.datos.
import {
  Cell, Legend, Pie, PieChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis,
  Radar, RadarChart, ResponsiveContainer, Tooltip,
} from 'recharts'

const iniciales = (ev) => ((ev?.nombre?.[0] || '') + (ev?.apellido?.[0] || '')).toUpperCase() || 'EV'
const w = (n, max) => `${Math.max(0, Math.min(100, (n / max) * 100))}%`

// Tarjeta KPI (stat tile) — magnitud/estado de un vistazo, sin gráfico.
function Kpi({ label, valor, sub, color }) {
  return (
    <div style={{ background: '#f9fafb', border: '1px solid #e6e7ee', borderRadius: 12, padding: '12px 14px' }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: '#8a8f9c' }}>{label}</div>
      <div style={{ fontSize: 17, fontWeight: 800, lineHeight: 1.15, marginTop: 3, color: color || 'var(--violeta)' }}>{valor || '—'}</div>
      {sub && <div style={{ fontSize: 11, color: '#a4a8c0', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}
const chartBox = { minWidth: 0 } // min-width:0 permite que ResponsiveContainer no desborde en el grid
const chartTitle = { fontSize: 13, color: 'var(--violeta)', margin: '0 0 6px', fontWeight: 700 }

export default function InformeBigFive({ data }) {
  const d = data.datos || {}
  const dims = Object.values(d.dimensiones || {})
  const ev = data.evaluado
  const marca = data.empresa
  const fecha = data.created_at ? new Date(data.created_at).toLocaleDateString('es-AR') : ''

  const ordenadas = [...dims].sort((a, b) => b.percentil - a.percentil)
  const dominante = ordenadas[0]
  const altas = ordenadas.slice(0, 2)
  const bajas = ordenadas.slice(-2)
  const fortSint = altas.flatMap((x) => (x.fortalezas || []).slice(0, 2))
  const devSint = bajas.flatMap((x) => (x.areas || []).slice(0, 2))
  const nombreEv = ev ? `${ev.nombre} ${ev.apellido}` : 'la persona evaluada'

  // Datos para el panorama (dashboard) con los colores de la empresa.
  const acento = marca?.color_acento || '#4d248f'
  const radarData = dims.map((x) => ({ dim: x.nombre, percentil: x.percentil }))
  const nivelDe = (p) => (p >= 50 ? 'Alto' : p >= 40 ? 'Medio' : 'Bajo')
  const NIVCOL = { Alto: '#16a34a', Medio: '#d97706', Bajo: '#dc2626' }
  const nivCount = { Alto: 0, Medio: 0, Bajo: 0 }
  dims.forEach((x) => { nivCount[nivelDe(x.percentil)] += 1 })
  const nivelData = ['Alto', 'Medio', 'Bajo'].map((n) => ({ name: n, value: nivCount[n], color: NIVCOL[n] })).filter((x) => x.value > 0)
  const nAltas = dims.filter((x) => x.percentil >= 50).length
  const nBajas = dims.filter((x) => x.percentil < 40).length

  return (
    <div className="inf-doc">
      {/* PORTADA */}
      <div className="inf-sheet">
        <div className="inf-cover">
          <div className="top"><span className="brand">{marca?.logo_url ? <img className="inf-logo" src={marca.logo_url} alt={marca.razon_social} /> : (marca?.razon_social || 'ONE')}</span><span className="badge">Informe confidencial</span></div>
          <h1>Perfil de Personalidad</h1>
          <div className="st">Test Big Five (IPIP-50)</div>
        </div>
        <div className="inf-who">
          <div><div className="k">Evaluado/a</div><div className="v">{ev ? `${ev.nombre} ${ev.apellido}` : '—'}</div></div>
          <div><div className="k">Fecha</div><div className="v">{fecha}</div></div>
          {dominante && <div><div className="k">Rasgo dominante</div><div className="v" style={{ color: 'var(--violeta)' }}>{dominante.nombre} · P{dominante.percentil}</div></div>}
        </div>
      </div>

      {/* ===== PARTE I (educativa) ===== */}
      <div className="inf-sheet inf-divider"><div className="eb">PARTE I</div><h1>Comprendiendo el modelo Big Five</h1></div>

      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Sección 1</span>
        <h2 className="inf-sec">¿Qué es el Test Big Five (IPIP-50)?</h2>
        <p className="inf-tx">El modelo Big Five es un inventario de personalidad que evalúa las tendencias conductuales y emocionales de un individuo a través de cinco dimensiones fundamentales: Apertura a la Experiencia, Responsabilidad, Extraversión, Amabilidad y Neuroticismo. Estas dimensiones se consideran los pilares básicos de la personalidad humana y han demostrado ser consistentes a través de diferentes culturas e idiomas.</p>
        <p className="inf-tx">La herramienta se estructura mediante 50 preguntas (10 por dimensión), respondidas con una escala Likert de 5 puntos; los resultados se calculan y visualizan con percentiles poblacionales.</p>
      </div></div>

      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Sección 2</span>
        <h2 className="inf-sec">Historia y fundamentos</h2>
        <p className="inf-tx">El marco del Big Five es uno de los enfoques más validados científicamente en el estudio de la personalidad. Esta versión usa el IPIP-50 (International Personality Item Pool), un inventario de dominio público implementado en más de 1.000 estudios académicos.</p>
        <p className="inf-tx">Destaca por su alta consistencia interna (Alfa de Cronbach entre 0.77 y 0.86). Para evitar sesgos, el 50% de los ítems están formulados de manera invertida y el orden se aleatoriza por bloques en cada evaluación.</p>
      </div></div>

      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Sección 3</span>
        <h2 className="inf-sec">Las cinco dimensiones</h2>
        <p className="inf-tx">Cada dimensión es un continuo entre dos polos. Ninguno es “mejor”: cada extremo aporta fortalezas y desafíos según el rol y el contexto.</p>
        <table className="inf-table">
          <thead><tr><th>Dimensión</th><th>Puntuación alta</th><th>Puntuación baja</th></tr></thead>
          <tbody>
            <tr><td><span className="dn">Extraversión</span></td><td>Sociable, enérgico/a, asertivo/a.</td><td>Reservado/a, reflexivo/a; foco.</td></tr>
            <tr><td><span className="dn">Amabilidad</span></td><td>Empático/a, cooperativo/a, confiable.</td><td>Directo/a, objetivo/a; prioriza la tarea.</td></tr>
            <tr><td><span className="dn">Responsabilidad</span></td><td>Organizado/a, disciplinado/a.</td><td>Flexible, espontáneo/a.</td></tr>
            <tr><td><span className="dn">Neuroticismo</span></td><td>Sensible al estrés; emociones intensas.</td><td>Calmado/a, resiliente.</td></tr>
            <tr><td><span className="dn">Apertura</span></td><td>Curioso/a, creativo/a.</td><td>Práctico/a, convencional.</td></tr>
          </tbody>
        </table>
      </div></div>

      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Sección 4</span>
        <h2 className="inf-sec">Qué NO es (y cómo evitar malos usos)</h2>
        <ul className="inf-nolist">
          <li><span className="xx">✕</span><span><b>No establece un juicio de valor</b>: no hay respuestas “buenas” o “malas”; cada nivel tiene fortalezas y áreas de atención según el contexto.</span></li>
          <li><span className="xx">✕</span><span><b>No es un diagnóstico clínico definitivo</b>: los resultados pueden verse influenciados por el estado emocional y el contexto de la evaluación.</span></li>
          <li><span className="xx">✕</span><span><b>No debe usarse como veredicto aislado</b>: conviene integrarlo en un proceso más amplio y complementarlo con el criterio de un profesional.</span></li>
        </ul>
        <div className="inf-callout"><b>En resumen:</b> los percentiles describen la posición relativa en la población, no capacidad ni valor personal.</div>
      </div></div>

      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Sección 5</span>
        <h2 className="inf-sec">Cómo se calcula el resultado</h2>
        <p className="inf-tx">Cada dimensión obtiene una <b>puntuación directa</b> (10 a 50) que se transforma en <b>percentil</b> comparándola con una norma poblacional.</p>
        <table className="inf-table">
          <thead><tr><th>Percentil</th><th>Nivel</th></tr></thead>
          <tbody>
            <tr><td>90–100</td><td>Muy Alto</td></tr>
            <tr><td>75–89</td><td>Alto</td></tr>
            <tr><td>50–74</td><td>Moderadamente Alto</td></tr>
            <tr><td>40–49</td><td>Promedio</td></tr>
            <tr><td>25–39</td><td>Bajo</td></tr>
            <tr><td>0–24</td><td>Muy Bajo</td></tr>
          </tbody>
        </table>
        <div className="inf-callout"><b>Cálculo exacto y sin IA:</b> los puntajes y percentiles se calculan de forma determinista a partir de las respuestas.</div>
      </div></div>

      {/* ===== PARTE II (perfil real) ===== */}
      <div className="inf-sheet inf-divider"><div className="eb">PARTE II</div><h1>Perfil personalizado</h1></div>

      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Sección 1</span>
        <h2 className="inf-sec">Resumen ejecutivo</h2>
        {dominante && (
          <>
            <div className="bf-phead">
              <div className="big">{iniciales(ev)}</div>
              <div><h3>Rasgo dominante: {dominante.nombre}</h3><div className="tg">Percentil {dominante.percentil} · nivel {dominante.nombre_nivel}</div></div>
            </div>
            <p className="inf-tx">El perfil de {nombreEv} muestra <b>{dominante.nombre}</b> como su característica más destacada (percentil {dominante.percentil}). {dominante.descripcion}</p>
          </>
        )}
      </div></div>

      {/* ===== PANORAMA (dashboard) ===== */}
      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Sección 2</span>
        <h2 className="inf-sec">Panorama del perfil</h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, margin: '2px 0 18px' }}>
          <Kpi label="Rasgo dominante" valor={dominante?.nombre} sub={`Percentil ${dominante?.percentil}`} color={acento} />
          <Kpi label="Nivel" valor={dominante?.nombre_nivel} color={acento} />
          <Kpi label="Rasgos altos" valor={String(nAltas)} sub="percentil ≥ 50" color="#16a34a" />
          <Kpi label="A desarrollar" valor={String(nBajas)} sub="percentil < 40" color="#d97706" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 18 }}>
          <div style={chartBox}>
            <h4 style={chartTitle}>Perfil por dimensión (percentil 0–100)</h4>
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={radarData} outerRadius="70%">
                <PolarGrid stroke="#e6e7ee" />
                <PolarAngleAxis dataKey="dim" tick={{ fontSize: 10.5, fill: '#6b6b76' }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#a4a8c0' }} />
                <Radar name={nombreEv} dataKey="percentil" stroke={acento} fill={acento} fillOpacity={0.28} isAnimationActive={false} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div style={chartBox}>
            <h4 style={chartTitle}>Dimensiones por nivel</h4>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={nivelData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={54} outerRadius={88} paddingAngle={2} isAnimationActive={false} label={(e) => `${e.name}: ${e.value}`}>
                  {nivelData.map((x) => <Cell key={x.name} fill={x.color} />)}
                </Pie>
                <Tooltip /><Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <p className="inf-tx" style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>El <b>percentil</b> compara a {nombreEv} con la población de referencia (50 = promedio). La dona resume cuántas de las 5 dimensiones caen en cada nivel.</p>
      </div></div>

      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Sección 3</span>
        <h2 className="inf-sec">Análisis por dimensión</h2>
        {ordenadas.map((x) => (
          <div className="bf-dim" key={x.nombre}>
            <div className="bf-dh"><b>{x.nombre}</b><span className={'bf-lvl ' + x.nivel}>{(x.nombre_nivel || '').toUpperCase()}</span></div>
            <div className="bf-dh bf-meta">Percentil {x.percentil} · Puntuación {x.puntuacion} / 50</div>
            <div className="bf-dscore"><i style={{ width: w(x.puntuacion, 50) }} /></div>
            <p className="bf-desc">{x.descripcion}</p>
            <div className="bf-two">
              <div className="bf-two fort"><h4>Fortalezas</h4><ul>{(x.fortalezas || []).map((f, i) => <li key={i}>{f}</li>)}</ul></div>
              <div className="bf-two area"><h4>Áreas de atención</h4><ul>{(x.areas || []).map((a, i) => <li key={i}>{a}</li>)}</ul></div>
            </div>
            {x.profesional && <div className="bf-prof"><b>Implicaciones profesionales:</b> {x.profesional}</div>}
          </div>
        ))}
      </div></div>

      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Sección 4</span>
        <h2 className="inf-sec">Síntesis de fortalezas y desarrollo</h2>
        <div className="bf-two">
          <div><h4 style={{ color: '#178a8f', fontSize: 12, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 10 }}>Principales fortalezas</h4>
            <ul className="inf-nolist">{fortSint.map((f, i) => <li key={i}><span style={{ color: '#178a8f', fontWeight: 800 }}>✓</span><span>{f}</span></li>)}</ul>
          </div>
          <div><h4 style={{ color: '#c98a1a', fontSize: 12, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 10 }}>Oportunidades de desarrollo</h4>
            <ul className="inf-nolist">{devSint.map((a, i) => <li key={i}><span style={{ color: '#c98a1a', fontWeight: 800 }}>•</span><span>{a}</span></li>)}</ul>
          </div>
        </div>
        <div className="inf-callout" style={{ marginTop: 18 }}><b>Nota:</b> este informe es una evaluación estandarizada, parte de un proceso más amplio de autoconocimiento. Conviene complementarlo con otras herramientas y la guía de un profesional.</div>
      </div>
        <div className="inf-foot">
          <b>{marca?.razon_social || 'ONE'}</b>
          <div>Informe confidencial — uso exclusivo de la empresa · generado por ONE Core Analytics</div>
        </div>
      </div>
    </div>
  )
}
