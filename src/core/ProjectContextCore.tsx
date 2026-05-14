import { createContext, useContext } from 'react'
import type { Project, Ambiente } from '../types/index'
import { useUIState } from '../hooks/useUIState'
import { useAppActions } from '../hooks/useAppActions'

export interface ProjectContextValue {
  activeProject: Project;
  activeAmbiente: Ambiente | null;
  activeAmbienteId: string | null;
  setActiveAmbienteId: (id: string | null) => void;
  updateProject: (id: string, fn: (p: Project) => Project) => void;
  updateAmbiente: (fn: (a: Ambiente) => Ambiente) => void;
  addAmbiente: () => void;
  deleteAmbiente: (id: string) => void;
  undoAmbiente: () => void;
  canUndo: boolean;
  enlazarAberturas: (proyectoId: string, ambA_id: string, abA_id: string, ambB_id: string, abB_id: string) => void;
  // UI State & Actions
  ui: ReturnType<typeof useUIState>;
  actions: ReturnType<typeof useAppActions>;
  toast: string | null;
  showToast: (msg: string) => void;
}

export const ProjectContext = createContext<ProjectContextValue | null>(null)

export function useCurrentProject() {
  const ctx = useContext(ProjectContext)
  if (!ctx) throw new Error('useCurrentProject debe usarse dentro de ProjectProvider')
  return ctx
}
