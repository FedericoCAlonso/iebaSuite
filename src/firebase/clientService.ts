// Servicio de clientes Firebase — capa de persistencia en la nube
import {
  collection, doc, setDoc, getDoc, getDocs, addDoc,
  query, where
} from 'firebase/firestore'
import { db } from './config'
import { deepCleanUndefined, assertDb } from './utils'
import type { Cliente } from '../types/index'

const COL = 'clientes'

// ─── CRUD DE CLIENTES ───

/**
 * Crea un nuevo cliente asociado al profesional indicado.
 * Firestore genera el ID automáticamente.
 */
export async function createClient(
  electricistaId: string,
  data: Omit<Cliente, 'id' | 'proyectosIds'>
): Promise<string> {
  assertDb(db)
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
  assertDb(db)
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
  assertDb(db)
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
  assertDb(db)
  const snap = await getDoc(doc(db, COL, id))
  if (!snap.exists()) return null
  return deepCleanUndefined({ id: snap.id, ...snap.data() } as Cliente)
}
