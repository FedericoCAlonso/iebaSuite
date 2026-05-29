import { useCurrentProject } from '../../core/ProjectContext'
import { useNavigate } from 'react-router-dom'
import { AppHeader } from '../../components/AppHeader'
import { UnifilEditor } from '../unifilar'
import type { Project } from '../../types/index'

export function UnifilarTool() {
  const { activeProject, updateProject, undoAmbiente, canUndo, ui } = useCurrentProject()
  const navigate = useNavigate()

  const handleProjectChange = (updated: Project) => {
    if (!activeProject) return
    updateProject(activeProject.id, () => updated)
  }

  if (!activeProject) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          background: '#090d16'
        }}
      >
        <AppHeader
          screen="editor"
          activeProject={activeProject}
          canUndo={canUndo}
          onGoHome={() => navigate('/proyectos')}
          onUndo={undoAmbiente}
          onShowExport={() => ui.modals.setShowExport(true)}
        />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            color: '#64748b',
            fontSize: '14px'
          }}
        >
          Cargando proyecto...
        </div>
      </div>
    )
  }

  return (
    <div
      className="app tool-unifilar"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
        background: '#090d16',
        fontFamily: 'Inter, sans-serif'
      }}
    >
      <AppHeader
        screen="editor"
        activeProject={activeProject}
        canUndo={canUndo}
        onGoHome={() => navigate('/proyectos')}
        onUndo={undoAmbiente}
        onShowExport={() => ui.modals.setShowExport(true)}
      />

      <main
        style={{
          display: 'flex',
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          minHeight: 0
        }}
      >
        <UnifilEditor project={activeProject} onProjectChange={handleProjectChange} />
      </main>
    </div>
  )
}
