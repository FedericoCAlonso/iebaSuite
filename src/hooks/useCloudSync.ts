// ═══════════════════════════════════════════════════════════════════════════
// HOOK: useCloudSync
// Sincronización bidireccional con Firebase Firestore.
//   - Pull: al iniciar sesión, trae proyectos del servidor y los fusiona.
//   - Push: cada vez que cambia la lista local, sube cada proyecto
//           del usuario con debounce de 2 segundos.
// ═══════════════════════════════════════════════════════════════════════════
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
  // Sync: Pull desde la nube al iniciar sesión
  useEffect(() => {
    if (!user) return;

    async function syncPull() {
      try {
        const cloudProjects = await listProjectsRemote(user!.uid);
        if (cloudProjects.length === 0) return;

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
      } catch (e) {
        console.error('Error pulling projects from cloud:', e);
      }
    }

    syncPull();
  }, [user, setProjects]);

  // Sync: Push a la nube con debounce al cambiar proyectos
  const syncTimeoutRef = useRef<Record<string, number>>({});

  useEffect(() => {
    if (!user) return;

    projects.forEach(p => {
      const owner = p.electricistaId || p.ownerId;
      if (owner !== user.uid && owner) return; // no tocar proyectos ajenos

      if (syncTimeoutRef.current[p.id]) {
        window.clearTimeout(syncTimeoutRef.current[p.id]);
      }

      syncTimeoutRef.current[p.id] = window.setTimeout(async () => {
        try {
          await saveProjectRemote({ ...p, electricistaId: user.uid });
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
