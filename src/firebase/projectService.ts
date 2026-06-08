// Servicio de proyectos Firebase — capa de persistencia en la nube
import {
  collection, doc, setDoc, getDoc, getDocs, addDoc,
  query, where, deleteDoc
} from 'firebase/firestore'
import { db } from './config'
import { deepCleanUndefined, assertDb } from './utils'
import { migrateProjectToV2 } from '../hooks/useProjectMigration'
import type { Project } from '../types/index'

const COL = 'projects'

// ─── FÁBRICA DE PROYECTO (NUEVO MODELO RELACIONAL V2) ───

const generateId = (): string =>
  Date.now().toString() + Math.random().toString(36).slice(2, 9)

/**
 * Crea un nuevo objeto Project que respeta la interfaz relacional V2 limpia.
 * Incluye valores por defecto para inmueble, suministro, configuración de dibujo plana y colecciones vacías.
 */
export function createProjectRemote(
  nombre = 'Nuevo Proyecto',
  electricistaId = '',
  clienteId = ''
): Project {
  const now = Date.now()

  return deepCleanUndefined<Project>({
    id: generateId(),
    clienteId,
    electricistaId,
    nombre,
    estado: 'relevamiento',
    inmueble: {
      direccion: '',
      partido: '',
      provincia: '',
      uso: 'residencial'
    },
    suministro: {
      tension: 220,
      fases: 1
    },
    createdAt: now,
    updatedAt: now,

    // Configuración de dibujo plana
    escala: 50,
    grosor_pared_default: 0.15,
    alturaDefault: 2.6,

    // Entidades
    ambientes: [],
    circuitos: [],
    conexiones: [],
    tableros: [],
    diferenciales: [],
    tramos: [],
    unifilDiagrams: [],
    hojasMaestras: [],
    sharedWith: []
  })
}

// ─── CRUD REMOTO ───

/**
 * Guarda o actualiza un proyecto completo en Firestore (sobrescribe todo el documento).
 * Realiza una limpieza previa de valores `undefined`.
 * 
 * @param project Objeto del proyecto con su identificador único.
 * @returns Promesa que se resuelve al finalizar la escritura.
 */
export async function saveProjectRemote(project: Project): Promise<void> {
  assertDb(db)
  const ref = doc(db, COL, project.id)
  const cleaned = deepCleanUndefined(project)
  await setDoc(ref, cleaned)
}

/**
 * Guarda un proyecto nuevo sin necesidad de tener ID previo en Firestore.
 * Genera una marca de tiempo en `updatedAt`.
 * 
 * @param project Datos del proyecto sin el identificador.
 * @returns Promesa que se resuelve con el ID asignado por Firestore.
 */
export async function addProjectRemote(
  project: Omit<Project, 'id'>
): Promise<string> {
  assertDb(db)
  const cleaned = deepCleanUndefined({ ...project, updatedAt: Date.now() })
  const ref = await addDoc(collection(db, COL), cleaned)
  return ref.id
}

/**
 * Carga un proyecto desde Firestore por su identificador único.
 * Realiza una limpieza de valores y una migración automática al formato V2.
 * 
 * @param id Identificador único del proyecto.
 * @returns Promesa con el objeto del proyecto o `null` si no existe.
 */
export async function loadProjectRemote(id: string): Promise<Project | null> {
  assertDb(db)
  const snap = await getDoc(doc(db, COL, id))
  if (!snap.exists()) return null
  return migrateProjectToV2(deepCleanUndefined(snap.data()))
}

/**
 * Obtiene la lista de proyectos pertenecientes a un electricista específico en Firestore,
 * ordenados por fecha de última actualización descendente y migrados automáticamente a V2.
 * 
 * @param electricistaId Identificador del electricista dueño del proyecto.
 * @returns Promesa con la lista de proyectos encontrados.
 */
export async function listProjectsRemote(electricistaId: string): Promise<Project[]> {
  assertDb(db)
  const q = query(
    collection(db, COL),
    where('electricistaId', '==', electricistaId)
  )
  const snap = await getDocs(q)
  const projects = snap.docs.map(d => migrateProjectToV2(deepCleanUndefined(d.data())))
  return projects.sort((a, b) => b.updatedAt - a.updatedAt)
}

/**
 * Elimina permanentemente un proyecto de Firestore por su identificador.
 * 
 * @param id Identificador único del proyecto a eliminar.
 * @returns Promesa que se resuelve al finalizar la eliminación.
 */
export async function deleteProjectRemote(id: string): Promise<void> {
  assertDb(db)
  const ref = doc(db, COL, id)
  await deleteDoc(ref)
}
