// Informe Bar-On EQ-i — versión PRELIMINAR (data-driven).
// El diseño/contenido definitivo se ajustará con el material de referencia del test.

function kind(nivel) {
  const n = (nivel || '').toUpperCase().replace(/_/g, ' ')
  if (n.includes('ALTO') || n.includes('ALTA')) return 'alto'
  if (n.includes('PROMEDIO') || n.includes('MEDIO')) return 'medio'
  return 'bajo'
}
const fmtNivel = (n) => (n || '').replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase())

export default function InformeBaronEQi({ data }) {
  const d = data.datos || {}
  const ce = d.ceTotal || {}
  const compuestas = Object.values(d.compuestas || {})
  const subescalas = Object.values(d.subescalas || {})
  const fortalezas = d.fortalezas || []
  const debilidades = d.debilidades || []
  const ev = data.evaluado
  const marca = data.empresa
  const fecha = data.created_at ? new Date(data.created_at).toLocaleDateString('es-AR') : ''

  return (
    <div className="inf-doc">
      {/* Portada */}
      <div className="inf-sheet">
        <div className="inf-cover">
          <div className="top">
            <span className="brand">{marca?.logo_url ? <img className="inf-logo" src={marca.logo_url} alt={marca.razon_social} /> : (marca?.razon_social || 'ONE')}</span>
            <span className="badge">Informe preliminar</span>
          </div>
          <h1>Informe Bar-On EQ-i</h1>
          <div className="st">Inventario de Inteligencia Emocional · 15 subescalas</div>
        </div>
        <div className="inf-who">
          <div><div className="k">Evaluado/a</div><div className="v">{ev ? `${ev.nombre} ${ev.apellido}` : '—'}</div></div>
          <div><div className="k">Fecha</div><div className="v">{fecha}</div></div>
          <div><div className="k">Cociente Emocional</div><div className={'v pin-' + kind(ce.nivel)}>{fmtNivel(ce.nivel)}</div></div>
        </div>
      </div>

      {/* Aviso preliminar */}
      <div className="inf-sheet"><div className="inf-pad" style={{ paddingTop: 22, paddingBottom: 22 }}>
        <div className="inf-draft">⚠ Informe <b>preliminar de prueba</b>: muestra los datos reales calculados, pero el formato y los textos definitivos se ajustarán con el material de referencia del Bar-On EQ-i.</div>
      </div></div>

      {/* CE Total */}
      <div className="inf-sheet"><div className="inf-pad">
        <h2 className="inf-sec">Cociente Emocional Total</h2>
        <div className="inf-global">
          <div className="lbl">Resultado global</div>
          <div className="num">{ce.porcentaje != null ? `${ce.porcentaje}%` : '—'}</div>
          <div className={'nivel lvl-' + kind(ce.nivel)}>{fmtNivel(ce.nivel)}</div>
          {ce.interpretacion && <p>{ce.interpretacion}</p>}
        </div>
      </div></div>

      {/* Componentes */}
      <div className="inf-sheet"><div className="inf-pad">
        <h2 className="inf-sec">Componentes (5 áreas)</h2>
        {compuestas.map((c) => (
          <div className="inf-card" key={c.nombre}>
            <div className="ah"><b>{c.nombre}</b><span className="pc">{c.porcentaje}%</span></div>
            <div className="desc">{c.descripcion}</div>
            <div className="track"><i className={'fl-' + kind(c.nivel)} style={{ width: `${c.porcentaje}%` }} /></div>
            {c.interpretacion?.general && <p className="g">{c.interpretacion.general}</p>}
          </div>
        ))}
      </div></div>

      {/* Subescalas */}
      <div className="inf-sheet"><div className="inf-pad">
        <h2 className="inf-sec">Detalle por subescala (15)</h2>
        <div className="inf-bars">
          {subescalas.map((s) => (
            <div className="inf-row" key={s.nombre}>
              <div className="nm">
                <div className="t">{s.nombre}</div>
                <div className="track"><i className={'fl-' + kind(s.nivel)} style={{ width: `${s.porcentaje}%` }} /></div>
              </div>
              <div className="pd"><b>{s.porcentaje}%</b> · {fmtNivel(s.nivel)}</div>
            </div>
          ))}
        </div>
      </div></div>

      {/* Fortalezas / Debilidades */}
      <div className="inf-sheet"><div className="inf-pad">
        <h2 className="inf-sec">Fortalezas y áreas a desarrollar</h2>
        <div className="inf-two">
          <div>
            <div className="inf-h3 pin-alto">Fortalezas</div>
            <ul className="inf-list">
              {fortalezas.map((f) => (
                <li key={f.codigo}>{f.nombre}<span className={'pct pin-' + kind(f.nivel)}>{f.porcentaje}%</span></li>
              ))}
            </ul>
          </div>
          <div>
            <div className="inf-h3 pin-bajo">Áreas a desarrollar</div>
            <ul className="inf-list">
              {debilidades.map((f) => (
                <li key={f.codigo}>{f.nombre}<span className={'pct pin-' + kind(f.nivel)}>{f.porcentaje}%</span></li>
              ))}
            </ul>
          </div>
        </div>
      </div>
        <div className="inf-foot">
          <b>{marca?.razon_social || 'ONE'}</b>
          <div>Informe confidencial — uso exclusivo de la empresa · generado por PACK ONE MATCH</div>
        </div>
      </div>
    </div>
  )
}
