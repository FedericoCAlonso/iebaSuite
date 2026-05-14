// Servicio de proyectos Firebase — implementado pero no usado hasta Etapa 2
// El croquizador sigue usando src/lib/storage.ts (localStorage) por ahora
import {
  collection, doc, setDoc, getDoc, getDocs,
  query, where, orderBy, deleteDoc
} from 'firebase/firestore'
import { db } from './config'
import type { Project } from '../types/index'

const COL = 'projects'

export async function saveProjectRemote(project: Project): Promise<void> {
  if (!db) throw new Error('Firebase no configurado')
  const ref = doc(db, COL, project.id)
  const cleaned = limpiarUndefined(project);
  await setDoc(ref, { ...cleaned, updatedAt: Date.now() })
}


export async function loadProjectRemote(id: string): Promise<Project | null> {
  if (!db) throw new Error('Firebase no configurado')
  const snap = await getDoc(doc(db, COL, id))
  return snap.exists() ? (snap.data() as Project) : null
}

export async function listProjectsRemote(ownerId: string): Promise<Project[]> {
  if (!db) throw new Error('Firebase no configurado')
  const q = query(
    collection(db, COL),
    where('ownerId', '==', ownerId),
    orderBy('updatedAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => d.data() as Project)
}

export async function deleteProjectRemote(id: string): Promise<void> {
  if (!db) throw new Error('Firebase no configurado')
  const ref = doc(db, COL, id)
  await deleteDoc(ref)
}

const limpiarUndefined = (obj: any) => {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined)
  );
};

