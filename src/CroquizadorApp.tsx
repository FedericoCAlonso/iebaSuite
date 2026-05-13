import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProjects } from './hooks/useProjects'
import { useToast } from './hooks/useToast'
import { useUIState } from './hooks/useUIState'
import { useAppActions } from './hooks/useAppActions'
import { AppHeader } from './components/AppHeader'
import { AppModals } from './components/AppModals'
import { ProjectsScreen } from './screens/ProjectScreen'
import { EditorScreen } from './screens/EditorScreen'
import { Preview } from './components/Preview'
import { MasterView } from './components/MasterView'

export function CroquizadorApp() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()

  const projectState = useProjects()
  const { toast, show: showToast } = useToast()
  const uiState = useUIState()
  const actions = useAppActions({
    ...projectState,
    ...uiState,
    showToast,
    setSymDialog: uiState.modals.setSymDialog
  })

  // Sincronizar proyecto activo con la URL
  useEffect(() => {
    if (projectId && projectId !== projectState.activeProjectId) {
      projectState.selectProject(projectId)
    }
  }, [projectId])

  const isEditor = !!projectId

  return (
    <div className="app">
      <AppHeader
        screen={isEditor ? 'editor' : 'projects'}
        activeProject={projectState.activeProject}
        canUndo={projectState.canUndo}
        onGoHome={() => navigate('/croquizador')}
        onUndo={projectState.undoAmbiente}
        onShowExport={() => uiState.modals.setShowExport(true)}
      />

      <main className="main-content">
        {!isEditor ? (
          <ProjectsScreen
            projects={projectState.projects}
            activeId={projectState.activeProjectId}
            onSelect={(id) => {
              projectState.selectProject(id)
              navigate(`/croquizador/${id}`)
            }}
            onCreate={() => {
              const p = projectState.createProject()
              if (p?.id) navigate(`/croquizador/${p.id}`)
            }}
            onDelete={projectState.deleteProject}
            onImport={actions.handleImportProject}
            onManageSymbols={() => uiState.modals.setShowSymbolManager(true)}
          />
        ) : (
          projectState.activeProject && projectState.activeAmbiente && projectState.activeAmbienteId ? (
            <div className="workspace">
              {uiState.activeTab === 'maestro' ? (
                <MasterView
                  project={projectState.activeProject}
                  symbolsLib={projectState.symbolsLib}
                  onUpdateAmbiente={(id, fn) => projectState.updateProject(
                    projectState.activeProjectId!,
                    p => ({ ...p, ambientes: p.ambientes.map(a => a.id === id ? fn(a) : a) })
                  )}
                  onUpdateProject={(fn) => projectState.updateProject(
                    projectState.activeProjectId!, fn
                  )}
                  onSelectAmbiente={projectState.setActiveAmbienteId}
                  onTabChange={uiState.setActiveTab}
                />
              ) : (
                <>
                  <div className={`panel-left ${uiState.mobileEditorVisible ? 'mobile-visible' : ''}`}>
                    <EditorScreen
                      project={projectState.activeProject}
                      activeAmbiente={projectState.activeAmbiente}
                      activeAmbienteId={projectState.activeAmbienteId}
                      activeTab={uiState.activeTab}
                      onTabChange={uiState.setActiveTab}
                      symbolsLib={projectState.symbolsLib}
                      onUpdateMeta={(meta: any) => projectState.updateProject(
                        projectState.activeProjectId!, (p: any) => ({ ...p, meta })
                      )}
                      onUpdateAmbiente={projectState.updateAmbiente}
                      onUpdateProject={(fn: any) => projectState.updateProject(
                        projectState.activeProjectId!, fn
                      )}
                      onAddAmbiente={projectState.addAmbiente}
                      onDeleteAmbiente={projectState.deleteAmbiente}
                      onSelectAmbiente={projectState.setActiveAmbienteId}
                      onSymbolDialog={uiState.modals.setSymDialog}
                      onShowNetlist={() => uiState.modals.setShowNetlist(true)}
                    />
                  </div>
                  <div className="panel-right">
                    <Preview
                      project={projectState.activeProject}
                      ambiente={projectState.activeAmbiente}
                      meta={projectState.activeProject.meta}
                      activeTab={uiState.activeTab}
                      symbolsLib={projectState.symbolsLib}
                      onCanvasClick={actions.handleCanvasClick}
                    />
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="empty-state">
              <p>No se pudo cargar el proyecto.</p>
              <button className="btn btn-acc" onClick={() => navigate('/croquizador')}>
                Volver
              </button>
            </div>
          )
        )}
      </main>

      <AppModals
        activeProject={projectState.activeProject}
        activeAmbiente={projectState.activeAmbiente}
        symbolsLib={projectState.symbolsLib}
        modals={uiState.modals}
        onSymConfirm={actions.handleSymConfirm}
        onSymbolsUpdate={projectState.setSymbolsLib}
        onToast={showToast}
      />

      {toast && <div className="toast animate-in">{toast}</div>}

      {isEditor && (
        <button
          className="mobile-view-toggle"
          onClick={uiState.toggleMobileEditor}
          title={uiState.mobileEditorVisible ? 'Ver plano' : 'Editar datos'}
        >
          {uiState.mobileEditorVisible ? '🗺️' : '✏️'}
        </button>
      )}
    </div>
  )
}
