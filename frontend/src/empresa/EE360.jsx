import { useState } from 'react'
import EECampanias from './EECampanias.jsx'
import EEFormularios from './EEFormularios.jsx'

// Módulo Evaluaciones (panel de empresa): Campañas + Formularios.
export default function EE360() {
  const [tab, setTab] = useState('campanias')
  return (
    <>
      <div className="sa-toolbar" style={{ marginBottom: 10 }}>
        <div className="l">
          <div className={'sa-chipf' + (tab === 'campanias' ? ' on' : '')} onClick={() => setTab('campanias')}>Campañas</div>
          <div className={'sa-chipf' + (tab === 'formularios' ? ' on' : '')} onClick={() => setTab('formularios')}>Formularios</div>
        </div>
      </div>
      {tab === 'campanias' ? <EECampanias /> : <EEFormularios />}
    </>
  )
}
