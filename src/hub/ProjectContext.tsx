import { useEffect, type ReactNode } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { useProjects } from '../hooks/useProjects'
import { useUIState } from '../hooks/useUIState'
import { useAppActions } from '../hooks/useAppActions'
import { useToast } from '../hooks/useToast'
import { AppModals } from '../components/shared/AppModals'
import { ProjectContext } from './ProjectContextCore'

export function ProjectProvider({ children }: { children: ReactNode }) {
  const { projectId } = useParams<{ projectId: string }>()
  const projectState = useProjects()
  const ui = useUIState()
  const { toast, show: showToast } = useToast()

  useEffect(() => {
    if (projectId && projectId !== projectState.activeProjectId) {
      projectState.selectProject(projectId)
    }
  }, [projectId, projectState.activeProjectId, projectState])

  const actions = useAppActions({
    activeProject: projectState.activeProject,
    activeAmbiente: projectState.activeAmbiente,
    updateAmbiente: projectState.updateAmbiente,
    addProject: projectState.addProject,
    selectProject: projectState.selectProject,
    openEditor: ui.openEditor,
    showToast,
    setSymDialog: ui.modals.setSymDialog,
    activeTab: ui.activeTab,
    updateProject: projectState.updateProject,
    pendingConnectionStart: ui.pendingConnectionStart,
    setPendingConnectionStart: ui.setPendingConnectionStart
  })

  if (!projectId) return <Navigate to="/proyectos" replace />
  
  if (!projectState.activeProject) {
    return (
      <div style={{ 
        display: 'flex', 
        height: '100vh', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#0f172a',
        color: '#38bdf8',
        fontFamily: 'Inter, sans-serif'
      }}>
        Cargando proyecto...
      </div>
    )
  }

  return (
    <ProjectContext.Provider value={{
      activeProject: projectState.activeProject,
      activeAmbiente: projectState.activeAmbiente,
      activeAmbienteId: projectState.activeAmbienteId,
      setActiveAmbienteId: projectState.setActiveAmbienteId,
      symbolsLib: projectState.symbolsLib,
      updateProject: projectState.updateProject,
      updateAmbiente: projectState.updateAmbiente,
      addAmbiente: projectState.addAmbiente,
      deleteAmbiente: projectState.deleteAmbiente,
      undoAmbiente: projectState.undoAmbiente,
      canUndo: projectState.canUndo,
      enlazarAberturas: projectState.enlazarAberturas,
      setSymbolsLib: projectState.setSymbolsLib,
      categoriesLib: projectState.categoriesLib,
      ui,
      actions,
      toast,
      showToast
    }}>
      {children}
      <AppModals />
      {toast && <div className="toast animate-in">{toast}</div>}
    </ProjectContext.Provider>
  )
}

export { useCurrentProject } from './ProjectContextCore'
