import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from '../core/AuthContext'
import { ProfileProvider } from '../core/ProfileContext'
import { ClientProvider } from '../core/ClientContext'
import { SymbolsProvider } from '../core/SymbolsContext'
import { HubShell } from '../features/hub/HubShell'
import { LoginScreen } from '../features/auth/LoginScreen'
import { ProjectProvider } from '../core/ProjectContext'

// Carga perezosa (lazy load) de las pantallas principales para reducir el bundle size inicial
const HubHome = lazy(() => import('../features/hub/HubHome').then(m => ({ default: m.HubHome })))
const HubProjects = lazy(() => import('../features/hub/HubProjects').then(m => ({ default: m.HubProjects })))
const HubClients = lazy(() => import('../features/hub/HubClients').then(m => ({ default: m.HubClients })))
const SymbolManagerScreen = lazy(() => import('../features/symbols/SymbolManagerScreen').then(m => ({ default: m.SymbolManagerScreen })))
const ProfileScreen = lazy(() => import('../features/profile/ProfileScreen').then(m => ({ default: m.ProfileScreen })))
const ProjectPickerScreen = lazy(() => import('../features/hub/ProjectPickerScreen').then(m => ({ default: m.ProjectPickerScreen })))
const ProjectSummaryScreen = lazy(() => import('../features/hub/ProjectSummaryScreen').then(m => ({ default: m.ProjectSummaryScreen })))
const RelevadorTool = lazy(() => import('../features/relevador/RelevadorTool').then(m => ({ default: m.RelevadorTool })))
const MeasurementScreen = lazy(() => import('../features/measurements/MeasurementScreen').then(m => ({ default: m.MeasurementScreen })))

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
    <Suspense fallback={
      <div style={{
        minHeight: '100dvh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg)', color: 'var(--text3)',
        fontFamily: 'var(--sans)', fontSize: 14
      }}>
        Cargando pantalla...
      </div>
    }>
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
    </Suspense>
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

