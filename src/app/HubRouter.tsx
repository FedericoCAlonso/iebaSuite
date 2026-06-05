import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from '../core/AuthContext'
import { ProfileProvider } from '../core/ProfileContext'
import { ClientProvider } from '../core/ClientContext'
import { SymbolsProvider } from '../core/SymbolsContext'
import { HubShell } from '../features/hub/HubShell'
import { HubHome } from '../features/hub/HubHome'
import { HubProjects } from '../features/hub/HubProjects'
import { HubClients } from '../features/hub/HubClients'
import { LoginScreen } from '../features/auth/LoginScreen'
import { SymbolManagerScreen } from '../features/symbols/SymbolManagerScreen'
import { ProfileScreen } from '../features/profile/ProfileScreen'
import { MeasurementScreen } from '../features/measurements/MeasurementScreen'
import { ProjectSummaryScreen } from '../features/hub/ProjectSummaryScreen'
import { ProjectPickerScreen } from '../features/hub/ProjectPickerScreen'
import { RelevadorTool } from '../features/relevador/RelevadorTool'
import { ProjectProvider } from '../core/ProjectContext'

function HubRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        minHeight: '100dvh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg)', color: 'var(--text3)',
        fontFamily: 'var(--sans)', fontSize: 14
      }}>
        Cargando autenticación...
      </div>
    )
  }

  if (!user) return <LoginScreen />

  return (
    <Routes>
      <Route path="/" element={<HubShell />}>
        <Route index element={<HubHome />} />
        <Route path="proyectos" element={<HubProjects />} />
        <Route path="clientes" element={<HubClients />} />
        <Route path="simbolos" element={<SymbolManagerScreen />} />
        <Route path="configuracion" element={<ProfileScreen />} />

        {/* Picker de herramientas de proyecto (seleccionar herramienta → proyecto) */}
        <Route path=":toolPath" element={<ProjectPickerScreen />} />

        <Route path="proyecto/:projectId" element={<ProjectProvider><Outlet /></ProjectProvider>}>
          <Route index element={<Navigate to="resumen" replace />} />
          <Route path="resumen" element={<ProjectSummaryScreen />} />
          <Route path="relevador" element={<RelevadorTool />} />
          <Route path="mediciones" element={<MeasurementScreen />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export function HubRouter() {
  return (
    <BrowserRouter basename="/iebaSuite">
      <AuthProvider>
        <ProfileProvider>
          <ClientProvider>
            <SymbolsProvider>
              <HubRoutes />
            </SymbolsProvider>
          </ClientProvider>
        </ProfileProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

