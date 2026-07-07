import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api.js'
import Icon from './Icons.jsx'
import Loader from '../components/Loader.jsx'

export default function SADashboard() {
  const [r, setR] = useState(null)
  const [empresas, setEmpresas] = useState([])
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([api('/admin/resumen'), api('/empresas')])
      .then(([res, emp]) => { setR(res); setEmpresas(emp) })
      .catch((e) => setError(e.message))
  }, [])

  if (error) return <div className="sa-err">{error}</div>
  if (!r) return <div className="sa-card sa-panel"><Loader /></div>

  const maxUso = Math.max(1, ...(r.tests_mas_usados || []).map((t) => t.n))
  const recientes = empresas.slice(0, 5)

  return (
    <>
      <div className="sa-kpis">
        <Kpi ic="v" icon="build" n={r.empresas} l="Empresas" trend={`${r.empresas_activas} activas`} />
        <Kpi ic="r" icon="users" n={r.evaluados} l="Evaluados totales" />
        <Kpi ic="c" icon="layers" n={r.tests_catalogo} l="Tests en catálogo" trend={`${r.tests_tomables} tomables`} />
        <Kpi ic="o" icon="doc" n={r.resultados} l="Evaluaciones rendidas" />
      </div>

      <div className="sa-row2">
        <div className="sa-card sa-panel">
          <div className="sa-ph"><h3>Empresas recientes</h3><a onClick={() => navigate('/admin/empresas')}>Ver todas →</a></div>
          {recientes.length === 0 ? (
            <div className="sa-empty">Todavía no hay empresas.</div>
          ) : (
            <table className="sa-table">
              <thead><tr><th>Empresa</th><th>Subdominio</th><th>Evaluados</th><th>Estado</th></tr></thead>
              <tbody>
                {recientes.map((e) => (
                  <tr key={e.id} className="click" onClick={() => navigate(`/admin/empresas/${e.id}`)}>
                    <td><div className="sa-co"><div className="lg">{sigla(e.razon_social)}</div><b>{e.razon_social}</b></div></td>
                    <td><span className="sa-subd">{e.subdominio}</span></td>
                    <td>{e.evaluados}</td>
                    <td><span className={'sa-badge ' + (e.estado === 'activo' ? 'ok' : 'sus')}>{e.estado === 'activo' ? 'Activo' : 'Suspendido'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="sa-card sa-panel">
          <div className="sa-ph"><h3>Tests más usados</h3></div>
          {(!r.tests_mas_usados || r.tests_mas_usados.length === 0) ? (
            <div className="sa-empty">Aún no hay evaluaciones rendidas.</div>
          ) : (
            <div className="sa-mini">
              {r.tests_mas_usados.map((t) => (
                <div className="it" key={t.slug}>
                  <div className="t"><span>{t.nombre}</span><b>{t.n}</b></div>
                  <div className="track"><i style={{ width: `${Math.round((t.n / maxUso) * 100)}%` }} /></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function Kpi({ ic, icon, n, l, trend }) {
  return (
    <div className="sa-card sa-kpi">
      <div className={'ic ' + ic}><Icon name={icon} /></div>
      <div className="n">{n}</div>
      <div className="l">{l}</div>
      {trend && <div className="trend">{trend}</div>}
    </div>
  )
}

function sigla(nombre) {
  return (nombre || '?').split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase()
}
