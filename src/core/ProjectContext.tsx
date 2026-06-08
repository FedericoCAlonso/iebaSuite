import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { useProjects } from '../hooks/useProjects'
import { useUIState } from '../hooks/useUIState'
import { useAppActions } from '../hooks/useAppActions'
import { useToast } from '../hooks/useToast'
import { AppModals } from '../components/shared/AppModals'
import { SyncConflictModal, type SyncConflict } from '../components/shared/SyncConflictModal'
import type { Project, Ambiente } from '../types/index'

// ─── INTERFAZ DEL CONTEXTO ────────────────────────────────────────────────────

/**
 * Valor expuesto por `ProjectContext` a los componentes que trabajan dentro
 * de un proyecto eléctrico activo.
 */
export interface ProjectContextValue {
  /** Proyecto eléctrico actualmente seleccionado y cargado. */
  activeProject: Project;
  /** Ambiente (habitación/sector) activo dentro del proyecto, o `null` si ninguno está seleccionado. */
  activeAmbiente: Ambiente | null;
  /** ID del ambiente activo, o `null` si ninguno está seleccionado. */
  activeAmbienteId: string | null;
  /**
   * Cambia el ambiente activo dentro del proyecto.
   * @param id - ID del ambiente a activar, o `null` para deseleccionar.
   */
  setActiveAmbienteId: (id: string | null) => void;
  /**
   * Aplica una función de transformación al proyecto especificado y persiste el resultado.
   * @param id - ID del proyecto a modificar.
   * @param fn - Función pura que recibe el proyecto actual y retorna el proyecto modificado.
   */
  updateProject: (id: string, fn: (p: Project) => Project) => void;
  /**
   * Aplica una función de transformación al ambiente activo y persiste el resultado.
   * @param fn - Función pura que recibe el ambiente actual y retorna el ambiente modificado.
   */
  updateAmbiente: (fn: (a: Ambiente) => Ambiente) => void;
  /** Agrega un nuevo ambiente vacío al proyecto activo. */
  addAmbiente: () => void;
  /**
   * Elimina un ambiente del proyecto activo.
   * @param id - ID del ambiente a eliminar.
   */
  deleteAmbiente: (id: string) => void;
  /** Deshace la última modificación realizada sobre los ambientes (operación undo). */
  undoAmbiente: () => void;
  /** `true` si hay al menos una operación de ambiente que se puede deshacer. */
  canUndo: boolean;
  /**
   * Enlaza dos aperturas pertenecientes a ambientes distintos del mismo proyecto
   * (por ejemplo, para modelar una puerta entre dos habitaciones).
   * @param proyectoId - ID del proyecto que contiene los ambientes.
   * @param ambA_id    - ID del primer ambiente.
   * @param abA_id     - ID de la apertura en el primer ambiente.
   * @param ambB_id    - ID del segundo ambiente.
   * @param abB_id     - ID de la apertura en el segundo ambiente.
   */
  enlazarAberturas: (proyectoId: string, ambA_id: string, abA_id: string, ambB_id: string, abB_id: string) => void;
  // UI State & Actions
  /** Estado completo de la interfaz gráfica (modales, pestañas activas, etc.). */
  ui: ReturnType<typeof useUIState>;
  /** Acciones de alto nivel disponibles sobre el proyecto activo (dibujo, selección, etc.). */
  actions: ReturnType<typeof useAppActions>;
  /** Mensaje del toast actualmente visible, o `null` si no hay ninguno. */
  toast: string | null;
  /**
   * Muestra un mensaje de notificación temporal (toast) en la interfaz.
   * @param msg - Texto del mensaje a mostrar.
   */
  showToast: (msg: string) => void;
  /** Conflicto de sincronización activo, si lo hay. */
  conflict: SyncConflict | null;
}

// ─── CONTEXTO ─────────────────────────────────────────────────────────────────

/**
 * Contexto React que encapsula todo el estado y las operaciones del proyecto
 * eléctrico activo. Inicialmente es `null` para detectar usos fuera del provider.
 */
const ProjectContext = createContext<ProjectContextValue | null>(null)

// ─── HOOK ─────────────────────────────────────────────────────────────────────

/**
 * Hook que consume el `ProjectContext`. Provee acceso al proyecto activo,
 * sus ambientes, las acciones de edición y el estado de la UI.
 *
 * @returns El valor completo de `ProjectContextValue`.
 * @throws Error si se usa fuera de un `ProjectProvider`.
 */
export function useCurrentProject() {
  const ctx = useContext(ProjectContext)
  if (!ctx) throw new Error('useCurrentProject debe usarse dentro de ProjectProvider')
  return ctx
}

// ─── PROVIDER ─────────────────────────────────────────────────────────────────

/**
 * Proveedor del contexto de proyecto activo. Lee el `projectId` de los
 * parámetros de la URL y sincroniza el estado global de proyectos con la ruta.
 * Renderiza un estado de carga mientras el proyecto no esté disponible y
 * redirige a `/proyectos` si no hay `projectId` en la URL.
 *
 * @param children - Árbol de componentes que tendrán acceso al contexto.
 */
export function ProjectProvider({ children }: { children: ReactNode }) {
  const { projectId } = useParams<{ projectId: string }>()
  const projectState = useProjects()
  const ui = useUIState()
  const { toast, show: showToast } = useToast()

  // Sincroniza el proyecto activo con el ID de la URL al navegar
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
      updateProject: projectState.updateProject,
      updateAmbiente: projectState.updateAmbiente,
      addAmbiente: projectState.addAmbiente,
      deleteAmbiente: projectState.deleteAmbiente,
      undoAmbiente: projectState.undoAmbiente,
      canUndo: projectState.canUndo,
      enlazarAberturas: projectState.enlazarAberturas,
      ui,
      actions,
      toast,
      showToast,
      conflict: projectState.conflict
    }}>
      {children}
      <AppModals />
      <SyncConflictModal conflict={projectState.conflict} />
      {toast && <div className="toast animate-in">{toast}</div>}
    </ProjectContext.Provider>
  )
}
