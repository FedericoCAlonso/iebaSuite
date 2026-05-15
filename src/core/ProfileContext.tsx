// src/core/ProfileContext.tsx
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { getProfile, saveProfile } from '../firebase/profileService'
import type { Electricista } from '../types/index'

interface ProfileContextValue {
  profile: Electricista | null
  isLoadingProfile: boolean
  updateProfileData: (data: Partial<Electricista>) => Promise<void>
}

const ProfileContext = createContext<ProfileContextValue | null>(null)

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Electricista | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)

  useEffect(() => {
    if (!user?.uid) {
      setProfile(null)
      return
    }

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

export function useProfile() {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile debe usarse dentro de ProfileProvider')
  return ctx
}