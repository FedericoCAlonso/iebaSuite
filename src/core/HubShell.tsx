import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import './HubShell.css'

const mainTools = [
  { path: '/',            label: 'Inicio',          icon: '⊞' },
  { path: '/proyectos',   label: 'Proyectos',       icon: '📐' },
  { path: '/clientes',    label: 'Clientes',        icon: '🤝' },
  { path: '/simbolos',    label: 'Símbolos',        icon: '🔣' },
  { path: '/mediciones',  label: 'Mediciones',      icon: '📏' },
  { path: '/perfil',      label: 'Perfil',          icon: '👤' },
]

const projectTools = (id: string) => [
  { path: `/proyecto/${id}/resumen`,    label: 'Resumen',    icon: '📊' },
  { path: `/proyecto/${id}/relevador`,  label: 'Relevador',  icon: '🗺️' },
  { path: `/proyecto/${id}/unifilar`,   label: 'Unifilar',   icon: '🔌' },
  { path: `/proyecto/${id}/srt`,        label: 'SRT 900',    icon: '📋' },
]

export function HubShell() {
  const location = useLocation()
  const { user, logout } = useAuth()

  // Detectar si estamos en un proyecto
  const projectMatch = location.pathname.match(/\/proyecto\/([^/]+)/)
  const projectId = projectMatch ? projectMatch[1] : null
  
  const currentTools = projectId ? projectTools(projectId) : mainTools

  // En herramientas de pantalla completa, ocultar la nav para no interferir con su UI
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
