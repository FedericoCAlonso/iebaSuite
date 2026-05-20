// Servicio de mediciones eléctricas — capa de persistencia en Firebase
import {
  collection, doc, setDoc, getDoc, getDocs, addDoc,
  query, where, orderBy, deleteDoc
} from 'firebase/firestore'
import { db } from './config'
import { assertDb } from './utils'
import type { Measurement } from '../types/index'

const COL = 'measurements'

/**
 * Guarda una medición (crea o actualiza).
 */
export async function saveMeasurementRemote(m: Measurement): Promise<void> {
  assertDb(db)
  const ref = doc(db, COL, m.id)
  await setDoc(ref, m, { merge: true })
}

/**
 * Agrega una nueva medición con ID generado por Firestore.
 */
export async function addMeasurementRemote(
  m: Omit<Measurement, 'id'>
): Promise<string> {
  assertDb(db)
  const ref = await addDoc(collection(db, COL), m)
  return ref.id
}

/**
 * Carga una medición por ID.
 */
export async function loadMeasurementRemote(id: string): Promise<Measurement | null> {
  assertDb(db)
  const snap = await getDoc(doc(db, COL, id))
  if (!snap.exists()) return null
  return snap.data() as Measurement
}

/**
 * Lista todas las mediciones de un proyecto.
 */
export async function listMeasurementsByProject(projectId: string): Promise<Measurement[]> {
  assertDb(db)
  const q = query(
    collection(db, COL),
    where('projectId', '==', projectId),
    orderBy('timestamp', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Measurement))
}

/**
 * Lista mediciones de un proyecto filtradas por tipo.
 */
export async function listMeasurementsByProjectAndType(
  projectId: string,
  moduleType: Measurement['moduleType']
): Promise<Measurement[]> {
  assertDb(db)
  const q = query(
    collection(db, COL),
    where('projectId', '==', projectId),
    where('moduleType', '==', moduleType),
    orderBy('timestamp', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Measurement))
}

/**
 * Elimina una medición.
 */
export async function deleteMeasurementRemote(id: string): Promise<void> {
  assertDb(db)
  await deleteDoc(doc(db, COL, id))
}
