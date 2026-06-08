// Servicio de mediciones eléctricas — capa de persistencia en Firebase
import {
  collection, doc, setDoc, getDoc, getDocs, addDoc,
  query, where, deleteDoc
} from 'firebase/firestore'
import { db } from './config'
import { assertDb } from './utils'
import type { Measurement } from '../types/index'

// ─── CONSTANTES ───────────────────────────────────────────────────────────────

/** Nombre de la colección de mediciones en Firestore. */
const COL = 'measurements'

// ─── OPERACIONES CRUD ─────────────────────────────────────────────────────────

/**
 * Guarda una medición en Firestore. Si ya existe un documento con el mismo ID
 * lo actualiza mediante merge; si no existe, lo crea.
 *
 * @param m - Objeto de medición completo, incluyendo su `id`.
 * @returns Promesa que se resuelve cuando la escritura finaliza.
 */
export async function saveMeasurementRemote(m: Measurement): Promise<void> {
  assertDb(db)
  const ref = doc(db, COL, m.id)
  await setDoc(ref, m, { merge: true })
}

/**
 * Agrega una nueva medición a Firestore con un ID generado automáticamente
 * por la base de datos.
 *
 * @param m - Datos de la medición sin el campo `id` (lo asigna Firestore).
 * @returns Promesa que resuelve con el ID generado para el nuevo documento.
 */
export async function addMeasurementRemote(
  m: Omit<Measurement, 'id'>
): Promise<string> {
  assertDb(db)
  const ref = await addDoc(collection(db, COL), m)
  return ref.id
}

/**
 * Carga una medición específica desde Firestore por su ID.
 *
 * @param id - Identificador único del documento de medición.
 * @returns Promesa que resuelve con el objeto `Measurement` o `null` si no existe.
 */
export async function loadMeasurementRemote(id: string): Promise<Measurement | null> {
  assertDb(db)
  const snap = await getDoc(doc(db, COL, id))
  if (!snap.exists()) return null
  return snap.data() as Measurement
}

// ─── CONSULTAS ────────────────────────────────────────────────────────────────

/**
 * Obtiene todas las mediciones asociadas a un proyecto, ordenadas por
 * timestamp descendente (más recientes primero).
 *
 * @param projectId - ID del proyecto cuyas mediciones se quieren listar.
 * @returns Promesa que resuelve con el array de mediciones del proyecto.
 */
export async function listMeasurementsByProject(projectId: string): Promise<Measurement[]> {
  assertDb(db)
  const q = query(
    collection(db, COL),
    where('projectId', '==', projectId)
  )
  const snap = await getDocs(q)
  const measurements = snap.docs.map(d => ({ id: d.id, ...d.data() } as Measurement))
  return measurements.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
}

/**
 * Obtiene las mediciones de un proyecto filtradas además por tipo de módulo,
 * ordenadas por timestamp descendente.
 *
 * @param projectId  - ID del proyecto a consultar.
 * @param moduleType - Tipo de módulo eléctrico por el que filtrar (e.g. 'iluminacion', 'tomacorriente').
 * @returns Promesa que resuelve con el array filtrado de mediciones.
 */
export async function listMeasurementsByProjectAndType(
  projectId: string,
  moduleType: Measurement['moduleType']
): Promise<Measurement[]> {
  assertDb(db)
  const q = query(
    collection(db, COL),
    where('projectId', '==', projectId),
    where('moduleType', '==', moduleType)
  )
  const snap = await getDocs(q)
  const measurements = snap.docs.map(d => ({ id: d.id, ...d.data() } as Measurement))
  return measurements.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
}

// ─── ELIMINACIÓN ──────────────────────────────────────────────────────────────

/**
 * Elimina permanentemente una medición de Firestore.
 *
 * @param id - Identificador único del documento a eliminar.
 * @returns Promesa que se resuelve cuando el documento ha sido borrado.
 */
export async function deleteMeasurementRemote(id: string): Promise<void> {
  assertDb(db)
  await deleteDoc(doc(db, COL, id))
}
