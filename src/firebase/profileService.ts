// Servicio de perfil del profesional Firebase — capa de persistencia en la nube
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { db } from './config'
import { deepCleanUndefined, assertDb } from './utils'
import type { Electricista } from '../types/index'

const COL = 'users'

// ─── PERFIL DEL PROFESIONAL ───

export async function getProfile(uid: string): Promise<Electricista | null> {
  assertDb(db)
  const snap = await getDoc(doc(db, COL, uid))
  if (!snap.exists()) return null
  return deepCleanUndefined(snap.data() as Electricista)
}

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
