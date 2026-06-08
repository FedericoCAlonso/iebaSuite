import { useState, useEffect, useRef } from 'react';
import {
  saveProjectRemote,
  listProjectsRemote,
  loadProjectRemote,
} from '../firebase/projectService';
import type { Project } from '../types/index';

/**
 * Representa la estructura de un conflicto de sincronización activo.
 */
export interface SyncConflict {
  /** Copia del proyecto con cambios locales */
  localProject: Project;
  /** Copia del proyecto con cambios remotos en la nube */
  remoteProject: Project;
  /** Función que resuelve el conflicto aplicando una acción ('local' o 'cloud') */
  resolve: (action: 'local' | 'cloud') => void;
}

/** Props que recibe el hook `useCloudSync`. */
interface UseCloudSyncProps {
  /** Usuario autenticado actualmente, o `null` si es sesión local. */
  user: { uid: string } | null;
  /** Lista de proyectos del estado local, fuente de verdad para el push. */
  projects: Project[];
  /** Setter del estado de proyectos; se usa para aplicar el merge del pull inicial. */
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
}

/** Delay en ms antes de subir cambios a la nube */
const PUSH_DEBOUNCE_MS = 2000;

/** Clave de localStorage para almacenar la metadata de sincronización */
const LOCAL_SYNC_KEY = 'ieba_last_synced_v1';

/**
 * Hook de sincronización bidireccional con Firebase Firestore.
 *
 * Implementa dos estrategias:
 * 1. **Pull inicial**: Al detectar un usuario autenticado, descarga los proyectos
 *    remotos y los fusiona con el estado local usando `updatedAt` como criterio
 *    de precedencia (el más reciente gana).
 * 2. **Push con debounce**: Cada vez que cambia un proyecto local, espera
 *    `PUSH_DEBOUNCE_MS` ms antes de subir los cambios, evitando escrituras
 *    excesivas durante ediciones rápidas.
 *
 * Detecta y gestiona conflictos cuando una versión remota en la nube es modificada
 * de forma paralela, interrumpiendo el flujo automático para pedir confirmación al usuario.
 *
 * @param props Configuración del hook (usuario, proyectos, setter).
 */
export function useCloudSync({ user, projects, setProjects }: UseCloudSyncProps) {
  // Estado que expone un conflicto de sincronización activo si se detecta
  const [conflict, setConflict] = useState<SyncConflict | null>(null);

  // Mapa de timers activos por ID de proyecto para el debounce del push
  const syncTimeoutRef = useRef<Record<string, number>>({});
  // Bandera que se activa una vez completado el pull inicial (permite o bloquea el push)
  const initialPullDone = useRef(false);

  // Mantiene el registro de cuál fue el último updatedAt sincronizado (para evitar push de cosas viejas)
  const lastSyncedAtRef = useRef<Record<string, number>>({});
  const isSyncLoaded = useRef(false);

  // Inicialización perezosa de los metadatos de sincronización
  if (!isSyncLoaded.current) {
    try {
      const saved = localStorage.getItem(LOCAL_SYNC_KEY);
      lastSyncedAtRef.current = saved ? JSON.parse(saved) : {};
    } catch {
      lastSyncedAtRef.current = {};
    }
    isSyncLoaded.current = true;
  }

  /**
   * Actualiza el registro en memoria y en localStorage del último timestamp de sincronización.
   */
  const setLastSynced = (projectId: string, timestamp: number) => {
    lastSyncedAtRef.current[projectId] = timestamp;
    try {
      localStorage.setItem(LOCAL_SYNC_KEY, JSON.stringify(lastSyncedAtRef.current));
    } catch (e) {
      console.warn('Error saving sync metadata to localStorage:', e);
    }
  };

  /**
   * Fuerza el guardado de un proyecto en Firestore de forma inmediata tras resolver un conflicto.
   */
  const forcePush = async (p: Project) => {
    if (!user) return;
    try {
      const localUp = p.updatedAt || 0;
      await saveProjectRemote({ ...p, electricistaId: user.uid });
      setLastSynced(p.id, localUp);
    } catch (e) {
      console.error(`Error force-saving project ${p.id} to cloud:`, e);
    }
  };

  // ─── PULL INICIAL DESDE LA NUBE ───

  useEffect(() => {
    if (!user) return;

    async function syncPull() {
      try {
        const cloudProjects = await listProjectsRemote(user!.uid);
        let detectedConflict: { local: Project; remote: Project } | null = null;

        setProjects(prev => {
          const merged = [...prev];
          cloudProjects.forEach(cp => {
            const idx = merged.findIndex(p => p.id === cp.id);
            const localUp = idx === -1 ? 0 : (merged[idx].updatedAt || 0);
            const cloudUp = cp.updatedAt || 0;
            const lastSynced = lastSyncedAtRef.current[cp.id] || 0;

            if (idx === -1) {
              // Proyecto nuevo en la nube que no existe localmente
              merged.push(cp);
              setLastSynced(cp.id, cloudUp);
            } else if (cloudUp === localUp) {
              // Versión idéntica
              setLastSynced(cp.id, cloudUp);
            } else {
              const cloudChanged = cloudUp > lastSynced;
              const localChanged = localUp > lastSynced;

              if (cloudChanged && localChanged) {
                // Conflicto: Ambas versiones cambiaron de forma independiente
                detectedConflict = { local: merged[idx], remote: cp };
              } else if (cloudChanged) {
                // Solo la nube cambió: sobrescribir local de forma segura
                merged[idx] = cp;
                setLastSynced(cp.id, cloudUp);
              } else {
                // Solo local cambió: mantener local (se subirá en el push)
                setLastSynced(cp.id, lastSynced);
              }
            }
          });
          return merged.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        });

        // Registrar conflicto tras completar el setProjects para evitar render cycles
        const conflictData = detectedConflict as { local: Project; remote: Project } | null;
        if (conflictData) {
          const { local, remote } = conflictData;
          setConflict({
            localProject: local,
            remoteProject: remote,
            resolve: (action: 'local' | 'cloud') => {
              if (action === 'local') {
                // Para forzar el push, decrementamos el lastSynced para que localUp > lastSynced sea true
                const lastSynced = lastSyncedAtRef.current[local.id] || 0;
                setLastSynced(local.id, lastSynced - 1);
              } else {
                setProjects(current => current.map(proj => proj.id === local.id ? remote : proj));
                setLastSynced(local.id, remote.updatedAt || 0);
              }
              setConflict(null);
            }
          });
        }
        
        initialPullDone.current = true;
      } catch (e) {
        console.error('Error pulling projects from cloud:', e);
        initialPullDone.current = true; // Liberar para permitir uso offline
      }
    }

    syncPull();
  }, [user, setProjects]);

  // ─── PUSH A LA NUBE CON DEBOUNCE ───

  useEffect(() => {
    if (!user || !initialPullDone.current || conflict) return;

    projects.forEach(p => {
      const owner = p.electricistaId;
      if (owner && owner !== user.uid) return;

      const localUp = p.updatedAt || 0;
      const lastSynced = lastSyncedAtRef.current[p.id] || 0;

      // Solo hacer push si el proyecto local es estrictamente más nuevo que el último sincronizado
      if (localUp <= lastSynced) return;

      if (syncTimeoutRef.current[p.id]) {
        window.clearTimeout(syncTimeoutRef.current[p.id]);
      }

      syncTimeoutRef.current[p.id] = window.setTimeout(async () => {
        try {
          // Obtener la versión remota actual para evaluar posibles conflictos
          const remoteProject = await loadProjectRemote(p.id);
          if (remoteProject) {
            const remoteUp = remoteProject.updatedAt || 0;
            // Si la nube tiene cambios más nuevos que nuestro registro y distintos al local actual
            if (remoteUp > lastSynced && remoteUp !== localUp) {
              setConflict({
                localProject: p,
                remoteProject,
                resolve: (action: 'local' | 'cloud') => {
                  if (action === 'local') {
                    forcePush(p);
                  } else {
                    setProjects(prev => prev.map(proj => proj.id === p.id ? remoteProject : proj));
                    setLastSynced(p.id, remoteUp);
                  }
                  setConflict(null);
                }
              });
              return;
            }
          }

          // Guardar normalmente si no hay conflictos
          await saveProjectRemote({ ...p, electricistaId: user.uid });
          setLastSynced(p.id, localUp);
          delete syncTimeoutRef.current[p.id];
        } catch (e) {
          console.error(`Error saving project ${p.id} to cloud:`, e);
        }
      }, PUSH_DEBOUNCE_MS);
    });

    return () => {
      // Limpiar todos los timers pendientes al desmontar o re-ejecutar el efecto
      Object.values(syncTimeoutRef.current).forEach(t => window.clearTimeout(t));
    };
  }, [projects, user, conflict, setProjects]);

  return { conflict, setConflict };
}
