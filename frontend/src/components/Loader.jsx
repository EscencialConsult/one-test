// Loader de marca: el espiral de ONE girando. Se usa mientras cargan los datos
// (evita el "flash" de colores por defecto antes de tener la marca de la empresa).
//   <Loader full />        pantalla completa (fondo claro, centrado)
//   <Loader />             en línea (dentro de una card, etc.)

const SPIRAL = 'M 63 60 L 63.51 60.57 L 63.91 61.3 L 64.15 62.16 L 64.2 63.13 L 64.04 64.16 L 63.65 65.21 L 63.01 66.23 L 62.14 67.17 L 61.05 67.97 L 59.75 68.6 L 58.28 69 L 56.67 69.13 L 54.99 68.98 L 53.28 68.5 L 51.59 67.7 L 50.01 66.57 L 48.58 65.12 L 47.36 63.38 L 46.43 61.38 L 45.82 59.17 L 45.59 56.8 L 45.76 54.34 L 46.37 51.86 L 47.41 49.43 L 48.89 47.13 L 50.79 45.05 L 53.07 43.26 L 55.7 41.82 L 58.61 40.81 L 61.73 40.28 L 64.99 40.26 L 68.29 40.79 L 71.55 41.89 L 74.66 43.54 L 77.53 45.73 L 80.06 48.43 L 82.17 51.57 L 83.78 55.1 L 84.82 58.93 L 85.23 62.96 L 84.97 67.09 L 84.03 71.22 L 82.4 75.22 L 80.1 78.98 L 77.16 82.38 L 73.64 85.32 L 69.61 87.7 L 65.17 89.43 L 60.43 90.44 L 55.49 90.67 L 50.49 90.09 L 45.57 88.69 L 40.85 86.48 L 36.48 83.49 L 32.59 79.77 L 29.28 75.4 L 26.69 70.48 L 24.89 65.12 L 23.96 59.45 L 23.96 53.62 L 24.91 47.78 L 26.81 42.07 L 29.65 36.67 L 33.37 31.73 L 37.9 27.38 L 43.14 23.77 L 48.97 21.01 L 55.26 19.19 L 61.85 18.4 L 68.57 18.68 L 75.24 20.05 L 81.69 22.5 L 87.74 26 L 93.22 30.48 L 97.97 35.85 L 101.85 41.99 L 104.73 48.75 L 106.51 55.97 L 107.11 63.48 L 106.5 71.07 L 104.66 78.55 L 101.61 85.72 L 97.41 92.39 L 92.13 98.36'

const CSS = `
.one-loader{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:40px}
.one-loader-full{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:#f5f6fb;z-index:50}
.one-spin{animation:one-spin 1.15s linear infinite;transform-origin:50% 50%;filter:drop-shadow(0 4px 12px rgba(120,90,200,.18))}
.one-loader-lbl{font-size:13px;color:#8a8f9c;font-weight:600;letter-spacing:.2px}
@keyframes one-spin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.one-spin{animation-duration:2.6s}}
`

export default function Loader({ full = false, label = 'Cargando…', size = 78 }) {
  const cuerpo = (
    <div className="one-loader">
      <svg className="one-spin" width={size} height={size} viewBox="0 0 130 118" role="img" aria-label="Cargando">
        <defs>
          <linearGradient id="oneSpiralGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6be1e3" />
            <stop offset="38%" stopColor="#7f9fe4" />
            <stop offset="68%" stopColor="#9a6fd6" />
            <stop offset="100%" stopColor="#d86bc0" />
          </linearGradient>
        </defs>
        <path d={SPIRAL} fill="none" stroke="url(#oneSpiralGrad)" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
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
