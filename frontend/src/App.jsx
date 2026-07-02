import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth, homeFor } from './auth/AuthContext.jsx'
import Plexus from './Plexus.jsx'
import Landing from './pages/Landing.jsx'
import Login from './pages/Login.jsx'
import SuperAdminShell from './superadmin/SuperAdminShell.jsx'
import SADashboard from './superadmin/SADashboard.jsx'
import SAEmpresas from './superadmin/SAEmpresas.jsx'
import SAEmpresaDetail from './superadmin/SAEmpresaDetail.jsx'
import SACatalogo from './superadmin/SACatalogo.jsx'
import SAPlantillas from './superadmin/SAPlantillas.jsx'
import SAConfig from './superadmin/SAConfig.jsx'
import EEShell from './empresa/EEShell.jsx'
import EEDashboard from './empresa/EEDashboard.jsx'
import EEEvaluados from './empresa/EEEvaluados.jsx'
import EELegajo from './empresa/EELegajo.jsx'
import EE360 from './empresa/EE360.jsx'
import EEConfig from './empresa/EEConfig.jsx'
import InformeView from './pages/InformeView.jsx'
import EvaluadoApp from './EvaluadoApp.jsx'
import Responder from './evaluaciones/Responder.jsx'

function Cargando() {
  return (
    <div className="app">
      <Plexus />
      <div className="wrap" style={{ paddingTop: 100, textAlign: 'center' }}>
        <div className="card pad" style={{ display: 'inline-block' }}>Cargando…</div>
      </div>
    </div>
  )
}

// Ruta protegida por rol. Si no hay sesión → login; si el rol no coincide → su propio panel.
function Protected({ rol, children }) {
  const { user, loading } = useAuth()
  if (loading) return <Cargando />
  if (!user) return <Navigate to="/login" replace />
  if (rol && user.rol !== rol) return <Navigate to={homeFor(user)} replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<Protected rol="superadmin"><SuperAdminShell /></Protected>}>
            <Route index element={<SADashboard />} />
            <Route path="empresas" element={<SAEmpresas />} />
            <Route path="empresas/:id" element={<SAEmpresaDetail />} />
            <Route path="catalogo" element={<SACatalogo />} />
            <Route path="plantillas" element={<SAPlantillas />} />
            <Route path="config" element={<SAConfig />} />
          </Route>
          <Route path="/empresa/informe/:resultadoId" element={<Protected rol="admin_empresa"><InformeView /></Protected>} />
          <Route path="/empresa" element={<Protected rol="admin_empresa"><EEShell /></Protected>}>
            <Route index element={<EEDashboard />} />
            <Route path="evaluados" element={<EEEvaluados />} />
            <Route path="evaluados/:id" element={<EELegajo />} />
            <Route path="e360" element={<EE360 />} />
            <Route path="config" element={<EEConfig />} />
          </Route>
          {/* Responder una campaña de evaluación (público, por token). */}
          <Route path="/eval/:token" element={<Responder />} />
          {/* El portal del evaluado tendrá su propio login en la Fase 3. */}
          <Route path="/evaluado/*" element={<EvaluadoApp />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
