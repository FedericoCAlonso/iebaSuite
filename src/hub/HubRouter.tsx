import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './AuthContext'
import { HubShell } from './HubShell'
import { HubHome } from './HubHome'
import { DummyTool } from './DummyTool'
import { LoginScreen } from './LoginScreen'
import { CroquizadorApp } from '../CroquizadorApp'

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
        Cargando...
      </div>
    )
  }

  if (!user) return <LoginScreen />

  return (
    <Routes>
      <Route path="/" element={<HubShell />}>
        <Route index element={<HubHome />} />
        <Route path="croquizador" element={<CroquizadorApp />} />
        <Route path="croquizador/:projectId" element={<CroquizadorApp />} />
        <Route path="srt" element={<DummyTool nombre="SRT 900/15" icono="🔌" descripcion="Relevamiento boca a boca según SRT 900/15" />} />
        <Route path="tierra" element={<DummyTool nombre="Puestas a tierra" icono="⚡" descripcion="Medición de resistencia de puesta a tierra" />} />
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
        <HubRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
