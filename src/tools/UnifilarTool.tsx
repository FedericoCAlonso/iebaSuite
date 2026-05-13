import { useCurrentProject } from '../hub/ProjectContext'
import { useNavigate } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader'

export function UnifilarTool() {
  const { activeProject, undoAmbiente, canUndo, ui } = useCurrentProject()
  const navigate = useNavigate()

  return (
    <div className="app tool-unifilar">
      <AppHeader
        screen="editor"
        activeProject={activeProject}
        canUndo={canUndo}
        onGoHome={() => navigate('/proyectos')}
        onUndo={undoAmbiente}
        onShowExport={() => ui.modals.setShowExport(true)}
      />
      
      <main className="main-content" style={{ display: 'flex', flex: 1, position: 'relative', flexDirection: 'column' }}>
        <div style={{ 
          padding: '1rem', 
          background: 'rgba(56, 189, 248, 0.1)', 
          borderBottom: '1px solid rgba(56, 189, 248, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <h2 style={{ fontSize: '1.2rem', margin: 0, color: 'var(--text1)' }}>
            Esquema Unifilar - {activeProject?.meta?.nombre || 'Proyecto'}
          </h2>
        </div>

        {/* Aquí irá el canvas/lienzo del diagrama unifilar */}
        <div style={{ 
          flex: 1, 
          backgroundColor: '#0f172a', 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundImage: 'radial-gradient(circle, rgba(56, 189, 248, 0.05) 1px, transparent 1px)',
          backgroundSize: '30px 30px'
        }}>
          <div style={{ textAlign: 'center', color: 'var(--text3)', maxWidth: '400px', padding: '2rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔌</div>
            <h3 style={{ color: 'var(--text1)', marginBottom: '0.5rem' }}>Lienzo del Diagrama Unifilar</h3>
            <p style={{ lineHeight: '1.6' }}>
              Herramienta en construcción. Las protecciones, circuitos y consumos se dibujarán aquí siguiendo la normativa IEC 60617.
            </p>
            <div style={{ 
              marginTop: '2rem', 
              padding: '1rem', 
              borderRadius: '8px', 
              background: 'rgba(255,255,255,0.03)',
              fontSize: '0.9rem',
              border: '1px dashed rgba(255,255,255,0.1)'
            }}>
              Próximamente: Arrastrar símbolos, conectar protecciones y generar reporte técnico.
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
