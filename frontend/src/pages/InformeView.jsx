import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../lib/api.js'
import ErrorBoundary from '../components/ErrorBoundary.jsx'
import InformeBaronEQi from '../informes/InformeBaronEQi.jsx'
import InformeBigFive from '../informes/InformeBigFive.jsx'
import InformeChaside from '../informes/InformeChaside.jsx'
import InformeDnla from '../informes/InformeDnla.jsx'
import InformeDomino from '../informes/InformeDomino.jsx'
import InformeIppr from '../informes/InformeIppr.jsx'
import InformeKuder from '../informes/InformeKuder.jsx'
import InformeGds15 from '../informes/InformeGds15.jsx'
import InformeStai from '../informes/InformeStai.jsx'
import '../informes/informe.css'

// Mapa slug -> componente de informe.
const INFORMES = {
  'baron-eqi': InformeBaronEQi,
  'big-five': InformeBigFive,
  'chaside': InformeChaside,
  'dnla-percepcion-personal': InformeDnla,
  'domino-48': InformeDomino,
  'ipp-r': InformeIppr,
  'kuder': InformeKuder,
  'gds-15': InformeGds15,
  'stai': InformeStai,
}

export default function InformeView() {
  const { resultadoId } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    api(`/resultados/${resultadoId}`).then(setData).catch((e) => setError(e.message))
  }, [resultadoId])

  const Informe = data ? INFORMES[data.test_slug] : null

  return (
    <div className="inf-body">
      <div className="inf-toolbar">
        <button className="inf-back" onClick={() => navigate(-1)}>← Volver</button>
        <button className="inf-print" onClick={() => window.print()}>Descargar PDF</button>
      </div>

      {error && <div className="inf-doc"><div className="inf-sheet"><div className="inf-pad">⚠️ {error}</div></div></div>}

      {!data && !error && <div className="inf-doc"><div className="inf-sheet"><div className="inf-pad">Cargando informe…</div></div></div>}

      {data && (Informe ? (
        <ErrorBoundary fallback={(err) => (
          <div className="inf-doc"><div className="inf-sheet"><div className="inf-pad">
            <h2 className="inf-sec">No se pudo mostrar el informe</h2>
            <p className="inf-tx">Error al renderizar: <b>{String(err?.message || err)}</b>. Estos son los datos calculados:</p>
            <pre className="resjson">{JSON.stringify(data.datos, null, 2)}</pre>
          </div></div></div>
        )}>
          <Informe data={data} />
        </ErrorBoundary>
      ) : (
        <div className="inf-doc"><div className="inf-sheet"><div className="inf-pad">
          <h2 className="inf-sec">{data.test_nombre}</h2>
          <p className="inf-tx">El informe con diseño para este test todavía no está disponible. Mostramos los datos calculados:</p>
          <pre className="resjson">{JSON.stringify(data.datos, null, 2)}</pre>
        </div></div></div>
      ))}
    </div>
  )
}
