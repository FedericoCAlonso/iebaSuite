import { doc, setDoc, getDoc } from 'firebase/firestore'
import { db } from './config'
import type { DefinicionSimbolo } from '../lib/symbols'

const COL = 'user_settings'

export async function saveCustomSymbolsRemote(userId: string, customSymbols: DefinicionSimbolo[]): Promise<void> {
  if (!db) throw new Error('Firebase no configurado')
  const ref = doc(db, COL, userId)
  // Usamos merge: true para no pisar otras configuraciones que el usuario pueda tener en el futuro
  await setDoc(ref, { customSymbols, updatedAt: Date.now() }, { merge: true })
}

export async function loadCustomSymbolsRemote(userId: string): Promise<DefinicionSimbolo[]> {
  if (!db) throw new Error('Firebase no configurado')
  const snap = await getDoc(doc(db, COL, userId))
  if (snap.exists() && snap.data().customSymbols) {
    return snap.data().customSymbols as DefinicionSimbolo[]
  }
  return []
}
