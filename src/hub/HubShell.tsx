import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import './HubShell.css'

const tools = [
  { path: '/',            label: 'Inicio',          icon: '⊞' },
  { path: '/proyectos',   label: 'Proyectos',       icon: '📐' },
  { path: '/srt',         label: 'SRT 900/15',       icon: '🔌' },
  { path: '/tierra',      label: 'Puestas a tierra', icon: '⚡' },
  { path: '/diferencial', label: 'Diferenciales',    icon: '⏱' },
]

export function HubShell() {
  const location = useLocation()
  const { user, logout } = useAuth()

  // En el relevador, ocultar la nav para no interferir con su UI
  const hideNav = location.pathname.includes('/relevador')


  return (
    <div className="hub-shell">
      {!hideNav && (
        <nav className="hub-nav">
          <div className="hub-nav__brand">
            <span className="hub-nav__logo">⚡</span>
            <span className="hub-nav__title">ieBA Suite</span>
          </div>
          <div className="hub-nav__tools">
            {tools.map(t => (
              <NavLink
                key={t.path}
                to={t.path}
                end={t.path === '/'}
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
