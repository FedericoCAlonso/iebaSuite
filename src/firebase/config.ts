/**
 * @module firebase/config
 * Inicialización condicional de los servicios de Firebase para la aplicación.
 *
 * Lee las variables de entorno con prefijo `VITE_FIREBASE_*` y, si existe
 * un `projectId` válido, inicializa: App, Firestore, Storage, Auth y Analytics.
 * Si las variables no están definidas (ej: en tests o entornos sin configurar),
 * todos los exports quedan en `null` y la bandera `isConfigured` es `false`.
 */
import { initializeApp } from 'firebase/app'
import type { FirebaseApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import type { Firestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import type { FirebaseStorage } from 'firebase/storage'
import { getAuth } from 'firebase/auth'
import type { Auth } from 'firebase/auth'
import { getAnalytics } from 'firebase/analytics'
import type { Analytics } from 'firebase/analytics'

/**
 * Limpia una variable de entorno eliminando comillas y espacios en los extremos.
 * Necesario porque algunos entornos de CI/CD envuelven los valores entre comillas.
 *
 * @param val - Valor de la variable de entorno a sanitizar.
 * @returns Cadena limpia, o vacía si el valor es `undefined`.
 */
const sanitize = (val: string | undefined) => {
  if (!val) return ''
  // Elimina comillas dobles, simples y espacios en los extremos
  return val.replace(/['\"]+/g, '').trim()
}

/** Configuración de Firebase construida a partir de las variables de entorno Vite. */
let apiKey = sanitize(import.meta.env.VITE_FIREBASE_API_KEY)
let authDomain = sanitize(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN)
let projectId = sanitize(import.meta.env.VITE_FIREBASE_PROJECT_ID)
let storageBucket = sanitize(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET)
let messagingSenderId = sanitize(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID)
let appId = sanitize(import.meta.env.VITE_FIREBASE_APP_ID)
let measurementId = sanitize(import.meta.env.VITE_FIREBASE_MEASUREMENT_ID)

// Auto-corrección si projectId y appId están invertidos (común al configurar secretos en CI/CD como GitHub Secrets)
if (projectId.includes(':') && !appId.includes(':')) {
  console.warn('Firebase config: Detectados VITE_FIREBASE_PROJECT_ID y VITE_FIREBASE_APP_ID invertidos. Corrigiendo automáticamente...');
  const temp = projectId
  projectId = appId
  appId = temp
}

/** Configuración de Firebase construida a partir de las variables de entorno Vite. */
const firebaseConfig = {
  apiKey,
  authDomain,
  projectId,
  storageBucket,
  messagingSenderId,
  appId,
  measurementId,
}

// Solo inicializar si hay configuración real y válida
const isConfigured = !!firebaseConfig.projectId && 
                     firebaseConfig.projectId !== 'undefined' && 
                     firebaseConfig.projectId !== ''

/** Instancia principal de la aplicación Firebase. `null` si no está configurada. */
export let app: FirebaseApp | null = null
/** Instancia de Firestore (base de datos). `null` si Firebase no está configurado. */
export let db: Firestore | null = null
/** Instancia de Firebase Storage (archivos). `null` si Firebase no está configurado. */
export let storage: FirebaseStorage | null = null
/** Instancia de Firebase Authentication. `null` si Firebase no está configurado. */
export let auth: Auth | null = null
/** Instancia de Firebase Analytics. `null` si Firebase no está configurado. */
export let analytics: Analytics | null = null

if (isConfigured) {
  app = initializeApp(firebaseConfig)
  db = getFirestore(app)
  storage = getStorage(app)
  auth = getAuth(app)
  analytics = getAnalytics(app)
}

export { isConfigured }
