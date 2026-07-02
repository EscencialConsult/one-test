import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api.js'
import Icon from '../superadmin/Icons.jsx'

export default function EEDashboard() {
  const [r, setR] = useState(null)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => { api('/empresa/resumen').then(setR).catch((e) => setError(e.message)) }, [])

  if (error) return <div className="sa-err">{error}</div>
  if (!r) return <div className="sa-card sa-panel">Cargando…</div>

  const est = r.por_estado || {}
  const sinIniciar = (est.sin_iniciar || 0) + (est.sin_asignar || 0)
  const meses = r.completadas_por_mes || []
  const maxMes = Math.max(1, ...meses.map((m) => m.n))
  const maxUso = Math.max(1, ...(r.mas_asignadas || []).map((t) => t.n))

  return (
    <>
      <div className="sa-kpis">
        <Kpi ic="v" icon="users" n={r.evaluados} l="Evaluados" />
        <Kpi ic="o" icon="doc" n={est.en_curso || 0} l="En curso" />
        <Kpi ic="c" icon="check" n={est.completado || 0} l="Completados" />
        <Kpi ic="r" icon="send" n={sinIniciar} l="Sin iniciar" />
      </div>

      <div className="sa-row2">
        <div className="sa-card sa-panel">
          <div className="sa-ph"><h3>Evaluaciones completadas</h3><a>Últimos 7 meses</a></div>
          {meses.every((m) => m.n === 0) ? (
            <div className="sa-empty">Todavía no hay evaluaciones completadas.</div>
          ) : (
            <div className="sa-chart">
              {meses.map((m, i) => (
                <div className="bar" key={i} title={`${m.n} en ${m.label}`}>
                  {m.n > 0 && <em>{m.n}</em>}
                  <i style={{ height: `${m.n === 0 ? 1 : Math.max(8, Math.round((m.n / maxMes) * 100))}%` }} />
                  <span>{m.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="sa-card sa-panel">
          <div className="sa-ph"><h3>Pruebas más asignadas</h3></div>
          {(!r.mas_asignadas || r.mas_asignadas.length === 0) ? (
            <div className="sa-empty">Aún no asignaste pruebas.</div>
          ) : (
            <div className="sa-mini">
              {r.mas_asignadas.map((t) => (
                <div className="it" key={t.slug}>
                  <div className="t"><span>{t.nombre}</span><b>{t.n}</b></div>
                  <div className="track"><i style={{ width: `${Math.round((t.n / maxUso) * 100)}%` }} /></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="sa-card sa-panel">
        <div className="sa-ph"><h3>Actividad reciente</h3><a onClick={() => navigate('/empresa/evaluados')}>Ver evaluados →</a></div>
        {(!r.actividad_reciente || r.actividad_reciente.length === 0) ? (
          <div className="sa-empty">Todavía no hay resultados rendidos.</div>
        ) : (
          <table className="sa-table">
            <thead><tr><th>Evaluado</th><th>Prueba</th><th>Fecha</th><th></th></tr></thead>
            <tbody>
              {r.actividad_reciente.map((a) => (
                <tr key={a.resultado_id} className="click" onClick={() => navigate(`/empresa/informe/${a.resultado_id}`)}>
                  <td><div className="sa-co"><div className="ee-av">{sigla(a.evaluado)}</div><b>{a.evaluado}</b></div></td>
                  <td>{a.test_nombre}</td>
                  <td>{fecha(a.fecha)}</td>
                  <td style={{ textAlign: 'right' }}><span className="sa-chev"><Icon name="chevR" style={{ width: 18 }} /></span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}

function Kpi({ ic, icon, n, l }) {
  return (
    <div className="sa-card sa-kpi">
      <div className={'ic ' + ic}><Icon name={icon} /></div>
      <div className="n">{n}</div>
      <div className="l">{l}</div>
    </div>
  )
}

function sigla(n) { return (n || '?').split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase() }
function fecha(iso) { try { return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }) } catch { return '' } }
