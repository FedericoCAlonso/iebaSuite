// Servicio de clientes Firebase — capa de persistencia en la nube
import {
  collection, doc, setDoc, getDoc, getDocs, addDoc,
  query, where
} from 'firebase/firestore'
import { db } from './config'
import type { Cliente } from '../types/index'

const COL = 'clientes'

// ─── UTILIDAD: LIMPIEZA RECURSIVA DE UNDEFINED ───

/**
 * Recorre recursivamente un objeto o array y devuelve una copia pura
 * donde se eliminan todas las propiedades o elementos con valor `undefined`.
 * Firestore rechaza valores undefined; esta función asegura que el payload
 * sea 100 % compatible antes de cualquier setDoc / addDoc / updateDoc.
 */
export function deepCleanUndefined<T>(value: T): T {
  if (value === null || value instanceof Date || typeof value !== 'object') {
    return value
  }

  if (Array.isArray(value)) {
    return (value as unknown[])
      .filter(item => item !== undefined)
      .map(item => deepCleanUndefined(item)) as unknown as T
  }

  const cleaned: Record<string, unknown> = {}
  for (const [key, val] of Object.entries(value)) {
    if (val === undefined) continue
    cleaned[key] = deepCleanUndefined(val)
  }
  return cleaned as T
}

// ─── CRUD DE CLIENTES ───

/**
 * Crea un nuevo cliente asociado al profesional indicado.
 * Firestore genera el ID automáticamente.
 */
export async function createClient(
  electricistaId: string,
  data: Omit<Cliente, 'id' | 'proyectosIds'>
): Promise<string> {
  if (!db) throw new Error('Firebase no configurado')
  const colRef = collection(db, COL)
  const cleaned = deepCleanUndefined({
    ...data,
    proyectosIds: [],
    electricistaId,
    createdAt: Date.now()
  })
  const ref = await addDoc(colRef, cleaned)
  return ref.id
}

/**
 * Actualiza los datos de un cliente existente.
 * Se limpian valores undefined y se evita sobrescribir el id del documento.
 */
export async function updateClient(
  id: string,
  data: Partial<Cliente>
): Promise<void> {
  if (!db) throw new Error('Firebase no configurado')
  const ref = doc(db, COL, id)
  const { id: _id, ...rest } = data
  const cleaned = deepCleanUndefined(rest)
  await setDoc(ref, cleaned, { merge: true })
}

/**
 * Devuelve la lista de clientes registrados por un profesional,
 * ordenados alfabéticamente por razón social.
 */
export async function listClients(electricistaId: string): Promise<Cliente[]> {
  if (!db) throw new Error('Firebase no configurado')
  const q = query(
    collection(db, COL),
    where('electricistaId', '==', electricistaId)
  )
  const snap = await getDocs(q)
  return snap.docs
    .map(d => deepCleanUndefined({ id: d.id, ...d.data() } as Cliente))
    .sort((a, b) => a.razonSocial.localeCompare(b.razonSocial))
}

/**
 * Obtiene un cliente específico por su ID.
 */
export async function getClient(id: string): Promise<Cliente | null> {
  if (!db) throw new Error('Firebase no configurado')
  const snap = await getDoc(doc(db, COL, id))
  if (!snap.exists()) return null
  return deepCleanUndefined({ id: snap.id, ...snap.data() } as Cliente)
}