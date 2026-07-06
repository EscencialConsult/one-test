import { useEffect, useRef, useState } from 'react'
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
import InformeExcel from '../informes/InformeExcel.jsx'
import InformeEneagrama from '../informes/InformeEneagrama.jsx'
import InformeToulouse from '../informes/InformeToulouse.jsx'
import InformeDnlaLeadership from '../informes/InformeDnlaLeadership.jsx'
import InformeWais from '../informes/InformeWais.jsx'
import InformeDisc from '../informes/InformeDisc.jsx'
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
  'excel-inicial': InformeExcel,
  'excel-intermedio': InformeExcel,
  'excel-avanzado': InformeExcel,
  'eneagrama': InformeEneagrama,
  'toulouse-pieron': InformeToulouse,
  'dnla-leadership': InformeDnlaLeadership,
  'wais-iv': InformeWais,
  'disc': InformeDisc,
}

function nombreArchivo(data) {
  const t = (data?.test_nombre || 'Informe').replace(/[^\w\sÁÉÍÓÚáéíóúÑñ-]/g, '').trim().replace(/\s+/g, '-')
  const ev = data?.evaluado ? `-${data.evaluado.nombre}-${data.evaluado.apellido}` : ''
  return `Informe-${t}${ev}`.replace(/[^\w-]/g, '') + '.pdf'
}

export default function InformeView() {
  const { resultadoId } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [bajando, setBajando] = useState(false)
  const bodyRef = useRef(null)

  useEffect(() => {
    api(`/resultados/${resultadoId}`).then(setData).catch((e) => setError(e.message))
  }, [resultadoId])

  const Informe = data ? INFORMES[data.test_slug] : null

  async function descargarPDF() {
    const doc = bodyRef.current?.querySelector('.inf-doc')
    if (!doc || bajando) return
    setBajando(true)
    try {
      // Bundle pre-armado (incluye html2canvas + jsPDF); evita resolver canvg/core-js.
      const mod = await import('html2pdf.js/dist/html2pdf.bundle.min.js')
      const html2pdf = window.html2pdf || mod.default || mod
      if (typeof html2pdf !== 'function') throw new Error('html2pdf no disponible')
      await html2pdf().set({
        margin: [8, 8, 10, 8],
        filename: nombreArchivo(data),
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff', windowWidth: 900 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'], avoid: ['.inf-sheet', '.inf-cover', '.bf-bar', 'tr'] },
      }).from(doc).save()
    } catch (e) {
      window.alert('No se pudo generar el PDF. Probá de nuevo o usá Ctrl+P para imprimir.')
    } finally {
      setBajando(false)
    }
  }

  return (
    <div className="inf-body" ref={bodyRef}>
      <div className="inf-toolbar">
        <button className="inf-back" onClick={() => navigate(-1)}>← Volver</button>
        <button className="inf-print" disabled={bajando || !data} onClick={descargarPDF}>{bajando ? 'Generando PDF…' : 'Descargar PDF'}</button>
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
