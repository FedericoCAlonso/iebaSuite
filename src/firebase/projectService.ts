// Servicio de proyectos Firebase — capa de persistencia en la nube
import {
  collection, doc, setDoc, getDoc, getDocs, addDoc,
  query, where, orderBy, deleteDoc
} from 'firebase/firestore'
import { db } from './config'
import type { Project } from '../types/index'

const COL = 'projects'

// ─── UTILIDAD: LIMPIEZA RECURSIVA DE UNDEFINED ───

/**
 * Recorre recursivamente un objeto o array y devuelve una copia pura
 * donde se eliminan todas las propiedades o elementos con valor `undefined`.
 * Firestore rechaza valores undefined; esta función asegura que el payload
 * sea 100 % compatible antes de cualquier setDoc / addDoc / updateDoc.
 */
export function deepCleanUndefined<T>(value: T): T {
  // Casos base: null, Date o primitivos se devuelven tal cual
  if (value === null || value instanceof Date || typeof value !== 'object') {
    return value
  }

  // Arrays: filtrar elementos undefined y limpiar recursivamente cada item
  if (Array.isArray(value)) {
    return (value as unknown[])
      .filter(item => item !== undefined)
      .map(item => deepCleanUndefined(item)) as unknown as T
  }

  // Objetos: recorrer entradas, omitir undefined, limpiar recursivamente
  const cleaned: Record<string, unknown> = {}
  for (const [key, val] of Object.entries(value)) {
    if (val === undefined) continue
    cleaned[key] = deepCleanUndefined(val)
  }
  return cleaned as T
}

// ─── FÁBRICA DE PROYECTO (NUEVO MODELO RELACIONAL) ───

const generateId = (): string =>
  Date.now().toString() + Math.random().toString(36).slice(2, 9)

/**
 * Crea un nuevo objeto Project que respeta la interfaz relacional.
 * Incluye valores por defecto para inmueble, suministro y estado inicial.
 */
export function createProjectRemote(
  nombre = 'Nuevo Proyecto',
  electricistaId = '',
  clienteId = ''
): Project {
  const now = Date.now()

  return deepCleanUndefined<Project>({
    id: generateId(),
    clienteId,
    electricistaId,
    nombre,
    estado: 'relevamiento',
    inmueble: {
      direccion: '',
      partido: '',
      provincia: '',
      uso: 'residencial'
    },
    suministro: {
      tension: 220,
      fases: 1
    },
    createdAt: now,
    updatedAt: now,

    // Legacy / compatibilidad con el modelo plano anterior
    meta: {
      nombre,
      escala: 50,
      grosor_pared_default: 0.15,
      alturaDefault: 2.6
    },
    ambientes: [],
    circuitos: [],
    conexiones: [],
    tableros: [],
    hojasMaestras: [],
    ownerId: electricistaId,
    sharedWith: []
  })
}

// ─── CRUD REMOTO ───

export async function saveProjectRemote(project: Project): Promise<void> {
  if (!db) throw new Error('Firebase no configurado')
  const ref = doc(db, COL, project.id)
  const cleaned = deepCleanUndefined({ ...project, updatedAt: Date.now() })
  await setDoc(ref, cleaned)
}

/**
 * Guarda un proyecto nuevo sin necesidad de tener ID previo.
 * Devuelve el ID generado por Firestore.
 */
export async function addProjectRemote(
  project: Omit<Project, 'id'>
): Promise<string> {
  if (!db) throw new Error('Firebase no configurado')
  const cleaned = deepCleanUndefined({ ...project, updatedAt: Date.now() })
  const ref = await addDoc(collection(db, COL), cleaned)
  return ref.id
}

export async function loadProjectRemote(id: string): Promise<Project | null> {
  if (!db) throw new Error('Firebase no configurado')
  const snap = await getDoc(doc(db, COL, id))
  if (!snap.exists()) return null
  return deepCleanUndefined(snap.data() as Project)
}

export async function listProjectsRemote(ownerId: string): Promise<Project[]> {
  if (!db) throw new Error('Firebase no configurado')
  const q = query(
    collection(db, COL),
    where('ownerId', '==', ownerId),
    orderBy('updatedAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => deepCleanUndefined(d.data() as Project))
}

export async function deleteProjectRemote(id: string): Promise<void> {
  if (!db) throw new Error('Firebase no configurado')
  const ref = doc(db, COL, id)
  await deleteDoc(ref)
}