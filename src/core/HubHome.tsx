// HubHome.tsx
import { useNavigate } from 'react-router-dom'
import './HubHome.css'

const tools = [
  {
    path: '/proyectos',
    label: 'Relevador de Planta',

    icon: '📐',
    descripcion: 'Planos paramétricos de instalaciones eléctricas',
    disponible: true,
  },

  {
    path: '/srt',
    label: 'SRT 900/15',
    icon: '🔌',
    descripcion: 'Relevamiento boca a boca',
    disponible: false,
  },
  {
    path: '/tierra',
    label: 'Puestas a tierra',
    icon: '⚡',
    descripcion: 'Medición de resistencia',
    disponible: false,
  },
  {
    path: '/diferencial',
    label: 'Diferenciales',
    icon: '⏱',
    descripcion: 'Tiempos de respuesta',
    disponible: false,
  },
]

export function HubHome() {
  const navigate = useNavigate()
  return (
    <div className="hub-home">
      <header className="hub-home__header">
        <h1 className="hub-home__title">ieBA Suite</h1>
        <p className="hub-home__subtitle">
          Herramientas para instalaciones eléctricas
        </p>
      </header>
      <div className="hub-home__grid">
        {tools.map(t => (
          <button
            key={t.path}
            className={'hub-home__card' + (!t.disponible ? ' hub-home__card--soon' : '')}
            onClick={() => t.disponible && navigate(t.path)}
            disabled={!t.disponible}
          >
            <span className="hub-home__card-icon">{t.icon}</span>
            <span className="hub-home__card-label">{t.label}</span>
            <span className="hub-home__card-desc">{t.descripcion}</span>
            {!t.disponible && (
              <span className="hub-home__card-badge">Próximamente</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

