import { useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api.js'
import Icon from './Icons.jsx'
import Loader from '../components/Loader.jsx'

export default function SACatalogo() {
  const [tests, setTests] = useState(null)
  const [error, setError] = useState(null)
  const [cat, setCat] = useState('todos')

  useEffect(() => {
    api('/catalogo').then(setTests).catch((e) => setError(e.message))
  }, [])

  // Disponibles (asignables) primero; los "en preparación" van aparte, al final.
  const disponibles = useMemo(() => (tests || []).filter((t) => t.disponible !== false), [tests])
  const noDisponibles = useMemo(() => (tests || []).filter((t) => t.disponible === false), [tests])

  const categorias = useMemo(() => {
    const s = new Set(disponibles.map((t) => t.categoria).filter(Boolean))
    return ['todos', ...Array.from(s)]
  }, [disponibles])

  if (error) return <div className="sa-err">{error}</div>
  if (!tests) return <div className="sa-card sa-panel"><Loader /></div>

  const lista = cat === 'todos' ? disponibles : disponibles.filter((t) => t.categoria === cat)

  return (
    <>
      <div className="sa-toolbar">
        <div className="l">
          {categorias.map((c) => (
            <div key={c} className={'sa-chipf' + (cat === c ? ' on' : '')} onClick={() => setCat(c)}>
              {c === 'todos' ? 'Todos' : cap(c)}
            </div>
          ))}
        </div>
        <span className="sa-empty" style={{ padding: 0 }}>{disponibles.length} disponibles · {disponibles.filter((t) => t.tomable).length} tomables{noDisponibles.length ? ` · ${noDisponibles.length} en preparación` : ''}</span>
      </div>

      <div className="sa-tgrid">
        {lista.map((t) => (
          <div className="sa-card sa-tc" key={t.slug}>
            <div className="th">
              <span className="sa-cat">{cap(t.categoria) || 'General'}</span>
              <span className={'sa-pill ' + (t.tomable ? 'on' : 'off')}>{t.tomable ? 'Tomable' : 'Solo informe'}</span>
            </div>
            <h3>{t.nombre}</h3>
            <p>{[t.codigo, t.tipo_respuesta].filter(Boolean).join(' · ') || t.slug}</p>
            <div className="tf">
              <span>{t.n_items ? `${t.n_items} ítems` : '—'}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muted)' }}><Icon name="doc" style={{ width: 15 }} /></span>
            </div>
          </div>
        ))}
      </div>

      {/* Tests en preparación: deshabilitados, al final, sin categoría, no asignables. */}
      {noDisponibles.length > 0 && (
        <>
          <div className="sa-toolbar" style={{ marginTop: 22 }}>
            <div className="l"><h3 style={{ fontSize: 15 }}>En preparación</h3><span style={{ fontSize: 12.5, color: 'var(--muted)' }}>Todavía no disponibles: no se pueden asignar a empresas.</span></div>
          </div>
          <div className="sa-tgrid">
            {noDisponibles.map((t) => (
              <div className="sa-card sa-tc" key={t.slug} style={{ opacity: 0.6 }}>
                <div className="th">
                  <span className="sa-pill off">No disponible</span>
                </div>
                <h3>{t.nombre}</h3>
                <p>{[t.codigo, t.tipo_respuesta].filter(Boolean).join(' · ') || t.slug}</p>
                <div className="tf">
                  <span>{t.n_items ? `${t.n_items} ítems` : '—'}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muted)' }}><Icon name="doc" style={{ width: 15 }} /></span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <p className="sa-note">El catálogo es común a toda la plataforma. Los tests se habilitan por empresa desde la ficha de cada empresa. Los tests <b>en preparación</b> no aparecen para asignar.</p>
    </>
  )
}

function cap(s) { return s ? s[0].toUpperCase() + s.slice(1) : s }
