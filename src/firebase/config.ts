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

const sanitize = (val: string | undefined) => {
  if (!val) return ''
  // Elimina comillas dobles, simples y espacios en los extremos
  return val.replace(/['"]+/g, '').trim()
}

const firebaseConfig = {
  apiKey: sanitize(import.meta.env.VITE_FIREBASE_API_KEY),
  authDomain: sanitize(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
  projectId: sanitize(import.meta.env.VITE_FIREBASE_PROJECT_ID),
  storageBucket: sanitize(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: sanitize(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
  appId: sanitize(import.meta.env.VITE_FIREBASE_APP_ID),
  measurementId: sanitize(import.meta.env.VITE_FIREBASE_MEASUREMENT_ID),
}

// Solo inicializar si hay configuración real
const isConfigured = !!firebaseConfig.projectId

export let app: FirebaseApp | null = null
export let db: Firestore | null = null
export let storage: FirebaseStorage | null = null
export let auth: Auth | null = null
export let analytics: Analytics | null = null

if (isConfigured) {
  app = initializeApp(firebaseConfig)
  db = getFirestore(app)
  storage = getStorage(app)
  auth = getAuth(app)
  analytics = getAnalytics(app)
}
// Agrega esto temporalmente en src/firebase/config.ts antes del export
console.log("Firebase Config Check:", {
  hasApiKey: !!firebaseConfig.apiKey,
  keyLength: firebaseConfig.apiKey.length,
  projectId: firebaseConfig.projectId
});
export { isConfigured }
