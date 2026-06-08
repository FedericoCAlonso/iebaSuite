// src/core/ProfileContext.tsx
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { getProfile, saveProfile } from '../firebase/profileService'
import type { Electricista } from '../types/index'

// ─── INTERFAZ DEL CONTEXTO ────────────────────────────────────────────────────

/**
 * Valor expuesto por `ProfileContext` a los componentes consumidores.
 */
interface ProfileContextValue {
  /** Datos del perfil del profesional actualmente autenticado, o `null` si no se cargó aún. */
  profile: Electricista | null
  /** `true` mientras se realiza la carga inicial del perfil desde Firestore. */
  isLoadingProfile: boolean
  /**
   * Actualiza parcialmente el perfil del usuario tanto en Firestore como en el estado local.
   * Aplica un merge optimista: actualiza el estado local inmediatamente tras la escritura.
   *
   * @param data - Campos parciales del perfil a actualizar.
   * @throws Error si no hay usuario autenticado.
   */
  updateProfileData: (data: Partial<Electricista>) => Promise<void>
}

// ─── CONTEXTO ─────────────────────────────────────────────────────────────────

/**
 * Contexto React que provee el perfil del electricista autenticado y las
 * operaciones para modificarlo. Inicialmente es `null` para detectar usos
 * fuera del provider.
 */
const ProfileContext = createContext<ProfileContextValue | null>(null)

// ─── PROVIDER ─────────────────────────────────────────────────────────────────

/**
 * Proveedor del contexto de perfil. Carga automáticamente el perfil del
 * usuario desde Firestore cuando el UID de autenticación está disponible.
 * Usa una bandera `cancelled` para evitar actualizaciones de estado sobre
 * un componente desmontado (race condition).
 *
 * @param children - Árbol de componentes que tendrán acceso al contexto.
 */
export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Electricista | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)

  // Carga el perfil desde Firestore cuando hay usuario autenticado
  useEffect(() => {
    if (!user?.uid) {
      setProfile(null)
      return
    }

    // Bandera para cancelar actualizaciones de estado si el efecto se limpia antes de que la promesa resuelva
    let cancelled = false
    setIsLoadingProfile(true)

    getProfile(user.uid)
      .then(data => {
        if (!cancelled) setProfile(data)
      })
      .catch(err => {
        console.error('Error cargando perfil:', err)
      })
      .finally(() => {
        if (!cancelled) setIsLoadingProfile(false)
      })

    return () => { cancelled = true }
  }, [user?.uid])

  const updateProfileData = useCallback(async (data: Partial<Electricista>) => {
    if (!user?.uid) throw new Error('No hay usuario autenticado')
    await saveProfile(user.uid, data)
    setProfile(prev => prev ? { ...prev, ...data } : null)
  }, [user?.uid])

  return (
    <ProfileContext.Provider value={{ profile, isLoadingProfile, updateProfileData }}>
      {children}
    </ProfileContext.Provider>
  )
}

// ─── HOOK ─────────────────────────────────────────────────────────────────────

/**
 * Hook que consume el `ProfileContext`. Provee acceso al perfil del electricista
 * autenticado y la función para actualizarlo.
 *
 * @returns El valor completo de `ProfileContextValue`.
 * @throws Error si se usa fuera de un `ProfileProvider`.
 */
export function useProfile() {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile debe usarse dentro de ProfileProvider')
  return ctx
}