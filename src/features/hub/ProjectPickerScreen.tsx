import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { loadProjects } from '../../lib/storage'

export function ProjectPickerScreen() {
  const navigate = useNavigate()
  const { toolPath } = useParams<{ toolPath: string }>()
  const projects = useMemo(() => loadProjects(), [])

  return (
    <div className="screen-project-picker" style={{ padding: 16 }}>
      <div className="screen-header" style={{ marginBottom: 16 }}>
        <span className="screen-title">Seleccionar proyecto</span>
      </div>
      <p style={{ color: 'var(--text3)', marginBottom: 16, fontSize: 14 }}>
        Elegí un proyecto para abrir <strong>{toolPath}</strong>.
      </p>

      {projects.length === 0 ? (
        <div className="empty" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📂</div>
          <strong>No hay proyectos</strong>
          <p style={{ color: 'var(--text3)', marginTop: 4 }}>
            Creá uno primero desde el Hub.
          </p>
        </div>
      ) : (
        <div className="project-list" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {projects.map(p => (
            <button
              key={p.id}
              className="project-row"
              onClick={() => navigate(`/proyecto/${p.id}/${toolPath}`)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                border: '1px solid var(--border)',
                borderRadius: 8,
                background: 'var(--bg2)',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
              }}
            >
              <span className="project-row__name" style={{ fontWeight: 500, fontSize: 15 }}>
                {p.nombre || p.meta?.nombre || 'Sin nombre'}
              </span>
              <span
                className="project-row__meta"
                style={{
                  fontSize: 12,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  color: 'var(--text3)',
                  border: '1px solid var(--border)',
                  padding: '2px 8px',
                  borderRadius: 4,
                }}
              >
                {p.estado || 'sin estado'}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
