// Informe Eneagrama Profesional. Datos deterministas del motor (dominante/secundario/
// terciario + arquetipo). La IA no interviene.

function Lista({ v }) {
  if (Array.isArray(v)) return <ul className="inf-nolist">{v.map((x, i) => <li key={i}><span className="ok" style={{ color: 'var(--violeta)', fontWeight: 800, flex: 'none' }}>›</span> {x}</li>)}</ul>
  return <p className="inf-tx">{v}</p>
}

function Tipo({ d, tag }) {
  return (
    <div className="inf-sheet"><div className="inf-pad">
      <span className="inf-eyebrow">{tag}</span>
      <h2 className="inf-sec">Eneatipo {d.tipo} · {d.nombre}</h2>
      {d.general && <p className="inf-tx">{d.general}</p>}
      {d.motivacion && <><h3 style={{ fontSize: 14, color: 'var(--violeta)', margin: '14px 0 6px' }}>Motivación central</h3><p className="inf-tx">{d.motivacion}</p></>}
      {d.miedo && <><h3 style={{ fontSize: 14, color: 'var(--violeta)', margin: '14px 0 6px' }}>Temor básico</h3><p className="inf-tx">{d.miedo}</p></>}
      {d.rasgos && <><h3 style={{ fontSize: 14, color: 'var(--violeta)', margin: '14px 0 6px' }}>Rasgos característicos</h3><Lista v={d.rasgos} /></>}
      {d.fortalezas && <><h3 style={{ fontSize: 14, color: 'var(--violeta)', margin: '14px 0 6px' }}>Fortalezas</h3><Lista v={d.fortalezas} /></>}
      {d.areas && <><h3 style={{ fontSize: 14, color: 'var(--violeta)', margin: '14px 0 6px' }}>Áreas de desarrollo</h3><Lista v={d.areas} /></>}
    </div></div>
  )
}

export default function InformeEneagrama({ data }) {
  const d = data.datos || {}
  const ev = data.evaluado
  const marca = data.empresa
  const fecha = data.created_at ? new Date(data.created_at).toLocaleDateString('es-AR') : ''
  const dom = d.dominante || {}
  const sec = d.secundario || {}
  const ter = d.terciario || {}
  const arq = d.arquetipo || {}
  const ranking = d.ranking || []
  const destacados = { [dom.tipo]: 'dom', [sec.tipo]: 'sec', [ter.tipo]: 'ter' }

  return (
    <div className="inf-doc">
      {/* PORTADA */}
      <div className="inf-sheet">
        <div className="inf-cover">
          <div className="top">
            <span className="brand">{marca?.logo_url ? <img className="inf-logo" src={marca.logo_url} alt={marca.razon_social} /> : (marca?.razon_social || 'ONE')}</span>
            <span className="badge">Informe confidencial</span>
          </div>
          <h1>Informe Eneagrama Profesional</h1>
          <div className="st">Perfil de personalidad según los 9 eneatipos</div>
        </div>
        <div className="inf-who">
          <div><div className="k">Evaluado/a</div><div className="v">{ev ? `${ev.nombre} ${ev.apellido}` : '—'}</div></div>
          <div><div className="k">Fecha</div><div className="v">{fecha}</div></div>
          <div><div className="k">Eneatipo dominante</div><div className="v">{dom.tipo} · {dom.nombre}</div></div>
        </div>
      </div>

      {/* RANKING */}
      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Resultado</span>
        <h2 className="inf-sec">Distribución de los 9 eneatipos</h2>
        <p className="inf-tx">Tu configuración combina un eneatipo <b>dominante</b> con un ala <b>secundaria</b> y una <b>terciaria</b>. El resto también aporta matices.</p>
        <div className="bf-bars" style={{ marginTop: 12 }}>
          {ranking.map((t) => {
            const rol = destacados[t.tipo]
            return (
              <div className="bf-bar" key={t.tipo}>
                <label>
                  <span>{t.tipo}. {t.nombre}{rol === 'dom' ? ' · Dominante' : rol === 'sec' ? ' · Secundario' : rol === 'ter' ? ' · Terciario' : ''}</span>
                  <b>{t.porcentaje}%</b>
                </label>
                <div className="bf-track"><i style={{ width: `${t.porcentaje}%`, background: rol ? 'linear-gradient(135deg,#4d248f,#6be1e3)' : '#c6c9d7' }} /></div>
              </div>
            )
          })}
        </div>
      </div></div>

      {/* ARQUETIPO */}
      {(arq.arq || arq.cualidad) && (
        <div className="inf-sheet inf-divider">
          <div className="eb">TU ARQUETIPO</div>
          <h1>{arq.arq || `${dom.nombre} con ala ${sec.tipo}`}</h1>
          {arq.cualidad && <div className="st" style={{ marginTop: 6 }}>{arq.cualidad}</div>}
        </div>
      )}
      {arq.desc && (
        <div className="inf-sheet"><div className="inf-pad">
          <span className="inf-eyebrow">La combinación</span>
          <h2 className="inf-sec">Dominante {dom.tipo} + ala {sec.tipo}</h2>
          <p className="inf-tx">{arq.desc}</p>
          {arq.fortalezas && <><h3 style={{ fontSize: 14, color: 'var(--violeta)', margin: '14px 0 6px' }}>Fortalezas de la combinación</h3><Lista v={arq.fortalezas} /></>}
        </div></div>
      )}

      {/* PERFIL DOMINANTE (detalle) */}
      <Tipo d={dom} tag="Eneatipo dominante" />

      {/* SECUNDARIO Y TERCIARIO (breve) */}
      {sec.tipo && (
        <div className="inf-sheet"><div className="inf-pad">
          <span className="inf-eyebrow">Alas complementarias</span>
          <h2 className="inf-sec">Influencias secundaria y terciaria</h2>
          <div style={{ marginBottom: 14 }}>
            <h3 style={{ fontSize: 14.5, color: 'var(--violeta)', marginBottom: 4 }}>Secundario · Eneatipo {sec.tipo} — {sec.nombre} ({sec.porcentaje}%)</h3>
            <p className="inf-tx">{sec.general}</p>
          </div>
          {ter.tipo && (
            <div>
              <h3 style={{ fontSize: 14.5, color: 'var(--violeta)', marginBottom: 4 }}>Terciario · Eneatipo {ter.tipo} — {ter.nombre} ({ter.porcentaje}%)</h3>
              <p className="inf-tx">{ter.general}</p>
            </div>
          )}
        </div></div>
      )}

      <div className="inf-sheet inf-foot"><b>ONE Core Analytics</b><br />Resultado determinista del cuestionario. Este informe es confidencial.</div>
    </div>
  )
}
