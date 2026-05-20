import type { Firestore } from 'firebase/firestore'

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

/**
 * Valida que Firestore esté inicializado.
 * Lanza error claro si Firebase no fue configurado.
 */
export function assertDb(db: Firestore | null): asserts db is Firestore {
  if (!db) throw new Error('Firebase no configurado')
}
