import { useEffect, useRef } from 'react';
import {
  saveProjectRemote,
  listProjectsRemote,
} from '../firebase/projectService';
import type { Project } from '../types/index';

interface UseCloudSyncProps {
  user: { uid: string } | null;
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
}

/** Delay en ms antes de subir cambios a la nube */
const PUSH_DEBOUNCE_MS = 2000;

export function useCloudSync({ user, projects, setProjects }: UseCloudSyncProps) {
  const syncTimeoutRef = useRef<Record<string, number>>({});
  // Mantiene el registro de cuál fue el último updatedAt sincronizado (para evitar push de cosas viejas)
  const lastSyncedAtRef = useRef<Record<string, number>>({});
  const initialPullDone = useRef(false);

  // Sync: Pull desde la nube al iniciar sesión
  useEffect(() => {
    if (!user) return;

    async function syncPull() {
      try {
        const cloudProjects = await listProjectsRemote(user!.uid);
        if (cloudProjects.length === 0) {
          initialPullDone.current = true;
          return;
        }

        setProjects(prev => {
          const merged = [...prev];
          cloudProjects.forEach(cp => {
            const idx = merged.findIndex(p => p.id === cp.id);
            const localUp = idx === -1 ? 0 : (merged[idx].updatedAt || 0);
            const cloudUp = cp.updatedAt || 0;

            if (idx === -1) {
              merged.push(cp);
              lastSyncedAtRef.current[cp.id] = cloudUp;
            } else if (cloudUp > localUp) {
              merged[idx] = cp;
              lastSyncedAtRef.current[cp.id] = cloudUp;
            } else {
              // El local es igual o más nuevo, lo registramos para no pushear innecesariamente si es igual
              if (localUp === cloudUp) {
                lastSyncedAtRef.current[cp.id] = localUp;
              }
            }
          });
          return merged.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        });
        
        initialPullDone.current = true;
      } catch (e) {
        console.error('Error pulling projects from cloud:', e);
        initialPullDone.current = true; // Liberar para permitir uso offline
      }
    }

    syncPull();
  }, [user, setProjects]);

  // Sync: Push a la nube con debounce al cambiar proyectos
  useEffect(() => {
    if (!user || !initialPullDone.current) return;

    projects.forEach(p => {
      const owner = p.electricistaId || p.ownerId;
      if (owner !== user.uid && owner) return; // no tocar proyectos ajenos

      const localUp = p.updatedAt || 0;
      const lastSynced = lastSyncedAtRef.current[p.id] || 0;

      // Solo hacer push si el proyecto local es estrictamente más nuevo que el último sincronizado
      if (localUp <= lastSynced) return;

      if (syncTimeoutRef.current[p.id]) {
        window.clearTimeout(syncTimeoutRef.current[p.id]);
      }

      syncTimeoutRef.current[p.id] = window.setTimeout(async () => {
        try {
          await saveProjectRemote({ ...p, electricistaId: user.uid });
          lastSyncedAtRef.current[p.id] = localUp;
          delete syncTimeoutRef.current[p.id];
        } catch (e) {
          console.error(`Error saving project ${p.id} to cloud:`, e);
        }
      }, PUSH_DEBOUNCE_MS);
    });

    return () => {
      Object.values(syncTimeoutRef.current).forEach(t => window.clearTimeout(t));
    };
  }, [projects, user]);
}
