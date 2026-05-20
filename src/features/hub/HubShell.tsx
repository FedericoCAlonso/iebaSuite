import { useMemo } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../core/AuthContext'
import { loadProjects } from '../../lib/storage'
import './HubShell.css'

const mainTools = [
  { path: '/',            label: 'Inicio',          icon: '⊞' },
  { path: '/configuracion', label: 'Config',        icon: '⚙' },
]

function getProjectTools(id: string, estado?: string) {
  const tools = [
    { path: `/proyecto/${id}/resumen`,    label: 'Resumen',    icon: '📊' },
    { path: `/proyecto/${id}/relevador`,  label: 'Relevador',  icon: '🗺️' },
  ]
  if (estado === 'presupuesto' || estado === 'en_ejecucion' || estado === 'ejecutado' || estado === 'certificado') {
    tools.push({ path: `/proyecto/${id}/unifilar`, label: 'Unifilar', icon: '🔌' })
  }
  if (estado === 'ejecutado' || estado === 'certificado') {
    tools.push({ path: `/proyecto/${id}/mediciones`, label: 'Mediciones', icon: '📏' })
    tools.push({ path: `/proyecto/${id}/srt`, label: 'SRT 900', icon: '📋' })
  }
  return tools
}

export function HubShell() {
  const location = useLocation()
  const { user, logout } = useAuth()

  const projectMatch = location.pathname.match(/\/proyecto\/([^/]+)/)
  const projectId = projectMatch ? projectMatch[1] : null
  
  const projects = useMemo(() => loadProjects(), [location.pathname])
  const activeProject = projectId ? projects.find((p: any) => p.id === projectId) : null
  const estado = activeProject?.estado

  const currentTools = projectId ? getProjectTools(projectId, estado) : mainTools

  const hideNav = location.pathname.includes('/relevador') || location.pathname.includes('/unifilar')

  return (
    <div className="hub-shell">
      {!hideNav && (
        <nav className="hub-nav">
          <div className="hub-nav__brand">
            <span className="hub-nav__logo">⚡</span>
            <span className="hub-nav__title">ieBA Suite</span>
          </div>
          <div className="hub-nav__tools">
            {currentTools.map(t => (
              <NavLink
                key={t.path}
                to={t.path}
                end={t.path === '/' || t.path.endsWith('/resumen')}
                className={({ isActive }) =>
                  'hub-nav__item' + (isActive ? ' hub-nav__item--active' : '')
                }
              >
                <span className="hub-nav__icon">{t.icon}</span>
                <span className="hub-nav__label">{t.label}</span>
              </NavLink>
            ))}
          </div>

          <div className="hub-nav__user">
            <span className="hub-nav__user-name">
              {user?.displayName ?? user?.email ?? ''}
            </span>
            <button className="btn btn-ghost btn-sm" onClick={logout}>
              Salir
            </button>
          </div>
        </nav>
      )}
      <main className="hub-main">
        <Outlet />
      </main>
    </div>
  )
}
