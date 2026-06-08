// Servicio de símbolos personalizados — persistencia en Firestore bajo la colección user_settings
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { db } from './config'
import type { DefinicionSimbolo } from '../lib/symbols'

/** Nombre de la colección donde se guardan las preferencias por usuario. */
const COL = 'user_settings'

// ─── SÍMBOLOS PERSONALIZADOS ──────────────────────────────────────────────────

/**
 * Persiste la librería de símbolos personalizados del usuario en Firestore.
 * Utiliza `merge: true` para no sobreescribir otras configuraciones que el
 * documento del usuario pueda contener en el futuro.
 *
 * @param userId       - UID de Firebase Auth del usuario propietario de los símbolos.
 * @param customSymbols - Array de definiciones de símbolo personalizado a guardar.
 * @returns Promesa que se resuelve cuando la escritura finaliza.
 * @throws Error si Firebase no está configurado (`db` es falsy).
 */
export async function saveCustomSymbolsRemote(userId: string, customSymbols: DefinicionSimbolo[]): Promise<void> {
  if (!db) throw new Error('Firebase no configurado')
  const ref = doc(db, COL, userId)
  // Usamos merge: true para no pisar otras configuraciones que el usuario pueda tener en el futuro
  await setDoc(ref, { customSymbols, updatedAt: Date.now() }, { merge: true })
}

/**
 * Carga la librería de símbolos personalizados del usuario desde Firestore.
 * Si el documento no existe o no tiene el campo `customSymbols`, retorna un
 * array vacío sin lanzar error.
 *
 * @param userId - UID de Firebase Auth del usuario cuyos símbolos se quieren cargar.
 * @returns Promesa que resuelve con el array de `DefinicionSimbolo` guardados,
 *          o un array vacío si el usuario aún no tiene símbolos en la nube.
 * @throws Error si Firebase no está configurado (`db` es falsy).
 */
export async function loadCustomSymbolsRemote(userId: string): Promise<DefinicionSimbolo[]> {
  if (!db) throw new Error('Firebase no configurado')
  const snap = await getDoc(doc(db, COL, userId))
  if (snap.exists() && snap.data().customSymbols) {
    return snap.data().customSymbols as DefinicionSimbolo[]
  }
  return []
}
