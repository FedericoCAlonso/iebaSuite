// Servicio de perfil del profesional Firebase — capa de persistencia en la nube
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { db } from './config'
import { deepCleanUndefined, assertDb } from './utils'
import type { Electricista } from '../types/index'

/** Nombre de la colección de usuarios en Firestore. */
const COL = 'users'

// ─── PERFIL DEL PROFESIONAL ───────────────────────────────────────────────────

/**
 * Recupera el perfil del profesional (electricista) desde Firestore.
 * Aplica limpieza de valores `undefined` antes de retornar.
 *
 * @param uid - UID de Firebase Auth del usuario cuyo perfil se quiere obtener.
 * @returns Promesa que resuelve con el objeto `Electricista` o `null` si el
 *          documento no existe todavía en la base de datos.
 */
export async function getProfile(uid: string): Promise<Electricista | null> {
  assertDb(db)
  const snap = await getDoc(doc(db, COL, uid))
  if (!snap.exists()) return null
  return deepCleanUndefined(snap.data() as Electricista)
}

/**
 * Persiste datos del perfil del profesional en Firestore utilizando merge,
 * de modo que solo se sobreescriben los campos provistos. Actualiza
 * automáticamente el campo `updatedAt` con el timestamp actual.
 *
 * @param uid         - UID de Firebase Auth del usuario a actualizar.
 * @param profileData - Campos parciales del perfil a guardar o actualizar.
 * @returns Promesa que se resuelve cuando la escritura finaliza.
 */
export async function saveProfile(
  uid: string,
  profileData: Partial<Electricista>
): Promise<void> {
  assertDb(db)
  const ref = doc(db, COL, uid)
  const cleaned = deepCleanUndefined({
    ...profileData,
    updatedAt: Date.now()
  })
  await setDoc(ref, cleaned, { merge: true })
}
