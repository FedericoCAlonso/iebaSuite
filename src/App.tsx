import { useProjects } from './hooks/useProjects';
import { useToast } from './hooks/useToast';
import { useUIState } from './hooks/useUIState';
import { useAppActions } from './hooks/useAppActions';

// Componentes Layout
import { AppHeader } from './components/AppHeader';
import { AppModals } from './components/AppModals';
import { ProjectsScreen } from './screens/ProjectScreen';
import { EditorScreen } from './screens/EditorScreen';
import { Preview } from './components/Preview';

/** 
 * Orquestador principal de la aplicación.
 * Sigue el principio de Single Responsibility delegando la lógica a Hooks y Sub-componentes.
 */
export function App() {
  // 1. Estado de Datos (Core)
  const projectState = useProjects();
  const { toast, show: showToast } = useToast();

  // 2. Estado de UI (Modales, Navegación)
  const uiState = useUIState();

  // 3. Acciones de Negocio (Handlers complejos)
  const actions = useAppActions({
    ...projectState,
    ...uiState,
    showToast,
    setSymDialog: uiState.modals.setSymDialog
  });

  return (
    <div className="app">
      <AppHeader
        screen={uiState.screen}
        activeProject={projectState.activeProject}
        canUndo={projectState.canUndo}
        onGoHome={uiState.closeEditor}
        onUndo={projectState.undoAmbiente}
        onShowExport={() => uiState.modals.setShowExport(true)}
      />

      <main className="main-content">
        {uiState.screen === 'projects' ? (
          <ProjectsScreen
            projects={projectState.projects}
            activeId={projectState.activeProjectId}
            onSelect={(id) => { projectState.selectProject(id); uiState.openEditor(); }}
            onCreate={() => { projectState.createProject(); uiState.openEditor(); }}
            onDelete={projectState.deleteProject}
            onImport={actions.handleImportProject}
            onManageSymbols={() => uiState.modals.setShowSymbolManager(true)}
          />
        ) : (
          projectState.activeProject && projectState.activeAmbiente && projectState.activeAmbienteId ? (
            <div className="workspace">
              <div className={`panel-left ${uiState.mobileEditorVisible ? 'mobile-visible' : ''}`}>
                <EditorScreen
                  project={projectState.activeProject}
                  activeAmbiente={projectState.activeAmbiente}
                  activeAmbienteId={projectState.activeAmbienteId}
                  activeTab={uiState.activeTab}
                  onTabChange={uiState.setActiveTab}
                  symbolsLib={projectState.symbolsLib}
                  onUpdateMeta={(meta: any) => projectState.updateProject(projectState.activeProjectId!, (p: any) => ({ ...p, meta }))}
                  onUpdateAmbiente={projectState.updateAmbiente}
                  onUpdateProject={(fn: any) => projectState.updateProject(projectState.activeProjectId!, fn)}
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

              <button className="mobile-view-toggle" onClick={uiState.toggleMobileEditor}>
                {uiState.mobileEditorVisible ? '📐' : '📝'}
              </button>
            </div>
          ) : (
            <div className="empty-state">
              <p>No se pudo cargar el ambiente.</p>
              <button className="btn btn-acc" onClick={uiState.closeEditor}>Volver</button>
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
    </div>
  );
}