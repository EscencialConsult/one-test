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

  const categorias = useMemo(() => {
    const s = new Set((tests || []).map((t) => t.categoria).filter(Boolean))
    return ['todos', ...Array.from(s)]
  }, [tests])

  if (error) return <div className="sa-err">{error}</div>
  if (!tests) return <div className="sa-card sa-panel"><Loader /></div>

  const lista = cat === 'todos' ? tests : tests.filter((t) => t.categoria === cat)

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
        <span className="sa-empty" style={{ padding: 0 }}>{tests.length} tests · {tests.filter((t) => t.tomable).length} tomables</span>
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
      <p className="sa-note">El catálogo es común a toda la plataforma. Los tests se habilitan por empresa desde la ficha de cada empresa.</p>
    </>
  )
}

function cap(s) { return s ? s[0].toUpperCase() + s.slice(1) : s }
