// src/hub/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider
} from 'firebase/auth'
import type { User } from 'firebase/auth'
import { auth } from '../firebase/config'

// ─── INTERFAZ DEL CONTEXTO ────────────────────────────────────────────────────

/**
 * Valor expuesto por `AuthContext` a todos los componentes descendientes.
 */
interface AuthContextValue {
  /** Usuario de Firebase actualmente autenticado, o `null` si no hay sesión. */
  user: User | null
  /** `true` mientras se resuelve el estado inicial de autenticación con Firebase. */
  loading: boolean
  /**
   * Inicia sesión mediante la ventana emergente de OAuth de Google.
   * @throws Error si Firebase Auth no está configurado.
   */
  signInWithGoogle: () => Promise<void>
  /**
   * Inicia sesión con correo electrónico y contraseña.
   * @param email    - Dirección de correo del usuario.
   * @param password - Contraseña del usuario.
   * @throws Error si Firebase Auth no está configurado o las credenciales son inválidas.
   */
  signInWithEmail: (email: string, password: string) => Promise<void>
  /**
   * Crea una nueva cuenta con correo electrónico y contraseña.
   * @param email    - Dirección de correo para la nueva cuenta.
   * @param password - Contraseña para la nueva cuenta.
   * @throws Error si Firebase Auth no está configurado.
   */
  registerWithEmail: (email: string, password: string) => Promise<void>
  /**
   * Cierra la sesión del usuario actual.
   * No lanza error si Firebase Auth no está disponible.
   */
  logout: () => Promise<void>
}

// ─── CONTEXTO ─────────────────────────────────────────────────────────────────

/**
 * Contexto React que provee el estado de autenticación y las acciones
 * asociadas a toda la aplicación. Inicialmente es `null` para detectar
 * usos fuera del provider.
 */
const AuthContext = createContext<AuthContextValue | null>(null)

// ─── PROVIDER ─────────────────────────────────────────────────────────────────

/**
 * Proveedor del contexto de autenticación. Suscribe al listener de Firebase
 * `onAuthStateChanged` para mantener el estado `user` sincronizado con la
 * sesión activa. Debe envolver la raíz de la aplicación (o la parte que
 * requiere autenticación).
 *
 * @param children - Árbol de componentes que tendrán acceso al contexto.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Suscripción al cambio de estado de autenticación de Firebase
  useEffect(() => {
    if (!auth) { setLoading(false); return }
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u)
      setLoading(false)
    })
    return unsub
  }, [])

  async function signInWithGoogle() {
    if (!auth) throw new Error('Firebase no configurado')
    await signInWithPopup(auth, new GoogleAuthProvider())
  }

  async function signInWithEmail(email: string, password: string) {
    if (!auth) throw new Error('Firebase no configurado')
    await signInWithEmailAndPassword(auth, email, password)
  }

  async function registerWithEmail(email: string, password: string) {
    if (!auth) throw new Error('Firebase no configurado')
    await createUserWithEmailAndPassword(auth, email, password)
  }

  async function logout() {
    if (!auth) return
    await signOut(auth)
  }

  return (
    <AuthContext.Provider value={{
      user, loading,
      signInWithGoogle, signInWithEmail,
      registerWithEmail, logout
    }}>
      {children}
    </AuthContext.Provider>
  )
}

// ─── HOOK ─────────────────────────────────────────────────────────────────────

/**
 * Hook que consume el `AuthContext`. Provee acceso al usuario autenticado y
 * las funciones de inicio/cierre de sesión.
 *
 * @returns El valor completo de `AuthContextValue`.
 * @throws Error si se usa fuera de un `AuthProvider`.
 */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
