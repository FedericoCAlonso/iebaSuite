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

/**
 * Hook central de gestión de proyectos y ambientes.
 *
 * Responsabilidades:
 * - Cargar y persistir proyectos en LocalStorage.
 * - Sincronizar proyectos con Firebase a través de `useCloudSync`.
 * - Mantener un historial de deshacer (undo) por ambiente activo.
 * - Ejecutar la migración automática de datos legacy al montar.
 * - Exponer operaciones CRUD sobre proyectos y ambientes.
 *
 * @returns Objeto con el estado completo y todas las operaciones disponibles.
 */
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
    }).catch(err => {
      console.warn('layout.json no disponible, se usarán valores por defecto.', err);
    });
  }, []);

  // Sincronización Firebase (pull + push debounced)
  const { conflict } = useCloudSync({ user, projects, setProjects });

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

  // ─── SELECTORES ───

  const activeProject = projects.find(p => p.id === activeProjectId) || null;
  const activeAmbiente = activeProject?.ambientes?.find(a => a.id === activeAmbienteId)
    || activeProject?.ambientes?.[0]
    || null;

  // ─── OPERACIONES DE PROYECTO ───

  /**
   * Aplica una transformación funcional sobre un proyecto por su ID y actualiza `updatedAt`.
   * @param id ID del proyecto a modificar.
   * @param fn Función pura que recibe el proyecto actual y retorna el nuevo estado.
   */
  const updateProject = useCallback((id: string, fn: (p: Project) => Project) => {
    setProjects(prev => prev.map(p =>
      p.id === id ? { ...fn(p), updatedAt: Date.now() } : p
    ));
  }, []);

  /**
   * Agrega un nuevo proyecto al final de la lista.
   * @param project Proyecto completo a insertar.
   */
  const addProject = useCallback((project: Project) => {
    setProjects(prev => [...prev, project]);
  }, []);

  /**
   * Selecciona un proyecto como activo y activa su primer ambiente.
   * @param id ID del proyecto a seleccionar.
   */
  const selectProject = useCallback((id: string) => {
    setActiveProjectId(id);
    const p = projects.find(x => x.id === id);
    setActiveAmbienteId(p?.ambientes?.[0]?.id || null);
  }, [projects]);

  /**
   * Crea un nuevo proyecto con un ambiente inicial y lo selecciona como activo.
   * Si el usuario está autenticado, el proyecto queda referenciado en Firebase.
   * @param clienteId ID del cliente al que pertenece el proyecto.
   * @returns El proyecto creado.
   */
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

  /**
   * Elimina un proyecto localmente y, si el usuario está autenticado, también en la nube.
   * Si el proyecto eliminado era el activo, limpia los IDs de selección.
   * @param id ID del proyecto a eliminar.
   */
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

  // ─── OPERACIONES DE AMBIENTE ───

  /**
   * Aplica una transformación funcional sobre el ambiente activo.
   * Antes de aplicar el cambio, registra el estado previo en el historial de undo.
   * @param fn Función pura que recibe el ambiente actual y retorna el nuevo estado.
   */
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

  /**
   * Restaura el último estado del ambiente activo desde el historial de undo.
   * No hace nada si el historial está vacío.
   */
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

  /**
   * Agrega un nuevo ambiente al proyecto activo y lo selecciona como activo.
   * El nombre se genera automáticamente como "Ambiente N".
   */
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

  /**
   * Elimina un ambiente del proyecto activo.
   * Si el proyecto queda sin ambientes, crea uno vacío automáticamente.
   * Si el ambiente eliminado era el activo, selecciona el primero restante.
   * @param ambId ID del ambiente a eliminar.
   */
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

  /**
   * Enlaza geométricamente dos aberturas de ambientes distintos dentro de un mismo proyecto.
   * Calcula la transformación (posición y rotación) necesaria para que el ambiente B
   * quede alineado con el ambiente A a través de sus aberturas compartidas.
   *
   * @param proyectoId ID del proyecto que contiene ambos ambientes.
   * @param ambA_id ID del ambiente "principal" (anclaje).
   * @param abA_id ID de la abertura en el ambiente A que actúa como punto de enlace.
   * @param ambB_id ID del ambiente "vecino" (que se reposiciona).
   * @param abB_id ID de la abertura en el ambiente B que actúa como punto de enlace.
   */
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

      const transform = calcularTransformacionEnlace(ambA, abA, ambB, abB, project.escala);

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
    conflict,
  };
}