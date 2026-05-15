// src/core/ClientContext.tsx
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { listClients, createClient, updateClient } from '../firebase/clientService'
import type { Cliente } from '../types/index'

interface ClientContextValue {
  clients: Cliente[]
  isLoadingClients: boolean
  addClient: (data: Omit<Cliente, 'id' | 'proyectosIds'>) => Promise<void>
  editClient: (id: string, data: Partial<Cliente>) => Promise<void>
  refreshClients: () => Promise<void>
}

const ClientContext = createContext<ClientContextValue | null>(null)

export function ClientProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [clients, setClients] = useState<Cliente[]>([])
  const [isLoadingClients, setIsLoadingClients] = useState(false)

  const load = useCallback(async () => {
    if (!user?.uid) {
      setClients([])
      return
    }
    setIsLoadingClients(true)
    try {
      const data = await listClients(user.uid)
      setClients(data)
    } catch (err) {
      console.error('Error cargando clientes:', err)
    } finally {
      setIsLoadingClients(false)
    }
  }, [user?.uid])

  useEffect(() => {
    load()
  }, [load])

  const addClient = useCallback(async (data: Omit<Cliente, 'id' | 'proyectosIds'>) => {
    if (!user?.uid) throw new Error('No hay usuario autenticado')
    await createClient(user.uid, data)
    await load()
  }, [user?.uid, load])

  const editClient = useCallback(async (id: string, data: Partial<Cliente>) => {
    await updateClient(id, data)
    await load()
  }, [load])

  const refreshClients = useCallback(async () => {
    await load()
  }, [load])

  return (
    <ClientContext.Provider value={{ clients, isLoadingClients, addClient, editClient, refreshClients }}>
      {children}
    </ClientContext.Provider>
  )
}

export function useClients() {
  const ctx = useContext(ClientContext)
  if (!ctx) throw new Error('useClients debe usarse dentro de ClientProvider')
  return ctx
}