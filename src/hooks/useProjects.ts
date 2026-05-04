// ═══════════════════════════════════════════════════════════════════════════
// MODULE: hooks.js
// Custom hooks de React.
// En React: src/hooks/useProjects.ts, useToast.ts, etc.
// ═══════════════════════════════════════════════════════════════════════════

// useProjects — gestión completa del estado de proyectos
import React from 'react';  
import {STORAGE} from '../lib/storage';




export function useProjects() {
  const [projects, setProjects] = React.useState(() => STORAGE.load());
  const [activeProjectId, setActiveProjectId] = React.useState(null);
  const [activeAmbienteId, setActiveAmbienteId] = React.useState(null);

  React.useEffect(() => { STORAGE.save(projects); }, [projects]);

  const activeProject  = projects.find(p=>p.id===activeProjectId) || null;
  const activeAmbiente = activeProject?.ambientes?.find(a=>a.id===activeAmbienteId) || activeProject?.ambientes?.[0] || null;

  const updateProject = React.useCallback((id, fn) => {
    setProjects(ps => ps.map(p => p.id===id ? { ...fn(p), updatedAt:Date.now() } : p));
  }, []);

  const updateAmbiente = React.useCallback((fn) => {
    if (!activeProjectId || !activeAmbienteId) return;
    updateProject(activeProjectId, p => ({
      ...p,
      ambientes: p.ambientes.map(a => a.id===activeAmbienteId ? fn(a) : a)
    }));
  }, [activeProjectId, activeAmbienteId, updateProject]);

  const selectProject = (id) => {
    setActiveProjectId(id);
    const p = projects.find(x=>x.id===id);
    setActiveAmbienteId(p?.ambientes?.[0]?.id || null);
  };

  const createProject = () => {
    const p = STORAGE.newProject();
    setProjects(ps => [...ps, p]);
    setActiveProjectId(p.id);
    setActiveAmbienteId(p.ambientes[0].id);
    return p;
  };

  const deleteProject = (id) => {
    setProjects(ps => ps.filter(p => p.id!==id));
    if (activeProjectId===id) { setActiveProjectId(null); setActiveAmbienteId(null); }
  };

  const addAmbiente = () => {
    if (!activeProjectId) return;
    const a = STORAGE.newAmbiente(`Ambiente ${(activeProject?.ambientes?.length||0)+1}`);
    updateProject(activeProjectId, p => ({ ...p, ambientes: [...p.ambientes, a] }));
    setActiveAmbienteId(a.id);
  };

  const deleteAmbiente = (ambId) => {
    if (!activeProjectId) return;
    updateProject(activeProjectId, p => {
      const ambs = p.ambientes.filter(a=>a.id!==ambId);
      return { ...p, ambientes: ambs.length ? ambs : [STORAGE.newAmbiente()] };
    });
    if (activeAmbienteId===ambId) {
      const remaining = activeProject?.ambientes?.filter(a=>a.id!==ambId);
      setActiveAmbienteId(remaining?.[0]?.id || null);
    }
  };

  return {
    projects, activeProject, activeAmbiente,
    activeProjectId, activeAmbienteId,
    setActiveAmbienteId, selectProject,
    createProject, deleteProject,
    addAmbiente, deleteAmbiente,
    updateProject, updateAmbiente,
  };
}
