// Gráficos ESTÁTICOS en SVG (radar y dona), sin dependencias. Se renderizan de forma
// sincrónica, por eso html2canvas los captura bien en el PDF (a diferencia de Recharts +
// ResponsiveContainer, que se mide async y deja páginas en blanco / gráficos vacíos).

const polar = (cx, cy, r, angleDeg) => {
  const a = ((angleDeg - 90) * Math.PI) / 180
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)]
}
const short = (s) => (s && s.length > 14 ? s.split(' ')[0] : s)

// Radar de N ejes con valores 0-100. Una sola serie (color de la marca).
export function RadarSVG({ data, color = '#4d248f', size = 300 }) {
  const cx = size / 2
  const cy = size / 2
  const R = size * 0.30
  const n = data.length || 1
  const step = 360 / n
  const clamp = (v) => Math.max(0, Math.min(1, (v || 0) / 100))
  const ptsAt = (f) => data.map((_, i) => polar(cx, cy, R * f, i * step).join(',')).join(' ')
  const valPts = data.map((d, i) => polar(cx, cy, R * clamp(d.value), i * step).join(',')).join(' ')
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" style={{ maxWidth: size, display: 'block', margin: '0 auto' }}>
      {[0.25, 0.5, 0.75, 1].map((f, k) => (
        <polygon key={k} points={ptsAt(f)} fill="none" stroke="#e6e7ee" strokeWidth="1" />
      ))}
      {data.map((_, i) => {
        const [x, y] = polar(cx, cy, R, i * step)
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#e6e7ee" strokeWidth="1" />
      })}
      <polygon points={valPts} fill={color} fillOpacity="0.24" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      {data.map((d, i) => {
        const [x, y] = polar(cx, cy, R * clamp(d.value), i * step)
        return <circle key={i} cx={x} cy={y} r="2.8" fill={color} />
      })}
      {data.map((d, i) => {
        const [x, y] = polar(cx, cy, R + 14, i * step)
        const anchor = Math.abs(x - cx) < 6 ? 'middle' : x > cx ? 'start' : 'end'
        return (
          <text key={i} x={x} y={y} fontSize="10" fill="#555" textAnchor={anchor} dominantBaseline="middle">
            {short(d.label)}
          </text>
        )
      })}
    </svg>
  )
}

function arcPath(cx, cy, rO, rI, a0, a1) {
  const [x1, y1] = polar(cx, cy, rO, a0)
  const [x2, y2] = polar(cx, cy, rO, a1)
  const [x3, y3] = polar(cx, cy, rI, a1)
  const [x4, y4] = polar(cx, cy, rI, a0)
  const large = a1 - a0 > 180 ? 1 : 0
  return `M ${x1} ${y1} A ${rO} ${rO} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${rI} ${rI} 0 ${large} 0 ${x4} ${y4} Z`
}

// Dona: data = [{ name, value, color }]. Leyenda con valores (identidad no sólo por color).
export function DonutSVG({ data, size = 220 }) {
  const items = (data || []).filter((d) => d.value > 0)
  const total = items.reduce((s, d) => s + d.value, 0) || 1
  const cx = size / 2
  const cy = size / 2
  const rO = size * 0.42
  const rI = size * 0.26
  const gap = items.length > 1 ? 3 : 0
  let ang = 0
  const segs = items.map((d) => {
    const sweep = Math.min((d.value / total) * 360, 359.99)
    const path = arcPath(cx, cy, rO, rI, ang + gap / 2, ang + sweep - gap / 2)
    ang += sweep
    return { path, color: d.color }
  })
  return (
    <div>
      <svg viewBox={`0 0 ${size} ${size}`} width="100%" style={{ maxWidth: size, display: 'block', margin: '0 auto' }}>
        {segs.map((s, i) => <path key={i} d={s.path} fill={s.color} />)}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap', marginTop: 8 }}>
        {items.map((d) => (
          <span key={d.name} style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <i style={{ width: 10, height: 10, borderRadius: 3, background: d.color, display: 'inline-block' }} /> {d.name}: <b>{d.value}</b>
          </span>
        ))}
      </div>
    </div>
  )
}
