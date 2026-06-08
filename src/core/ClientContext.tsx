// src/core/ClientContext.tsx
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import { doc, deleteDoc } from 'firebase/firestore'
import { useAuth } from './AuthContext'
import { listClients, createClient, updateClient } from '../firebase/clientService'
import { db } from '../firebase/config'
import type { Cliente } from '../types/index'

// ─── INTERFAZ DEL CONTEXTO ────────────────────────────────────────────────────

/**
 * Valor expuesto por `ClientContext` a los componentes consumidores.
 */
interface ClientContextValue {
  /** Lista de clientes del usuario autenticado actualmente cargados. */
  clients: Cliente[]
  /** `true` mientras se realiza la carga o recarga de clientes desde Firestore. */
  isLoadingClients: boolean
  /**
   * Crea un nuevo cliente asociado al usuario autenticado y recarga la lista.
   * @param data - Datos del cliente sin los campos `id` ni `proyectosIds` (los gestiona el servicio).
   * @throws Error si no hay usuario autenticado.
   */
  addClient: (data: Omit<Cliente, 'id' | 'proyectosIds'>) => Promise<void>
  /**
   * Actualiza campos de un cliente existente y recarga la lista.
   * @param id   - Identificador del cliente a modificar.
   * @param data - Campos parciales del cliente a actualizar.
   */
  editClient: (id: string, data: Partial<Cliente>) => Promise<void>
  /**
   * Elimina un cliente de Firestore y recarga la lista.
   * @param id - Identificador del cliente a eliminar.
   * @throws Error si Firebase no está configurado.
   */
  deleteClient: (id: string) => Promise<void>
  /**
   * Fuerza una recarga de la lista de clientes desde Firestore.
   * Útil tras operaciones externas que modifiquen la colección.
   */
  refreshClients: () => Promise<void>
}

// ─── CONTEXTO ─────────────────────────────────────────────────────────────────

/**
 * Contexto React que centraliza la gestión de clientes del usuario.
 * Inicialmente es `null` para detectar usos fuera del provider.
 */
const ClientContext = createContext<ClientContextValue | null>(null)

// ─── PROVIDER ─────────────────────────────────────────────────────────────────

/**
 * Proveedor del contexto de clientes. Carga automáticamente la lista de
 * clientes del usuario autenticado al montarse y cada vez que cambia el UID.
 * Expone funciones CRUD que mantienen el estado local sincronizado con Firestore.
 *
 * @param children - Árbol de componentes que tendrán acceso al contexto.
 */
export function ClientProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [clients, setClients] = useState<Cliente[]>([])
  const [isLoadingClients, setIsLoadingClients] = useState(false)

  /** Carga (o recarga) la lista de clientes del usuario desde Firestore. */
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

  // Carga inicial al montar el provider o cuando cambia el usuario autenticado
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

    const deleteClient = useCallback(async (id: string) => {
    if (!db) throw new Error('Firebase no configurado')
    await deleteDoc(doc(db, 'clientes', id))
    await load()
  }, [load])

  return (
    <ClientContext.Provider value={{ clients, isLoadingClients, addClient, editClient, deleteClient, refreshClients }}>
      {children}
    </ClientContext.Provider>
  )
}

// ─── HOOK ─────────────────────────────────────────────────────────────────────

/**
 * Hook que consume el `ClientContext`. Provee la lista de clientes y las
 * operaciones CRUD disponibles sobre ellos.
 *
 * @returns El valor completo de `ClientContextValue`.
 * @throws Error si se usa fuera de un `ClientProvider`.
 */
export function useClients() {
  const ctx = useContext(ClientContext)
  if (!ctx) throw new Error('useClients debe usarse dentro de ClientProvider')
  return ctx
}