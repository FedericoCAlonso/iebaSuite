// Servicio de perfil del profesional Firebase — capa de persistencia en la nube
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { db } from './config'
import type { Electricista } from '../types/index'

const COL = 'users'

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

// ─── PERFIL DEL PROFESIONAL ───

export async function getProfile(uid: string): Promise<Electricista | null> {
  if (!db) throw new Error('Firebase no configurado')
  const snap = await getDoc(doc(db, COL, uid))
  if (!snap.exists()) return null
  return deepCleanUndefined(snap.data() as Electricista)
}

export async function saveProfile(
  uid: string,
  profileData: Partial<Electricista>
): Promise<void> {
  if (!db) throw new Error('Firebase no configurado')
  const ref = doc(db, COL, uid)
  const cleaned = deepCleanUndefined({
    ...profileData,
    updatedAt: Date.now()
  })
  await setDoc(ref, cleaned, { merge: true })
}