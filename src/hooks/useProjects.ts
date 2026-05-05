// ═══════════════════════════════════════════════════════════════════════════
// MODULE: hooks.js
// Custom hooks de React.
// En React: src/hooks/useProjects.ts, useToast.ts, etc.
// ═══════════════════════════════════════════════════════════════════════════

// useProjects — gestión completa del estado de proyectos
import React from 'react';  
import {STORAGE} from '../lib/storage';
import type{ Project, Ambiente } from '../types';




export function useProjects() {
  const [projects, setProjects] = React.useState<Project[]>(() => STORAGE.load());
  const [activeProjectId, setActiveProjectId] = React.useState<string | null>(null);
  const [activeAmbienteId, setActiveAmbienteId] = React.useState<string | null>(null);

  React.useEffect(() => { STORAGE.save(projects); }, [projects]);

  const activeProject  = projects.find((p: Project)=>p.id===activeProjectId) || null;
  const activeAmbiente = activeProject?.ambientes?.find((a: Ambiente)=>a.id===activeAmbienteId) || activeProject?.ambientes?.[0] || null;

  const updateProject = React.useCallback((id: string | null, fn: (p: Project) => Project) => {
    setProjects(ps => ps.map(p => p.id===id ? { ...fn(p), updatedAt:Date.now() } : p));
  }, []);

  const updateAmbiente = React.useCallback((fn: (a: Ambiente) => Ambiente) => {
    if (!activeProjectId || !activeAmbienteId) return;
    updateProject(activeProjectId, p => ({
      ...p,
      ambientes: p.ambientes.map(a => a.id===activeAmbienteId ? fn(a) : a)
    }));
  }, [activeProjectId, activeAmbienteId, updateProject]);

  const selectProject = (id: string) => {
    setActiveProjectId(id);
    const p = projects.find((x: Project)=>x.id===id);
    setActiveAmbienteId(p?.ambientes?.[0]?.id || null);
  };

  const createProject = () => {
    const p = STORAGE.newProject();
    setProjects(ps => [...ps, p]);
    setActiveProjectId(p.id);
    setActiveAmbienteId(p.ambientes[0].id);
    return p;
  };

  const deleteProject = (id: string) => {
    setProjects(ps => ps.filter((p: Project) => p.id!==id));
    if (activeProjectId===id) { setActiveProjectId(null); setActiveAmbienteId(null); }
  };
  const addProject = (project: Project) => {
    setProjects(prev => [...prev, project]);
  };


  const addAmbiente = () => {
    if (!activeProjectId) return;
    const a = STORAGE.newAmbiente(`Ambiente ${(activeProject?.ambientes?.length||0)+1}`);
    updateProject(activeProjectId, (p: Project) => ({ 
      ...p, 
      ambientes: [...p.ambientes, a],
     }));
    setActiveAmbienteId(a.id);
  };

  const deleteAmbiente = (ambId: string) => {
    if (!activeProjectId) return;
    updateProject(activeProjectId, p => {
      const ambs = p.ambientes.filter(a=>a.id!==ambId);
      return { ...p, ambientes: ambs.length ? ambs : [STORAGE.newAmbiente()] };
    });
    if (activeAmbienteId===ambId) {
      const remainingAmbientes = activeProject?.ambientes?.filter(a => a.id !== ambId) ?? [];
      const newActiveId = remainingAmbientes[0]?.id ?? null;
      setActiveAmbienteId(newActiveId);
      //const remaining = activeProject?.ambientes?.filter(a=>a.id!==ambId);
      //setActiveAmbienteId(remaining?.[0]?.id ?? null);
    }
  };

  return {
    projects, activeProject, activeAmbiente,
    activeProjectId, activeAmbienteId,
    setActiveAmbienteId, selectProject,
    createProject, deleteProject,
    addProject,
    addAmbiente, deleteAmbiente,
    updateProject, updateAmbiente,
  };
}
