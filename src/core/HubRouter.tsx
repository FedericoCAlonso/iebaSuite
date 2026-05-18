import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from './AuthContext'
import { ProfileProvider } from './ProfileContext'
import { ClientProvider } from './ClientContext'
import { SymbolsProvider, useSymbols } from './SymbolsContext'
import { HubShell } from './HubShell'
import { HubHome } from './HubHome'
import { HubProjects } from './HubProjects'
import { HubClients } from './HubClients'
import { DummyTool } from './DummyTool'
import { LoginScreen } from './LoginScreen'
import { SymbolManagerScreen } from '../screens/SymbolManagerScreen'
import { MeasurementScreen } from '../screens/MeasurementScreen'
import { ProfileScreen } from '../screens/ProfileScreen'
import { RelevadorTool } from '../features/relevador/RelevadorTool'
import { UnifilarTool } from '../features/relevador/UnifilarTool'
import { ProjectProvider } from './ProjectContext'

function HubRoutes() {
  const { user, loading } = useAuth()
  const { isLoadingSymbols } = useSymbols()

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

  if (isLoadingSymbols) {
    return (
      <div style={{
        minHeight: '100dvh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg)', color: 'var(--text3)',
        fontFamily: 'var(--sans)', fontSize: 14
      }}>
        Cargando librerías de símbolos...
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<HubShell />}>
        <Route index element={<HubHome />} />
        <Route path="proyectos" element={<HubProjects />} />
        <Route path="clientes" element={<HubClients />} />
        <Route path="simbolos" element={<SymbolManagerScreen />} />
        <Route path="mediciones" element={<MeasurementScreen />} />
        <Route path="perfil" element={<ProfileScreen />} />

        <Route path="proyecto/:projectId" element={<ProjectProvider><Outlet /></ProjectProvider>}>
          <Route path="relevador" element={<RelevadorTool />} />
          <Route path="unifilar" element={<UnifilarTool />} />
          <Route path="srt" element={<DummyTool nombre="SRT 900/15" icono="🔌" descripcion="Relevamiento boca a boca según SRT 900/15" />} />
          <Route path="tierra" element={<DummyTool nombre="Puestas a tierra" icono="⚡" descripcion="Medición de resistencia de puesta a tierra" />} />
        </Route>

        <Route path="diferencial" element={<DummyTool nombre="Diferenciales" icono="⏱" descripcion="Tiempos de respuesta de interruptores diferenciales" />} />
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
