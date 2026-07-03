import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Plexus from '../Plexus.jsx'
import './landing.css'

// Nombre del producto (a definir; el logo ONE queda fijo). Cambiar solo acá.
const PRODUCTO = 'ONE Core Analytics'
const EMPRESA = 'Escencial Consultora'

const Ico = ({ id, className = 'lp-ico' }) => (
  <svg className={className}><use href={`#${id}`} /></svg>
)

export default function Landing() {
  const navigate = useNavigate()
  const irLogin = () => navigate('/login')
  const irEvaluado = () => navigate('/evaluado')
  const irAcceso = () => document.getElementById('acceso')?.scrollIntoView({ behavior: 'smooth', block: 'center' })

  return (
    <div className="lp">
      {/* Fondo */}
      <div className="bg"><div className="blob a" /><div className="blob b" /><div className="blob c" /></div>
      <div className="veil" />
      <Plexus />

      {/* Sprite de íconos */}
      <svg width="0" height="0" style={{ position: 'absolute' }}><defs>
        <g id="i-user"><circle cx="12" cy="8" r="4" /><path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" /></g>
        <g id="i-brief"><rect x="3" y="7.5" width="18" height="12.5" rx="2.2" /><path d="M8.5 7.5V5.8A1.8 1.8 0 0 1 10.3 4h3.4a1.8 1.8 0 0 1 1.8 1.8v1.7" /><path d="M3 12.5h18" /></g>
        <g id="i-arrow"><path d="M5 12h13" /><path d="M12.5 6l6 6-6 6" /></g>
        <g id="i-lock"><rect x="4.5" y="10.5" width="15" height="9.5" rx="2.2" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /></g>
        <g id="i-chart"><path d="M4 20V4" /><path d="M4 20h16" /><path d="M8 20v-6" /><path d="M13 20v-9" /><path d="M18 20v-4" /></g>
        <g id="i-shield"><path d="M12 3.5l7.5 2.8v5.2c0 4.6-3.2 7.4-7.5 8.5-4.3-1.1-7.5-3.9-7.5-8.5V6.3z" /></g>
        <g id="i-mail"><rect x="3.5" y="5.5" width="17" height="13" rx="2.2" /><path d="M4 7l8 6 8-6" /></g>
        <g id="i-clip"><rect x="6" y="4" width="12" height="17" rx="2" /><rect x="9" y="2.6" width="6" height="3.4" rx="1.2" /><path d="M9 11h6M9 15h5" /></g>
        <g id="i-spark"><path d="M12 3v5M12 16v5M3 12h5M16 12h5M6.5 6.5l3 3M14.5 14.5l3 3M17.5 6.5l-3 3M9.5 14.5l-3 3" /></g>
        <g id="i-target"><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3.4" /></g>
        <g id="i-users"><circle cx="9" cy="8" r="3.2" /><path d="M3 19c0-3 2.7-5 6-5s6 2 6 5" /><path d="M16 5.3a3.2 3.2 0 0 1 0 6" /><path d="M21 19c0-2.3-1.6-4-4-4.6" /></g>
        <g id="i-doc"><path d="M7 3h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" /><path d="M14 3v4h4" /><path d="M9 13h6M9 17h5" /></g>
        <g id="i-send"><path d="M21 4L3 11l6 2.5L11.5 20 21 4z" /><path d="M9 13.5L21 4" /></g>
        <g id="i-pencil"><path d="M4 20l4-1L19 8l-3-3L5 16l-1 4z" /><path d="M14.5 6.5l3 3" /></g>
        <g id="i-calc"><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M8 7h8" /><path d="M8.5 11h.01M12 11h.01M15.5 11h.01M8.5 15h.01M12 15h.01M15.5 15h.01" /></g>
        <g id="i-check"><path d="M5 12.5l4.5 4.5L19 7" /></g>
      </defs></svg>

      {/* NAV */}
      <nav className="lp-nav"><div className="lp-wrap lp-navin">
        <div className="lp-brand"><span className="one-brand"><img className="one-logo" src="/logo.png" alt="ONE" /><span className="one-sub">Core Analytics</span></span></div>
        <div className="lp-links">
          <a href="#plataforma">Plataforma</a><a href="#evaluaciones">Evaluaciones</a>
          <a href="#como">Cómo funciona</a><a href="#contacto">Contacto</a>
        </div>
        <button className="lp-btn ghost" onClick={irAcceso}>Acceder</button>
      </div></nav>

      {/* HERO */}
      <header className="lp-hero"><div className="lp-wrap">
        <span className="lp-eyebrow"><span className="dot" /> Plataforma de evaluación de talento</span>
        <h1>Decisiones de talento<br /><span className="c">con base en evidencia.</span></h1>
        <p className="lp-lead">Centralizá tests psicotécnicos, psicométricos, psicolaborales y vocacionales en tu propio entorno corporativo. Aplicación guiada, cálculo automático e informes gerenciales listos para la toma de decisiones — sin planillas y sin improvisar.</p>
        <div className="lp-roles" id="acceso">
          <div className="lp-role" onClick={irEvaluado}>
            <div className="lp-roleic ev"><Ico id="i-user" /></div>
            <h3>Soy evaluado</h3><p>Realizá las pruebas que tu empresa te asignó.</p>
            <span className="lp-act">Iniciar evaluación <Ico id="i-arrow" /></span>
          </div>
          <div className="lp-role" onClick={irLogin}>
            <div className="lp-roleic ad"><Ico id="i-brief" /></div>
            <h3>Soy administrador</h3><p>Gestioná evaluados, asignaciones y resultados.</p>
            <span className="lp-act">Acceder al panel <Ico id="i-arrow" /></span>
          </div>
        </div>
      </div></header>

      {/* TU ESPACIO CORPORATIVO (tenant / white-label) */}
      <section className="lp-sec" id="entorno"><div className="lp-wrap lp-about">
        <div>
          <div className="lp-sech" style={{ textAlign: 'left', margin: '0 0 4px' }}><span className="eb">Tu espacio corporativo</span></div>
          <h2>Un entorno exclusivo para tu empresa</h2>
          <p>Olvidate de las plataformas genéricas. Al darte de alta, generamos un <b>subdominio único</b> para tu organización, personalizado con <b>tu logo y tus colores institucionales</b>. Accedé a una batería completa de tests a elección y brindá una experiencia profesional desde el primer clic.</p>
          <ul className="lp-checks">
            <li><Ico id="i-check" /> Subdominio propio: <b>tuempresa</b>.one.com</li>
            <li><Ico id="i-check" /> Tu logo y tus colores en todo el portal y los informes.</li>
            <li><Ico id="i-check" /> Batería de tests a elección, habilitada para tu empresa.</li>
          </ul>
        </div>
        <div className="lp-card lp-aboutart" style={{ padding: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid var(--linea)', borderRadius: 10, padding: '9px 13px', fontSize: 13, color: 'var(--tinta)', marginBottom: 16 }}>
            🔒 <b>tuempresa</b>.one.com
          </div>
          <div style={{ background: 'linear-gradient(135deg,var(--violeta),var(--rosa) 60%,var(--cian))', borderRadius: 14, padding: 22, color: '#fff', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 800, fontSize: 18, background: 'rgba(255,255,255,.9)', color: 'var(--violeta)', padding: '5px 12px', borderRadius: 9 }}>TU LOGO</span>
            <span style={{ fontSize: 12, opacity: .9 }}>Portal de evaluación</span>
          </div>
          <div style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>Tus colores:</span>
            {['var(--violeta)', 'var(--rosa)', 'var(--cian)', 'var(--oro)'].map((c) => (
              <span key={c} style={{ width: 26, height: 26, borderRadius: 8, background: c, boxShadow: '0 0 0 1px var(--linea)' }} />
            ))}
          </div>
        </div>
      </div></section>

      {/* QUÉ ES */}
      <section className="lp-sec" id="plataforma"><div className="lp-wrap lp-about">
        <div>
          <div className="lp-sech" style={{ textAlign: 'left', margin: '0 0 4px' }}><span className="eb">La plataforma</span></div>
          <h2>Toda tu batería de evaluaciones, centralizada</h2>
          <p>Reemplazamos las planillas y los procesos manuales por una plataforma robusta y segura. Cada empresa gestiona sus evaluados, asigna pruebas y obtiene informes claros, mientras el sistema calcula puntajes y baremos de forma exacta.</p>
          <p>Cada test se corrige según su propia lógica de puntuación; los resultados se calculan de forma automática, no los genera una inteligencia artificial.</p>
          <ul className="lp-checks">
            <li><Ico id="i-check" /> Puntajes y percentiles calculados automáticamente, según los baremos de cada prueba.</li>
            <li><Ico id="i-check" /> Aislamiento y confidencialidad de los datos de cada empresa.</li>
            <li><Ico id="i-check" /> Informes profesionales con gráficos, listos para descargar.</li>
          </ul>
        </div>
        <StatDonut />
      </div></section>

      {/* EVALUACIONES */}
      <section className="lp-sec" id="evaluaciones"><div className="lp-wrap">
        <div className="lp-sech"><span className="eb">Evaluaciones</span><h2>Una batería completa</h2>
          <p>Seleccioná las pruebas según el perfil y el objetivo de cada proceso.</p></div>
        <div className="lp-grid4">
          <div className="lp-card lp-feat"><div className="lp-featic r"><Ico id="i-clip" /></div><h3>Psicotécnicas</h3><p>Aptitudes y razonamiento: lógica, atención, capacidad espacial y numérica.</p></div>
          <div className="lp-card lp-feat"><div className="lp-featic c"><Ico id="i-spark" /></div><h3>Psicométricas</h3><p>Personalidad e inteligencia emocional con baremos e interpretación por dimensión.</p></div>
          <div className="lp-card lp-feat"><div className="lp-featic v"><Ico id="i-brief" /></div><h3>Psicolaborales</h3><p>Competencias y perfiles orientados al desempeño y la selección.</p></div>
          <div className="lp-card lp-feat"><div className="lp-featic o"><Ico id="i-target" /></div><h3>Vocacionales</h3><p>Intereses y orientación profesional para decisiones de carrera.</p></div>
        </div>
      </div></section>

      {/* CÓMO FUNCIONA */}
      <section className="lp-sec" id="como"><div className="lp-wrap">
        <div className="lp-sech"><span className="eb">Cómo funciona</span><h2>Del alta al informe, en 4 pasos</h2></div>
        <div className="lp-steps">
          <div className="lp-card lp-step"><div className="num">1</div><Ico id="i-pencil" /><h3>Creación y asignación</h3><p>Desde tu panel de administrador, creá nuevos usuarios en segundos y asigná los tests específicos que necesitás que realicen.</p></div>
          <div className="lp-card lp-step"><div className="num">2</div><Ico id="i-send" /><h3>Automatización segura</h3><p>El sistema se encarga del resto: envía automáticamente las credenciales de acceso seguras y el link exclusivo de tu empresa al correo del evaluado.</p></div>
          <div className="lp-card lp-step"><div className="num">3</div><Ico id="i-target" /><h3>Monitoreo en tiempo real</h3><p>Recibí notificaciones directas en tu panel. Visualizá al instante qué evaluaciones están pendientes, en curso y completadas.</p></div>
          <div className="lp-card lp-step"><div className="num">4</div><Ico id="i-doc" /><h3>Resultados claros</h3><p>Accedé a informes profesionales con gráficos detallados, listos para interpretar y descargar en PDF.</p></div>
        </div>
      </div></section>

      {/* MÓDULOS ESTRATÉGICOS (IA consolidada + 360) */}
      <section className="lp-sec" id="modulos"><div className="lp-wrap">
        <div className="lp-sech"><span className="eb">Módulos estratégicos</span><h2>Más que tests: decisiones</h2>
          <p>Herramientas premium para leer a tu organización de forma integral.</p></div>
        <div className="lp-grid2">
          <div className="lp-card lp-feat"><div className="lp-featic r"><Ico id="i-spark" /></div>
            <h3>Informes gerenciales consolidados</h3>
            <p>¿El evaluado realizó múltiples pruebas? Seleccioná los tests que ya completó y nuestro sistema consolida los datos en un único informe gerencial. Una visión panorámica y estratégica para facilitar tus decisiones.</p>
          </div>
          <div className="lp-card lp-feat"><div className="lp-featic c"><Ico id="i-users" /></div>
            <h3>Módulo de evaluación 360°</h3>
            <p>Medí el desempeño y el clima de toda tu organización. Implementá evaluaciones 360° para tus colaboradores, garantizando el anonimato en el feedback de pares, líderes y reportes, con un mapa visual de brechas.</p>
          </div>
        </div>
      </div></section>

      {/* BENEFICIOS */}
      <section className="lp-sec"><div className="lp-wrap">
        <div className="lp-sech"><span className="eb">Por qué elegirnos</span><h2>Precisión, claridad y seguridad</h2></div>
        <div className="lp-grid4">
          <div className="lp-card lp-feat"><div className="lp-featic v"><Ico id="i-chart" /></div><h3>Cálculo automático</h3><p>Resultados deterministas: los mismos datos siempre dan el mismo resultado, sin cálculos manuales.</p></div>
          <div className="lp-card lp-feat"><div className="lp-featic r"><Ico id="i-shield" /></div><h3>Confidencial</h3><p>Datos aislados por empresa y resguardados con altos estándares.</p></div>
          <div className="lp-card lp-feat"><div className="lp-featic c"><Ico id="i-doc" /></div><h3>Informes claros</h3><p>Gráficos e interpretaciones profesionales, listos para usar.</p></div>
          <div className="lp-card lp-feat"><div className="lp-featic o"><Ico id="i-lock" /></div><h3>Acceso seguro</h3><p>Autenticación individual y control de cada evaluación.</p></div>
        </div>
      </div></section>

      {/* CTA */}
      <section className="lp-sec" style={{ paddingTop: 10 }}><div className="lp-wrap"><div className="lp-cta">
        <h2>¿Listo para evaluar con precisión?</h2>
        <p>Accedé a tu espacio o solicitá una demostración para tu empresa.</p>
        <button className="lp-btn" onClick={irLogin}>Acceder al panel <Ico id="i-arrow" className="lp-ico" /></button>
      </div></div></section>

      {/* FOOTER */}
      <footer className="lp-footer" id="contacto"><div className="lp-wrap">
        <div className="lp-foot">
          <div>
            <h4>Sucursal Tucumán</h4>
            <a href="mailto:info@escencialconsult.com.ar">Email: info@escencialconsult.com.ar</a>
            <div className="fline">Dirección: Catamarca 873 — San Miguel de Tucumán</div>
            <a href="tel:+5493816221565">Teléfono: +54 9 3816 22-1565</a>
            <a href="tel:+5493816221565">Celular: +54 9 3816 22-1565</a>
          </div>
          <div>
            <h4>Sucursal Bolivia</h4>
            <div className="fline">Manzana 40, torre 2, piso 10</div>
            <div className="fline">Santa Cruz de la Sierra, Bolivia</div>
            <a href="tel:+59176030430">Teléfono: +591 76030430</a>
          </div>
          <div>
            <h4>Sucursal Buenos Aires</h4>
            <div className="fline">Paraguay 635, C1008AAT</div>
            <div className="fline">Cdad. Autónoma de Buenos Aires</div>
            <a href="tel:+5491150061604">Teléfono: +54 9 11 5006-1604</a>
          </div>
        </div>
        <div className="lp-copy"><img className="one-logo" src="/logo.png" alt="ONE" style={{ height: 22, verticalAlign: 'middle', marginRight: 8 }} />© 2026 {EMPRESA} · {PRODUCTO}. Todos los derechos reservados.</div>
      </div></footer>
    </div>
  )
}

// ── Dona interactiva de la sección "La plataforma" ────────────────────────────
const STATS = [
  { big: '18+', label: 'Tests validados', desc: 'Psicotécnicos, psicométricos, psicolaborales y vocacionales.', color: '#e17bd7' },
  { big: '100%', label: 'Cálculo determinista', desc: 'Sin IA en el resultado individual; puntajes exactos y reproducibles.', color: '#6be1e3' },
  { big: '360°', label: 'Evaluación multi-fuente', desc: 'Desempeño con feedback de pares, líderes y reportes directos.', color: '#4d248f' },
]

function donutSeg(cx, cy, ro, ri, a1, a2) {
  const pt = (r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)]
  const [x1, y1] = pt(ro, a1), [x2, y2] = pt(ro, a2)
  const [x3, y3] = pt(ri, a2), [x4, y4] = pt(ri, a1)
  const large = a2 - a1 > Math.PI ? 1 : 0
  return `M${x1} ${y1} A${ro} ${ro} 0 ${large} 1 ${x2} ${y2} L${x3} ${y3} A${ri} ${ri} 0 ${large} 0 ${x4} ${y4} Z`
}

function StatDonut() {
  const [act, setAct] = useState(0)
  const [paused, setPaused] = useState(false)
  const seg = (2 * Math.PI) / STATS.length
  const start = -Math.PI / 2
  const gap = 0.05
  const cur = STATS[act]

  // Rota el resaltado solo; se pausa cuando el mouse está encima.
  useEffect(() => {
    if (paused) return
    const t = setInterval(() => setAct((a) => (a + 1) % STATS.length), 2500)
    return () => clearInterval(t)
  }, [paused])

  return (
    <div className="lp-card lp-donut" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="lp-donut-graf">
        <svg viewBox="0 0 260 260">
          {STATS.map((s, i) => {
            const a1 = start + i * seg + gap
            const a2 = start + (i + 1) * seg - gap
            return (
              <path
                key={i}
                d={donutSeg(130, 130, 118, 74, a1, a2)}
                fill={s.color}
                className={'lp-seg' + (act === i ? ' on' : '')}
                onMouseEnter={() => setAct(i)}
              />
            )
          })}
          <text key={'n' + act} x="130" y="126" textAnchor="middle" className="lp-donut-n lp-fade" fill={cur.color}>{cur.big}</text>
          <text key={'l' + act} x="130" y="150" textAnchor="middle" className="lp-donut-l lp-fade">{cur.label}</text>
        </svg>
      </div>
      <div className="lp-donut-legend">
        {STATS.map((s, i) => (
          <div key={i} className={'lp-legrow' + (act === i ? ' on' : '')} onMouseEnter={() => setAct(i)}>
            <span className="dot" style={{ background: s.color }} />
            <div><b>{s.big} · {s.label}</b><p>{s.desc}</p></div>
          </div>
        ))}
      </div>
    </div>
  )
}
