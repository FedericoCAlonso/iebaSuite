import { useNavigate } from 'react-router-dom'
import { useCurrentProject } from '../../core/ProjectContext'

const ESTADO_LABELS: Record<string, string> = {
  relevamiento: 'Relevamiento',
  presupuesto: 'Presupuesto',
  en_ejecucion: 'En ejecución',
  ejecutado: 'Ejecutado',
  certificado: 'Certificado'
}

const ESTADO_COLORS: Record<string, string> = {
  relevamiento: '#8b5cf6',
  presupuesto: '#f59e0b',
  en_ejecucion: '#3b82f6',
  ejecutado: '#10b981',
  certificado: '#06b6d4'
}

export function ProjectSummaryScreen() {
  const navigate = useNavigate()
  const { activeProject } = useCurrentProject()
  const p = activeProject

  if (!p) {
    return (
      <div style={{ padding: 40, textAlign: 'center', fontFamily: 'var(--sans)', color: 'var(--text3)' }}>
        No hay proyecto activo.
      </div>
    )
  }

  const estado = p.estado || 'relevamiento'

  return (
    <div style={{ padding: 24, fontFamily: 'var(--sans)', maxWidth: 800 }}>
      <div style={{ marginBottom: 24 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/proyectos')}>
          ← Volver a proyectos
        </button>
      </div>

      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>
        {p.nombre || 'Proyecto sin nombre'}
      </h1>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
        <span style={{
          display: 'inline-block',
          padding: '4px 12px',
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 600,
          textTransform: 'uppercase',
          background: `${ESTADO_COLORS[estado]}20`,
          color: ESTADO_COLORS[estado],
          border: `1px solid ${ESTADO_COLORS[estado]}40`
        }}>
          {ESTADO_LABELS[estado] || estado}
        </span>
        <span style={{ color: 'var(--text3)', fontSize: 13 }}>
          Escala 1:{p.escala || 50} · {p.ambientes?.length || 0} hoja(s)
        </span>
      </div>

      <div style={{ display: 'grid', gap: 16 }}>
        {p.inmueble && (
          <div className="card" style={{ padding: 16, borderRadius: 'var(--r)', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text3)', marginBottom: 8 }}>
              🏠 Inmueble
            </h3>
            <div style={{ fontSize: 14, lineHeight: 1.6 }}>
              <div><strong>Dirección:</strong> {p.inmueble.direccion || '—'}</div>
              <div><strong>Partido:</strong> {p.inmueble.partido || '—'}</div>
              <div><strong>Provincia:</strong> {p.inmueble.provincia || '—'}</div>
              <div><strong>Uso:</strong> {p.inmueble.uso || '—'}</div>
            </div>
          </div>
        )}

        {p.suministro && (
          <div className="card" style={{ padding: 16, borderRadius: 'var(--r)', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text3)', marginBottom: 8 }}>
              ⚡ Suministro
            </h3>
            <div style={{ fontSize: 14, lineHeight: 1.6 }}>
              <div><strong>Tensión:</strong> {p.suministro.tension || '—'} V</div>
              <div><strong>Fases:</strong> {p.suministro.fases === 3 ? 'Trifásico' : p.suministro.fases === 1 ? 'Monofásico' : '—'}</div>
              <div><strong>Potencia contratada:</strong> {p.suministro.potenciaContratadaKW || '—'} kW</div>
              <div><strong>Distribuidora:</strong> {p.suministro.distribuidora || '—'}</div>
              <div><strong>N° medidor:</strong> {p.suministro.nroMedidor || '—'}</div>
            </div>
          </div>
        )}

        <div className="card" style={{ padding: 16, borderRadius: 'var(--r)', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text3)', marginBottom: 8 }}>
            📐 Ambientes ({p.ambientes?.length || 0})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(p.ambientes || []).map(a => (
              <div key={a.id} style={{
                padding: '8px 12px',
                borderRadius: 'var(--r)',
                background: 'var(--bg2)',
                fontSize: 14
              }}>
                {a.nombre} · {a.tramos?.length || 0} tramo(s) · {a.elementos?.length || 0} elemento(s)
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
