// ═══════════════════════════════════════════════════════════════════════════
// HOOK: useProjects
// Orquesta el estado de proyectos y ambientes de la aplicación.
// Compone hooks especializados:
//   - useCloudSync       → sincronización Firebase
//   - useAmbienteHistory → stack de deshacer
//   - useProjectMigration → migración de datos legacy (función pura)
// ═══════════════════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback } from 'react';
import { loadProjects, saveProjects, createAmbiente as createNewAmbiente } from '../lib/storage';
import { loadLayoutAsync } from '../lib/layout';
import { calcularTransformacionEnlace } from '../lib/geometry';
import { createProjectRemote, deleteProjectRemote } from '../firebase/projectService';
import { useAuth } from '../core/AuthContext';
import { useCloudSync } from './useCloudSync';
import { useAmbienteHistory } from './useAmbienteHistory';
import { migrateProjects } from './useProjectMigration';
import type { Project, Ambiente } from '../types/index';

export function useProjects() {
  const { user } = useAuth();

  // Estado principal: lista de proyectos cargada desde localStorage
  const [projects, setProjects] = useState<Project[]>(() => loadProjects());

  // IDs de seguimiento para la navegación y edición
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeAmbienteId, setActiveAmbienteId] = useState<string | null>(null);

  // Cargar layout asíncronamente al iniciar
  useEffect(() => {
    loadLayoutAsync().then(layout => {
      (window as unknown as { layoutConfig: typeof layout }).layoutConfig = layout;
    });
  }, []);

  // Sincronización Firebase (pull + push debounced)
  useCloudSync({ user, projects, setProjects });

  // Historial de deshacer (Undo) local a la sesión del ambiente actual
  const { pushHistory, popHistory, canUndo } = useAmbienteHistory(activeAmbienteId);

  // Migración de datos legacy + persistencia local
  useEffect(() => {
    const migrated = migrateProjects(projects);
    if (migrated !== projects) {
      setProjects(migrated);
      return; // esperar al próximo ciclo para guardar ya migrado
    }
    saveProjects(projects);
  }, [projects]);

  // --- Selectores ---

  const activeProject = projects.find(p => p.id === activeProjectId) || null;
  const activeAmbiente = activeProject?.ambientes?.find(a => a.id === activeAmbienteId)
    || activeProject?.ambientes?.[0]
    || null;

  // --- Operaciones de Proyecto ---

  const updateProject = useCallback((id: string, fn: (p: Project) => Project) => {
    setProjects(prev => prev.map(p =>
      p.id === id ? { ...fn(p), updatedAt: Date.now() } : p
    ));
  }, []);

  const addProject = useCallback((project: Project) => {
    setProjects(prev => [...prev, project]);
  }, []);

  const selectProject = useCallback((id: string) => {
    setActiveProjectId(id);
    const p = projects.find(x => x.id === id);
    setActiveAmbienteId(p?.ambientes?.[0]?.id || null);
  }, [projects]);

  const handleCreateProject = useCallback((clienteId: string) => {
    const electricistaId = user?.uid || 'local';
    const p = createProjectRemote('Nuevo Proyecto', electricistaId, clienteId);
    const ambienteInicial = createNewAmbiente('Ambiente 1');
    p.ambientes = [ambienteInicial];

    if (user) {
      deleteProjectRemote; // reference kept for tree-shaking awareness
    }

    setProjects(prev => [...prev, p]);
    setActiveProjectId(p.id);
    setActiveAmbienteId(ambienteInicial.id);
    return p;
  }, [user]);

  const deleteProject = useCallback((id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    if (user) {
      deleteProjectRemote(id).catch(err =>
        console.error('Error deleting project from cloud:', err)
      );
    }
    if (activeProjectId === id) {
      setActiveProjectId(null);
      setActiveAmbienteId(null);
    }
  }, [activeProjectId, user]);

  // --- Operaciones de Ambiente ---

  const updateAmbiente = useCallback((fn: (a: Ambiente) => Ambiente) => {
    if (!activeProjectId || !activeAmbienteId) return;

    updateProject(activeProjectId, project => ({
      ...project,
      ambientes: project.ambientes.map(a => {
        if (a.id === activeAmbienteId) {
          pushHistory(a); // registrar estado anterior para undo
          return fn(a);
        }
        return a;
      })
    }));
  }, [activeProjectId, activeAmbienteId, updateProject, pushHistory]);

  const undoAmbiente = useCallback(() => {
    if (!activeProjectId || !activeAmbienteId) return;
    const prev = popHistory();
    if (!prev) return;

    updateProject(activeProjectId, project => ({
      ...project,
      ambientes: project.ambientes.map(a =>
        a.id === activeAmbienteId ? prev : a
      )
    }));
  }, [activeProjectId, activeAmbienteId, updateProject, popHistory]);

  const addAmbiente = useCallback(() => {
    if (!activeProjectId || !activeProject) return;
    const nuevoAmbiente = createNewAmbiente(
      `Ambiente ${(activeProject.ambientes?.length || 0) + 1}`
    );

    updateProject(activeProjectId, project => ({
      ...project,
      ambientes: [...(project.ambientes || []), nuevoAmbiente]
    }));
    setActiveAmbienteId(nuevoAmbiente.id);
  }, [activeProjectId, activeProject, updateProject]);

  const deleteAmbiente = useCallback((ambId: string) => {
    if (!activeProjectId || !activeProject) return;

    updateProject(activeProjectId, project => {
      const filtered = project.ambientes.filter(a => a.id !== ambId);
      return {
        ...project,
        ambientes: filtered.length > 0 ? filtered : [createNewAmbiente()]
      };
    });

    if (activeAmbienteId === ambId) {
      const remaining = activeProject.ambientes.filter(a => a.id !== ambId);
      setActiveAmbienteId(remaining[0]?.id || null);
    }
  }, [activeProjectId, activeProject, activeAmbienteId, updateProject]);

  const enlazarAberturas = useCallback((
    proyectoId: string,
    ambA_id: string,
    abA_id: string,
    ambB_id: string,
    abB_id: string
  ) => {
    updateProject(proyectoId, project => {
      const ambA = project.ambientes.find(a => a.id === ambA_id);
      const ambB = project.ambientes.find(a => a.id === ambB_id);
      const abA = ambA?.aberturas.find(ab => ab.id === abA_id);
      const abB = ambB?.aberturas.find(ab => ab.id === abB_id);

      if (!ambA || !ambB || !abA || !abB) return project;

      const transform = calcularTransformacionEnlace(ambA, abA, ambB, abB, project.meta.escala);

      return {
        ...project,
        ambientes: project.ambientes.map(a => {
          if (a.id === ambA_id) {
            return {
              ...a,
              aberturas: a.aberturas.map(ab =>
                ab.id === abA_id
                  ? { ...ab, ambienteVecinoId: ambB_id, aberturaVecinaId: abB_id, esPrincipal: true }
                  : ab
              )
            };
          }
          if (a.id === ambB_id) {
            return {
              ...a,
              posX: transform.posX,
              posY: transform.posY,
              rotation: transform.rotation,
              aberturas: a.aberturas.map(ab =>
                ab.id === abB_id
                  ? { ...ab, ambienteVecinoId: ambA_id, aberturaVecinaId: abA_id, esPrincipal: false }
                  : ab
              )
            };
          }
          return a;
        })
      };
    });
  }, [updateProject]);

  return {
    projects,
    activeProject,
    activeAmbiente,
    activeProjectId,
    activeAmbienteId,
    setActiveAmbienteId,
    selectProject,
    createProject: handleCreateProject,
    deleteProject,
    addAmbiente,
    deleteAmbiente,
    updateProject,
    updateAmbiente,
    undoAmbiente,
    canUndo,
    addProject,
    enlazarAberturas,
  };
}