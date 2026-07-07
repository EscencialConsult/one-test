// Informe Toulouse-Piéron (atención y percepción). Datos deterministas del motor:
// aciertos/errores/omisiones REALES (comparación marca vs objetivo), niveles, perfil
// y distribución por segmentos. Sin IA.

function Lista({ v }) {
  if (!Array.isArray(v)) return v ? <p className="inf-tx">{v}</p> : null
  return <ul className="inf-nolist">{v.map((x, i) => <li key={i}><span style={{ color: 'var(--violeta)', fontWeight: 800, flex: 'none' }}>›</span> {x}</li>)}</ul>
}

function mmss(s) {
  if (s == null) return '—'
  const m = Math.floor(s / 60), r = s % 60
  return `${m}:${String(r).padStart(2, '0')}`
}

function Kpi({ n, l, color }) {
  return (
    <div style={{ flex: '1 1 120px', textAlign: 'center', background: '#f9fafb', border: '1px solid #e6e7ee', borderRadius: 12, padding: '14px 10px' }}>
      <div style={{ fontSize: 30, fontWeight: 800, color: color || 'var(--violeta)', lineHeight: 1 }}>{n}</div>
      <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, marginTop: 4 }}>{l}</div>
    </div>
  )
}

function Nivel({ titulo, d }) {
  return (
    <div style={{ flex: '1 1 200px', background: '#f9fafb', border: '1px solid #e6e7ee', borderRadius: 12, padding: '14px 16px' }}>
      <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--muted)' }}>{titulo}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--violeta)', margin: '3px 0 2px' }}>{d?.nivel || '—'}</div>
      <div style={{ fontSize: 12.5, color: '#555' }}>{d?.descripcion}{d?.percentil != null ? ` · pc ${d.percentil}` : ''}</div>
    </div>
  )
}

export default function InformeToulouse({ data }) {
  const d = data.datos || {}
  const ev = data.evaluado
  const marca = data.empresa
  const fecha = data.created_at ? new Date(data.created_at).toLocaleDateString('es-AR') : ''
  const perfil = d.perfil || {}
  const seg = d.analisisPorSegmentos || []
  const maxDens = Math.max(1, ...seg.map((s) => parseFloat(s.densidad) || 0))

  return (
    <div className="inf-doc">
      {/* PORTADA */}
      <div className="inf-sheet">
        <div className="inf-cover">
          <div className="top">
            <span className="brand">{marca?.logo_url ? <img className="inf-logo" src={marca.logo_url} alt={marca.razon_social} /> : (marca?.razon_social || 'ONE')}</span>
            <span className="badge">Informe confidencial</span>
          </div>
          <h1>Informe Toulouse-Piéron</h1>
          <div className="st">Atención sostenida, concentración y rapidez perceptiva</div>
        </div>
        <div className="inf-who">
          <div><div className="k">Evaluado/a</div><div className="v">{ev ? `${ev.nombre} ${ev.apellido}` : '—'}</div></div>
          <div><div className="k">Fecha</div><div className="v">{fecha}</div></div>
          <div><div className="k">Perfil</div><div className="v">{perfil.nombre || d.nivelAtencion?.nivel || '—'}</div></div>
        </div>
      </div>

      {/* MÉTRICAS PRINCIPALES */}
      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Resultados</span>
        <h2 className="inf-sec">Desempeño</h2>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Kpi n={d.aciertos} l="Aciertos" color="#0f9d6b" />
          <Kpi n={d.errores} l="Errores" color="#c0392b" />
          <Kpi n={d.omisiones} l="Omisiones" color="#9a7d1a" />
          <Kpi n={d.totalProcesado} l="Cuadrados recorridos" />
          <Kpi n={mmss(d.tiempoSegundos)} l="Tiempo" />
        </div>
        <p className="inf-tx" style={{ marginTop: 14 }}>
          Marcó <b>{d.totalMarcados}</b> cuadrados y recorrió <b>{d.totalProcesado}</b> de {1600} ({Math.round(d.porcentajeCompletado || 0)}%). De los objetivos reales presentes ({d.objetivosTotal}), detectó correctamente <b>{d.aciertos}</b>.
        </p>
        {d.tieneObjetivos === false && <div className="inf-callout">Nota: este resultado usa una estimación (no se registraron los objetivos reales de la grilla).</div>}
      </div></div>

      {/* NIVELES */}
      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Clasificación</span>
        <h2 className="inf-sec">Niveles</h2>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Nivel titulo="Atención" d={d.nivelAtencion} />
          <Nivel titulo="Precisión" d={d.nivelPrecision} />
          <Nivel titulo="Velocidad" d={d.nivelVelocidad} />
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
          <Kpi n={d.indiceProductividad} l="Índice de productividad (A − E)" />
          <Kpi n={d.coeficienteAptitud} l="Coeficiente de aptitud (A − E/2)" />
          <Kpi n={`${Math.round(d.indiceAciertos || 0)}%`} l="Índice de aciertos" />
        </div>
      </div></div>

      {/* PERFIL */}
      {(perfil.interpretacion || perfil.fortalezas) && (
        <div className="inf-sheet"><div className="inf-pad">
          <span className="inf-eyebrow">Interpretación</span>
          <h2 className="inf-sec">{perfil.nombre || 'Perfil de desempeño'}</h2>
          {perfil.interpretacion && <p className="inf-tx">{perfil.interpretacion}</p>}
          {perfil.fortalezas && <><h3 style={{ fontSize: 14, color: 'var(--violeta)', margin: '14px 0 6px' }}>Fortalezas</h3><Lista v={perfil.fortalezas} /></>}
          {perfil.recomendaciones && <><h3 style={{ fontSize: 14, color: 'var(--violeta)', margin: '14px 0 6px' }}>Recomendaciones</h3><Lista v={perfil.recomendaciones} /></>}
        </div></div>
      )}

      {/* DISTRIBUCIÓN POR SEGMENTOS */}
      {seg.length > 0 && (
        <div className="inf-sheet"><div className="inf-pad">
          <span className="inf-eyebrow">Constancia</span>
          <h2 className="inf-sec">Distribución del trabajo por zonas</h2>
          <p className="inf-tx">Densidad de marcas en cada décimo de la grilla (de principio a fin). Una caída marcada hacia el final puede indicar fatiga atencional.</p>
          <div className="bf-bars" style={{ marginTop: 12 }}>
            {seg.map((s) => {
              const dens = parseFloat(s.densidad) || 0
              return (
                <div className="bf-bar" key={s.segmento}>
                  <label><span>Zona {s.segmento}</span><b>{s.cantidad} marcas</b></label>
                  <div className="bf-track"><i style={{ width: `${(dens / maxDens) * 100}%`, background: 'linear-gradient(135deg,#4d248f,#6be1e3)' }} /></div>
                </div>
              )
            })}
          </div>
        </div></div>
      )}

      {/* SOBRE EL TEST */}
      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Ficha técnica</span>
        <h2 className="inf-sec">Sobre el Test de Toulouse-Piéron</h2>
        <p className="inf-tx">Prueba psicométrica y perceptiva diseñada para evaluar la <b>atención sostenida</b>, la <b>concentración</b> y la <b>rapidez de procesamiento visual</b>. Presenta una matriz de <b>1.600 cuadrados</b> de distintos tipos; al inicio se indican dos cuadrados de referencia y la tarea es marcar, en <b>10 minutos</b>, todos los cuadrados idénticos a los de referencia, discriminándolos de los distractores. Es una prueba de alta exigencia en precisión.</p>
        <h3 style={{ fontSize: 14, color: 'var(--violeta)', margin: '12px 0 6px' }}>Cómo se interpreta</h3>
        <p className="inf-tx" style={{ margin: '0 0 6px' }}>A partir de las <b>puntuaciones directas</b> —Total Procesado, desglosado en <b>Aciertos</b>, <b>Errores</b> (marcas que no eran de referencia) y <b>Omisiones</b> (referencias pasadas por alto)— se obtienen tres baremos:</p>
        <ul className="inf-nolist">
          <li><span style={{ color: 'var(--violeta)', fontWeight: 800, flex: 'none' }}>›</span> <b>Atención</b> (según aciertos): de Muy Bajo a Muy Alto.</li>
          <li><span style={{ color: 'var(--violeta)', fontWeight: 800, flex: 'none' }}>›</span> <b>Precisión</b> (según errores): de Muy Baja a Excelente.</li>
          <li><span style={{ color: 'var(--violeta)', fontWeight: 800, flex: 'none' }}>›</span> <b>Velocidad</b> (según total procesado): de Muy Lento a Muy Rápido.</li>
        </ul>
        <p className="inf-tx" style={{ marginTop: 8 }}>El cruce de estos tres baremos define el <b>perfil de desempeño</b>: Atento y Preciso, Lento y Preciso, Intermedio, Rápido e Impulsivo o Disperso.</p>
        <div className="ee-note" style={{ marginTop: 10 }}><b>Qué NO es:</b> no es un test de inteligencia general ni mide el coeficiente intelectual (CI); sólo evalúa la concentración visual focalizada frente a estímulos repetitivos. Un perfil <b>Disperso</b> o con <b>dificultades severas de atención</b> <b>no</b> constituye un diagnóstico (por ejemplo, TDAH): ante resultados atípicos se requiere una <b>evaluación neuropsicológica complementaria</b>.</div>
      </div></div>

      <div className="inf-sheet inf-foot"><b>ONE Core Analytics</b><br />Cálculo determinista por comparación real de marcas contra los objetivos. Informe confidencial.</div>
    </div>
  )
}
