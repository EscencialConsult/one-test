// Loader de marca: el espiral real de ONE (public/espiral-one.png) con un anillo
// exterior que gira. Se usa mientras cargan los datos (evita el "flash" de colores
// por defecto antes de tener la marca de la empresa).
//   <Loader full />        pantalla completa (fondo claro, centrado)
//   <Loader />             en línea (dentro de una card, etc.)

const CSS = `
.one-loader{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:40px}
.one-loader-full{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:#f5f6fb;z-index:50}
.one-spinwrap{position:relative;display:grid;place-items:center}
.one-spiral{display:block;animation:one-pulse 2.6s ease-in-out infinite;filter:drop-shadow(0 4px 12px rgba(120,90,200,.18))}
.one-ring{position:absolute;border-radius:50%;background:conic-gradient(from 0deg,rgba(107,225,227,0) 0deg,#6be1e3 80deg,#7f9fe4 150deg,#9a6fd6 220deg,#d86bc0 300deg,rgba(216,107,192,0) 360deg);-webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 2px),#000 calc(100% - 2px));mask:radial-gradient(farthest-side,transparent calc(100% - 2px),#000 calc(100% - 2px));animation:one-spin 1.1s linear infinite}
.one-loader-lbl{font-size:13px;color:#8a8f9c;font-weight:600;letter-spacing:.2px}
@keyframes one-spin{to{transform:rotate(360deg)}}
@keyframes one-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
@media (prefers-reduced-motion:reduce){.one-ring{animation-duration:2.8s}.one-spiral{animation:none}}
`

export default function Loader({ full = false, label = 'Cargando…', size = 108 }) {
  // El espiral ocupa ~64% del PNG (margen transparente). Metemos el anillo hacia
  // adentro (~9% del tamaño) para que quede cerca del espiral pero con una pequeña
  // separación (no pegado al borde del PNG ni encima del dibujo).
  const ringInset = Math.round(size * 0.09)
  const cuerpo = (
    <div className="one-loader">
      <div className="one-spinwrap" style={{ width: size, height: size }}>
        <span className="one-ring" aria-hidden="true" style={{ inset: `${ringInset}px` }} />
        <img className="one-spiral" src="/espiral-one.png" alt="" width={size} height={size} style={{ width: size, height: size }} />
      </div>
      {label && <span className="one-loader-lbl">{label}</span>}
    </div>
  )
  return (
    <>
      <style>{CSS}</style>
      {full ? <div className="one-loader-full">{cuerpo}</div> : cuerpo}
    </>
  )
}
