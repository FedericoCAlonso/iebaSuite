import { useNavigate } from 'react-router-dom'
import './HubHome.css'

const accountTools = [
  {
    path: '/proyectos',
    label: 'Proyectos',
    icon: '📐',
    descripcion: 'Gestión de obras y planos',
    disponible: true,
  },
  {
    path: '/clientes',
    label: 'Clientes',
    icon: '🤝',
    descripcion: 'Cartera de clientes y contactos',
    disponible: true,
  },
  {
    path: '/simbolos',
    label: 'Biblioteca de Símbolos',
    icon: '🔣',
    descripcion: 'Símbolos eléctricos personalizados',
    disponible: true,
  },
  {
    path: '/configuracion',
    label: 'Configuración',
    icon: '⚙',
    descripcion: 'Perfil, instrumentos y preferencias',
    disponible: true,
  },
]

const projectTools = [
  {
    path: '/relevador',
    label: 'Relevador',
    icon: '🗺️',
    descripcion: 'Plano arquitectónico y eléctrico',
    disponible: true,
  },
  {
    path: '/unifilar',
    label: 'Unifilar',
    icon: '🔌',
    descripcion: 'Diagrama unifilar de tableros',
    disponible: true,
  },
  {
    path: '/mediciones',
    label: 'Mediciones',
    icon: '📏',
    descripcion: 'Puesta a tierra, diferenciales, continuidad, lazo, aislamiento',
    disponible: true,
  },
]

function ToolCard({ t }: { t: typeof accountTools[0] }) {
  const navigate = useNavigate()
  return (
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
  )
}

export function HubHome() {
  return (
    <div className="hub-home">
      <header className="hub-home__header">
        <h1 className="hub-home__title">ieBA Suite</h1>
        <p className="hub-home__subtitle">
          Herramientas para instalaciones eléctricas
        </p>
      </header>

      <section className="hub-home__section">
        <h2 className="hub-home__section-title">Cuenta</h2>
        <div className="hub-home__grid">
          {accountTools.map(t => (
            <ToolCard key={t.path} t={t} />
          ))}
        </div>
      </section>

      <section className="hub-home__section">
        <h2 className="hub-home__section-title">Proyecto</h2>
        <p className="hub-home__section-subtitle">
          Elegí una herramienta y luego seleccioná el proyecto
        </p>
        <div className="hub-home__grid">
          {projectTools.map(t => (
            <ToolCard key={t.path} t={t} />
          ))}
        </div>
      </section>
    </div>
  )
}
