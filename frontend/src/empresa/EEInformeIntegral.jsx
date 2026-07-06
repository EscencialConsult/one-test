import { useEffect, useState } from 'react'
import { api } from '../lib/api.js'
import Icon from '../superadmin/Icons.jsx'

// Informe gerencial integral con IA: el admin elige varios tests completados de un
// evaluado y la IA los integra en un solo informe. La IA nunca altera los resultados.
export default function EEInformeIntegral({ evaluadoId, evaluadoNombre, resultados }) {
  const [iaOn, setIaOn] = useState(null) // null=cargando, true/false
  const [sel, setSel] = useState(() => new Set())
  const [lista, setLista] = useState([])
  const [gen, setGen] = useState(false)
  const [error, setError] = useState(null)
  const [abierto, setAbierto] = useState(null) // { titulo, contenido, tests, created_at }

  async function cargar() {
    try {
      const [estado, l] = await Promise.all([
        api('/empresa/ia/estado'),
        api(`/empresa/evaluados/${evaluadoId}/informes-integrales`),
      ])
      setIaOn(estado.habilitada); setLista(l)
    } catch (ex) { setError(ex.message); setIaOn(false) }
  }
  useEffect(() => { cargar() }, [evaluadoId])

  function toggle(id) {
    setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  async function generar() {
    if (sel.size === 0) return
    setGen(true); setError(null)
    try {
      const r = await api(`/empresa/evaluados/${evaluadoId}/informe-integral`, {
        method: 'POST', json: { resultado_ids: [...sel] },
      })
      setAbierto(r); setSel(new Set()); await cargar()
    } catch (ex) { setError(ex.message) } finally { setGen(false) }
  }

  async function ver(id) {
    setError(null)
    try { setAbierto(await api(`/empresa/informes-integrales/${id}`)) }
    catch (ex) { setError(ex.message) }
  }

  async function borrar(id) {
    if (!window.confirm('¿Eliminar este informe integral?')) return
    try {
      await api(`/empresa/informes-integrales/${id}`, { method: 'DELETE' })
      if (abierto?.id === id) setAbierto(null)
      await cargar()
    } catch (ex) { setError(ex.message) }
  }

  const hayResultados = resultados.length > 0

  return (
    <>
      <div className="ee-sectitle">Informe gerencial (IA)</div>
      <div className="ee-ia">
        <div className="iah"><div className="ic"><Icon name="spark" /></div>
          <h3>Generar informe integral con IA{iaOn === false && <span className="sa-soon">Sin configurar</span>}</h3>
        </div>
        <p className="d">Elegí las pruebas completadas y la IA las integra en un solo informe para gerencia. La IA <b>solo redacta</b> sobre los resultados ya calculados — nunca los modifica ni genera resultados.</p>

        {error && <div className="sa-err" style={{ marginLeft: 52 }}>{error}</div>}

        {!hayResultados ? (
          <div style={{ marginLeft: 52, fontSize: 13, color: 'var(--muted)' }}>Cuando el evaluado complete al menos una prueba, vas a poder generar el informe.</div>
        ) : iaOn === false ? (
          <div className="ee-note" style={{ marginLeft: 52 }}><Icon name="cog" /> La IA no está configurada. Cargá la API key de OpenAI (variable <b>OPENAI_API_KEY</b>) en el servidor para habilitar la generación.</div>
        ) : (
          <div style={{ marginLeft: 52 }}>
            <div className="ee-picklist" style={{ marginBottom: 12 }}>
              {resultados.map((r) => (
                <label key={r.id}>
                  <input type="checkbox" checked={sel.has(r.id)} onChange={() => toggle(r.id)} />
                  {r.nombre}
                </label>
              ))}
            </div>
            <button className="sa-btn prim" disabled={gen || sel.size === 0 || iaOn === null} onClick={generar}>
              <Icon name="spark" /> {gen ? 'Generando…' : `Generar informe${sel.size ? ` (${sel.size})` : ''}`}
            </button>
            {gen && <span style={{ fontSize: 12.5, color: 'var(--muted)', marginLeft: 10 }}>La IA está redactando; puede tardar unos segundos…</span>}
          </div>
        )}

        {lista.length > 0 && (
          <div style={{ marginLeft: 52, marginTop: 16 }}>
            <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 6 }}>Informes generados</div>
            {lista.map((i) => (
              <div key={i.id} className="ee-inflist">
                <button className="ee-lnk" onClick={() => ver(i.id)}><Icon name="doc" /> {i.titulo}</button>
                <small>{new Date(i.created_at).toLocaleDateString()} · {i.tests?.length || 0} tests</small>
                <button className="sa-trash" onClick={() => borrar(i.id)} title="Eliminar"><Icon name="trash" /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {abierto && <ModalInforme informe={abierto} evaluadoNombre={evaluadoNombre} onClose={() => setAbierto(null)} />}
    </>
  )
}

// Imprime solo el modal: marca el body para activar el @media print scopeado en ee.css.
function imprimirModal() {
  document.body.classList.add('print-modal')
  const limpiar = () => { document.body.classList.remove('print-modal'); window.removeEventListener('afterprint', limpiar) }
  window.addEventListener('afterprint', limpiar)
  window.print()
}

function ModalInforme({ informe, evaluadoNombre, onClose }) {
  const c = informe.contenido || {}
  const tests = informe.tests || []
  return (
    <div className="sa-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="sa-modal inf-modal">
        <button type="button" className="x" onClick={onClose}><Icon name="x" /></button>
        <div className="inf-doc">
          <div className="inf-head">
            <span className="inf-tag">Informe gerencial integral</span>
            <h2>{c.titulo || informe.titulo}</h2>
            <div className="inf-meta">{evaluadoNombre} · {tests.length} pruebas integradas · {new Date(informe.created_at).toLocaleDateString()}</div>
            <div className="inf-tests">{tests.map((t) => <span key={t.slug || t.nombre} className="inf-chip">{t.nombre}</span>)}</div>
          </div>

          {c.resumen_ejecutivo && (<section className="inf-sec"><h3>Resumen ejecutivo</h3><Parrafos texto={c.resumen_ejecutivo} /></section>)}

          {Array.isArray(c.perfil_por_test) && c.perfil_por_test.length > 0 && (
            <section className="inf-sec"><h3>Perfil por prueba</h3>
              {c.perfil_por_test.map((p, i) => (
                <div key={i} className="inf-test"><b>{p.test}</b><Parrafos texto={p.sintesis} /></div>
              ))}
            </section>
          )}

          {c.integracion && (<section className="inf-sec"><h3>Integración: coherencias y tensiones</h3><Parrafos texto={c.integracion} /></section>)}

          {Array.isArray(c.fortalezas) && c.fortalezas.length > 0 && (
            <section className="inf-sec"><h3>Fortalezas</h3><ul>{c.fortalezas.map((x, i) => <li key={i}>{x}</li>)}</ul></section>
          )}
          {Array.isArray(c.areas_desarrollo) && c.areas_desarrollo.length > 0 && (
            <section className="inf-sec"><h3>Áreas de desarrollo</h3><ul>{c.areas_desarrollo.map((x, i) => <li key={i}>{x}</li>)}</ul></section>
          )}
          {Array.isArray(c.recomendaciones) && c.recomendaciones.length > 0 && (
            <section className="inf-sec"><h3>Recomendaciones para gerencia</h3><ul>{c.recomendaciones.map((x, i) => <li key={i}>{x}</li>)}</ul></section>
          )}

          {c.cierre && (<section className="inf-sec"><Parrafos texto={c.cierre} /></section>)}

          <p className="inf-foot">Los resultados de cada prueba son deterministas. La IA solo integró y redactó la narrativa; no modificó ningún resultado.</p>
        </div>
        <div className="sa-modalfoot inf-actions">
          <button type="button" className="sa-btn ghost" onClick={onClose}>Cerrar</button>
          <button type="button" className="sa-btn dark" onClick={imprimirModal}><Icon name="doc" /> Imprimir / PDF</button>
        </div>
      </div>
    </div>
  )
}

function Parrafos({ texto }) {
  const parts = String(texto || '').split(/\n{2,}|\n/).map((s) => s.trim()).filter(Boolean)
  return <>{parts.map((p, i) => <p key={i}>{p}</p>)}</>
}
