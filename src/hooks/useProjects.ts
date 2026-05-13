import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  loadProjects, 
  saveProjects, 
  createProject as createNewProject, 
  createAmbiente as createNewAmbiente 
} from '../lib/storage';
import { loadSymbolsAsync, saveSymbols, fetchDefaultSymbols } from '../lib/symbols';
import { loadLayoutAsync } from '../lib/layout';
import { calcularTransformacionEnlace } from '../lib/geometry';
import { saveProjectRemote, listProjectsRemote, deleteProjectRemote } from '../firebase/projectService';
import { saveCustomSymbolsRemote, loadCustomSymbolsRemote } from '../firebase/symbolService';
import { useAuth } from '../hub/AuthContext';
import type { DefinicionSimbolo } from '../lib/symbols';
import type { Project, Ambiente } from '../types/index';

export function useProjects() {
  const { user } = useAuth();
  
  // Estado principal: lista de proyectos cargada desde localStorage
  const [projects, setProjects] = useState<Project[]>(() => loadProjects());
  
  // IDs de seguimiento para la navegación y edición
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeAmbienteId, setActiveAmbienteId] = useState<string | null>(null);

  // Historial de deshacer (Undo) local a la sesión del ambiente actual
  const [ambienteHistory, setAmbienteHistory] = useState<Ambiente[]>([]);

  // Librería de símbolos
  const [symbolsLib, setSymbolsLib] = useState<DefinicionSimbolo[]>([]);

  // Cargar símbolos y layout asíncronamente al iniciar
  useEffect(() => {
    loadSymbolsAsync().then(setSymbolsLib);
    loadLayoutAsync().then(layout => {
      (window as any).layoutConfig = layout;
    });
  }, []);

  // Sync: Pull from Cloud on Login
  useEffect(() => {
    // Si no hay usuario, cargamos desde localStorage (modo offline/fallback)
    if (!user) {
      setProjects(loadProjects());
      loadSymbolsAsync().then(setSymbolsLib);
      return;
    }

    async function syncPull() {
      try {
        // Cargar proyectos y símbolos en paralelo
        const [cloudProjects, customSymbols, defaultSymbols] = await Promise.all([
          listProjectsRemote(user!.uid),
          loadCustomSymbolsRemote(user!.uid),
          fetchDefaultSymbols()
        ]);

        // 1. Setear proyectos
        if (cloudProjects.length > 0) {
          setProjects(prev => {
            const merged = [...prev];
            cloudProjects.forEach(cp => {
              const idx = merged.findIndex(p => p.id === cp.id);
              if (idx === -1) {
                merged.push(cp);
              } else if (cp.updatedAt > (merged[idx].updatedAt || 0)) {
                merged[idx] = cp;
              }
            });
            return merged.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
          });
        }

        // 2. Mezclar símbolos por defecto con los personalizados de la nube
        const mergedSymbols = [...defaultSymbols, ...customSymbols];
        setSymbolsLib(mergedSymbols);
        // Guardar en localStorage como backup
        saveSymbols(mergedSymbols);

      } catch (e) {
        console.error("Error pulling data from cloud:", e);
      }
    }
    syncPull();
  }, [user]);

  // Sync: Push to Cloud on change (Debounced)
  const syncTimeoutRef = useRef<Record<string, number>>({});

  useEffect(() => {
    if (!user) return;

    projects.forEach(p => {
      // Solo sincronizar si el usuario es el dueño o si no tiene dueño aún (y lo tomamos)
      if (p.ownerId === user.uid || !p.ownerId) {
        // Debounce por proyecto
        if (syncTimeoutRef.current[p.id]) {
          window.clearTimeout(syncTimeoutRef.current[p.id]);
        }
        syncTimeoutRef.current[p.id] = window.setTimeout(async () => {
          try {
            // Aseguramos que el proyecto tenga el ownerId antes de subirlo si no lo tenía
            const projectToSave = { ...p, ownerId: user.uid };
            await saveProjectRemote(projectToSave);
            delete syncTimeoutRef.current[p.id];
          } catch (e) {
            console.error(`Error saving project ${p.id} to cloud:`, e);
          }
        }, 2000); 
      }
    });

    return () => {
      Object.values(syncTimeoutRef.current).forEach(t => window.clearTimeout(t));
    };
  }, [projects, user]);


  // Limpiar el historial cuando se cambia de ambiente activo
  useEffect(() => {
    setAmbienteHistory([]);
  }, [activeAmbienteId]);

  // Efecto de persistencia y Migración
  useEffect(() => { 
    // MIGRACIÓN: De Pixels a Metros para posiciones de elementos y textos
    const migratedProjects = projects.map(p => {
      const newAmbientes = p.ambientes.map(amb => {
        const needsMigration = amb.elementos.some(el => (el.paredPos || 0) > 40 || Math.abs(el.x) > 100);
        if (needsMigration) {
          const esc = p.meta.escala;
          const elementos = amb.elementos.map(el => ({
            ...el,
            x: el.x * esc / 1000,
            y: el.y * esc / 1000,
            paredPos: el.paredPos ? el.paredPos * esc / 1000 : null
          }));
          const textos = amb.textos?.map(t => ({
            ...t,
            x: t.x * esc / 1000,
            y: t.y * esc / 1000
          }));
          return { ...amb, elementos, textos };
        }
        return amb;
      });

      if (newAmbientes.some((a, i) => a !== p.ambientes[i])) {
        return { ...p, ambientes: newAmbientes };
      }
      return p;
    });

    if (migratedProjects.some((p, i) => p !== projects[i])) {
      setProjects(migratedProjects);
      return; 
    }

    saveProjects(projects); 
  }, [projects]);

  // --- Selectores ---
  
  const activeProject = projects.find(p => p.id === activeProjectId) || null;
  const activeAmbiente = activeProject?.ambientes.find(a => a.id === activeAmbienteId) 
    || activeProject?.ambientes[0] 
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
    setActiveAmbienteId(p?.ambientes[0]?.id || null);
  }, [projects]);

  const handleCreateProject = useCallback(() => {
    const p = createNewProject();
    if (user) {
      p.ownerId = user.uid;
      // Guardado inmediato en la nube para creación
      saveProjectRemote(p).catch(err => console.error("Error saving new project to cloud:", err));
    }
    setProjects(prev => [...prev, p]);
    setActiveProjectId(p.id);
    setActiveAmbienteId(p.ambientes[0].id);
    return p;
  }, [user]);

  const deleteProject = useCallback((id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    if (user) {
      deleteProjectRemote(id).catch(err => console.error("Error deleting project from cloud:", err));
    }
    if (activeProjectId === id) {
      setActiveProjectId(null);
      setActiveAmbienteId(null);
    }
  }, [activeProjectId, user]);

  // --- Operaciones de Ambiente ---

  const updateAmbiente = useCallback((fn: (a: Ambiente) => Ambiente) => {
    if (!activeProjectId || !activeAmbienteId) return;

    updateProject(activeProjectId, (project) => ({
      ...project,
      ambientes: project.ambientes.map(a => {
        if (a.id === activeAmbienteId) {
            const next = fn(a);
            setAmbienteHistory(h => [...h, a].slice(-20));
            return next;
        }
        return a;
      })
    }));
  }, [activeProjectId, activeAmbienteId, updateProject]);

  const undoAmbiente = useCallback(() => {
    if (ambienteHistory.length === 0 || !activeProjectId || !activeAmbienteId) return;
    
    const prev = ambienteHistory[ambienteHistory.length - 1];
    setAmbienteHistory(h => h.slice(0, -1));
    
    updateProject(activeProjectId, project => ({
      ...project,
      ambientes: project.ambientes.map(a => a.id === activeAmbienteId ? prev : a)
    }));
  }, [ambienteHistory, activeProjectId, activeAmbienteId, updateProject]);

  const addAmbiente = useCallback(() => {
    if (!activeProjectId || !activeProject) return;
    const nuevoAmbiente = createNewAmbiente(`Ambiente ${activeProject.ambientes.length + 1}`);
    
    updateProject(activeProjectId, project => ({
      ...project,
      ambientes: [...project.ambientes, nuevoAmbiente]
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

  const enlazarAberturas = useCallback((proyectoId: string, ambA_id: string, abA_id: string, ambB_id: string, abB_id: string) => {
    updateProject(proyectoId, (project) => {
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

  const updateSymbols = useCallback((newLibrary: DefinicionSimbolo[]) => {
    setSymbolsLib(newLibrary);
    saveSymbols(newLibrary);

    if (user) {
      const customOnly = newLibrary.filter(s => s.id.startsWith('sym-custom-'));
      saveCustomSymbolsRemote(user.uid, customOnly).catch(console.error);
    }
  }, [user]);

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
    setSymbolsLib: updateSymbols,
    addProject,
    enlazarAberturas
  };
}