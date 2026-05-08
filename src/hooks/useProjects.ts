// ═══════════════════════════════════════════════════════════════════════════
// HOOK: useProjects.ts
// Gestión integral del estado de proyectos, ambientes y persistencia.
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import { 
  loadProjects, 
  saveProjects, 
  createProject as createNewProject, 
  createAmbiente as createNewAmbiente 
} from '../lib/storage';
import { loadSymbols } from '../lib/symbols';
import type { DefinicionSimbolo } from '../lib/symbols';
import type { Project, Ambiente } from '../types';

export function useProjects() {
  // Estado principal: lista de proyectos cargada desde localStorage
  const [projects, setProjects] = useState<Project[]>(() => loadProjects());
  
  // IDs de seguimiento para la navegación y edición
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeAmbienteId, setActiveAmbienteId] = useState<string | null>(null);

  // Historial de deshacer (Undo) local a la sesión del ambiente actual
  const [ambienteHistory, setAmbienteHistory] = useState<Ambiente[]>([]);

  // Librería de símbolos
  const [symbolsLib, setSymbolsLib] = useState<DefinicionSimbolo[]>(() => loadSymbols());

  // Limpiar el historial cuando se cambia de ambiente activo
  useEffect(() => {
    setAmbienteHistory([]);
  }, [activeAmbienteId]);

  // Efecto de persistencia: guarda en storage cada vez que cambia el array de proyectos
  useEffect(() => { 
    saveProjects(projects); 
  }, [projects]);

  // --- Selectores (Estado derivado) ---
  
  const activeProject = projects.find(p => p.id === activeProjectId) || null;
  
  const activeAmbiente = activeProject?.ambientes.find(a => a.id === activeAmbienteId) 
    || activeProject?.ambientes[0] 
    || null;

  // --- Operaciones de Proyecto ---

  /** Actualiza un proyecto por ID y refresca su timestamp */
  const updateProject = useCallback((id: string, fn: (p: Project) => Project) => {
    setProjects(prev => prev.map(p => 
      p.id === id ? { ...fn(p), updatedAt: Date.now() } : p
    ));
  }, []);

  /** Agrega un proyecto completo (útil para importaciones) */
  const addProject = useCallback((project: Project) => {
    setProjects(prev => [...prev, project]);
  }, []);

  /** Selecciona un proyecto y pone el foco en su primer ambiente */
  const selectProject = useCallback((id: string) => {
    setActiveProjectId(id);
    const p = projects.find(x => x.id === id);
    setActiveAmbienteId(p?.ambientes[0]?.id || null);
  }, [projects]);

  /** Crea un proyecto nuevo con la estructura base */
  const handleCreateProject = useCallback(() => {
    const p = createNewProject();
    setProjects(prev => [...prev, p]);
    setActiveProjectId(p.id);
    setActiveAmbienteId(p.ambientes[0].id);
    return p;
  }, []);

  /** Elimina un proyecto y limpia el estado activo si coincide */
  const deleteProject = useCallback((id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    if (activeProjectId === id) {
      setActiveProjectId(null);
      setActiveAmbienteId(null);
    }
  }, [activeProjectId]);

  // --- Operaciones de Ambiente ---

  /** Actualiza el ambiente activo preservando la inmutabilidad del árbol de datos */
  const updateAmbiente = useCallback((fn: (a: Ambiente) => Ambiente) => {
    if (!activeProjectId || !activeAmbienteId) return;

    updateProject(activeProjectId, (project) => ({
      ...project,
      ambientes: project.ambientes.map(a => {
        if (a.id === activeAmbienteId) {
            const next = fn(a);
            // Guardar estado actual en el historial antes de aplicar el cambio (max 20 estados)
            setAmbienteHistory(h => [...h, a].slice(-20));
            return next;
        }
        return a;
      })
    }));
  }, [activeProjectId, activeAmbienteId, updateProject]);

  /** Deshace el último cambio en el ambiente activo */
  const undoAmbiente = useCallback(() => {
    if (ambienteHistory.length === 0 || !activeProjectId || !activeAmbienteId) return;
    
    const prev = ambienteHistory[ambienteHistory.length - 1];
    setAmbienteHistory(h => h.slice(0, -1));
    
    updateProject(activeProjectId, project => ({
      ...project,
      ambientes: project.ambientes.map(a => a.id === activeAmbienteId ? prev : a)
    }));
  }, [ambienteHistory, activeProjectId, activeAmbienteId, updateProject]);

  /** Agrega un ambiente nuevo al proyecto activo */
  const addAmbiente = useCallback(() => {
    if (!activeProjectId || !activeProject) return;
    const nuevoAmbiente = createNewAmbiente(`Ambiente ${activeProject.ambientes.length + 1}`);
    
    updateProject(activeProjectId, project => ({
      ...project,
      ambientes: [...project.ambientes, nuevoAmbiente]
    }));
    setActiveAmbienteId(nuevoAmbiente.id);
  }, [activeProjectId, activeProject, updateProject]);

  /** Elimina un ambiente y garantiza que el proyecto mantenga al menos uno */
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

  // Retornamos la API completa del hook
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
    canUndo: ambienteHistory.length > 0,
    symbolsLib,
    setSymbolsLib,
    addProject // <--- Ahora disponible para App.tsx
  };
}