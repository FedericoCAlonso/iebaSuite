import { useNavigate } from 'react-router-dom'
import { useCurrentProject } from '../../core/ProjectContext'
import { useSymbols } from '../../core/SymbolsContext'
import { EditorTabProvider } from '../../core/EditorTabContext'
import { AppHeader } from '../../components/AppHeader'
import { EditorScreen } from '../../screens/EditorScreen'
import { Preview } from '../../components/Preview'
import { MasterView } from '../../components/MasterView'

export function RelevadorTool() {
  const navigate = useNavigate()
  const { symbolsLib } = useSymbols()
  const { 
    activeProject,
    activeAmbiente,
    activeAmbienteId,
    setActiveAmbienteId,
    updateProject,
    updateAmbiente,
    addAmbiente,
    deleteAmbiente,
    undoAmbiente,
    canUndo,
    ui,
    actions
  } = useCurrentProject()

  return (
    <div className="app tool-relevador">
      <AppHeader
        screen="editor"
        activeProject={activeProject}
        canUndo={canUndo}
        onGoHome={() => navigate('/proyectos')}
        onUndo={undoAmbiente}
        onShowExport={() => ui.modals.setShowExport(true)}
      />

      <main className="main-content">
        <div className="workspace">
          {!activeAmbiente || !activeAmbienteId ? (
            <div className="empty" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              Cargando ambiente...
            </div>
          ) : (
            <EditorTabProvider activeTab={ui.activeTab} setActiveTab={ui.setActiveTab}>
              {ui.activeTab === 'maestro' ? (
                <MasterView
                  project={activeProject}
                  symbolsLib={symbolsLib}
                  onUpdateAmbiente={(id, fn) => updateProject(
                    activeProject.id,
                    p => ({ ...p, ambientes: p.ambientes.map(a => a.id === id ? fn(a) : a) })
                  )}
                  onUpdateProject={(fn) => updateProject(activeProject.id, fn)}
                  onSelectAmbiente={setActiveAmbienteId}
                />
              ) : (
                <>
                  <div className={`panel-left ${ui.mobileEditorVisible ? 'mobile-visible' : ''}`}>
                    <EditorScreen
                      project={activeProject}
                      activeAmbiente={activeAmbiente}
                      activeAmbienteId={activeAmbienteId}
                      symbolsLib={symbolsLib}
                      onUpdateMeta={(meta: any) => updateProject(
                        activeProject.id, (p: any) => ({ ...p, meta })
                      )}
                      onUpdateAmbiente={updateAmbiente}
                      onUpdateProject={(fn: any) => updateProject(activeProject.id, fn)}
                      onAddAmbiente={addAmbiente}
                      onDeleteAmbiente={deleteAmbiente}
                      onSelectAmbiente={setActiveAmbienteId}
                      onSymbolDialog={ui.modals.setSymDialog}
                      onShowNetlist={() => ui.modals.setShowNetlist(true)}
                    />
                  </div>
                  <div className="panel-right">
                    <Preview
                      project={activeProject}
                      ambiente={activeAmbiente}
                      meta={activeProject.meta}
                      symbolsLib={symbolsLib}
                      onCanvasClick={actions.handleCanvasClick}
                    />
                  </div>
                </>
              )}
            </EditorTabProvider>
          )}
        </div>
      </main>

      {/* AppModals y Toast se renderizan ahora desde el ProjectProvider */}

      <button
        className="mobile-view-toggle"
        onClick={ui.toggleMobileEditor}
        title={ui.mobileEditorVisible ? 'Ver plano' : 'Editar datos'}
      >
        {ui.mobileEditorVisible ? '🗺️' : '✏️'}
      </button>
    </div>
  )
}
