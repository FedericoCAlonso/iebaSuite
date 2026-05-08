/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MODULE: storage.ts
 * 
 * Gestión de persistencia en LocalStorage y fábricas de objetos del dominio.
 * Asegura que cada nueva entidad (Proyecto, Ambiente, Pared) cumpla con
 * las interfaces definidas en types.ts.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import type { 
  Ambiente, 
  Project, 
  Pared, 
  Abertura, 
  ElementoElectrico, 
  SymbolId,
  TextoPlano
} from '../types';

const KEY = 'ieba_croquis_v2';

// ─── GESTIÓN DE PERSISTENCIA ───

/**
 * Carga la lista de proyectos desde el LocalStorage.
 * @returns Array de proyectos o array vacío en caso de error o ausencia.
 */
export const loadProjects = (): Project[] => {
  try {
    const data = localStorage.getItem(KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error al cargar desde STORAGE:", error);
    return [];
  }
};

/**
 * Guarda la lista completa de proyectos.
 * @param projects Array de proyectos a persistir.
 */
export const saveProjects = (projects: Project[]): void => {
  try {
    localStorage.setItem(KEY, JSON.stringify(projects));
  } catch (error) {
    console.error("Error al guardar en STORAGE:", error);
  }
};

// ─── FÁBRICAS (FACTORIES) DE DATOS ───

/**
 * Genera un ID único basado en timestamp y aleatoriedad.
 */
const generateId = (): string => 
  Date.now().toString() + Math.random().toString(36).slice(2, 9);

/**
 * Crea una nueva instancia de Pared con valores por defecto.
 * @param overide Propiedades a sobreescribir al crear.
 */
export const createPared = (overide: Partial<Pared> = {}): Pared => ({
  id: generateId(),
  largo: 0,
  angulo: 90,
  grosor: null, // null hereda el valor por defecto del proyecto
  esquina_saliente: null,
  irregularidades: [],
  ...overide
});

/**
 * Crea una nueva instancia de Ambiente.
 */
export const createAmbiente = (nombre = 'Ambiente'): Ambiente => ({
  id: generateId(),
  nombre,
  sentido: 'horario',
  mostrar_cotas: true,
  paredes: [createPared({ id: 'w1' })],
  aberturas: [],
  elementos: [],
  textos: [],
});

/**
 * Crea una nueva instancia de Proyecto.
 */
export const createProject = (nombre = 'Nuevo Proyecto'): Project => ({
  id: Date.now().toString(),
  meta: { 
    nombre, 
    escala: 50, 
    grosor_pared_default: 0.15 
  },
  ambientes: [createAmbiente('Ambiente 1')],
  updatedAt: Date.now(),
});

/**
 * Crea una abertura (Puerta, Ventana, Vano) vinculada a una pared.
 */
export const createAbertura = (overide: Partial<Abertura> = {}): Abertura => ({
  id: generateId(),
  pared: 0,
  tipo: 'puerta',
  posicion: 0.5,
  ancho: 0.9,
  hojas: 1,
  lado: 'interior',
  sentido: 'derecha',
  ...overide
});

/**
 * Crea un elemento eléctrico.
 * @param tipo ID del símbolo (SymbolId).
 * @param x Posición X inicial (si es libre).
 * @param y Posición Y inicial (si es libre).
 */
export const createElemento = (
  tipo: SymbolId, 
  x = 100, 
  y = 100
): ElementoElectrico => ({
  id: generateId(),
  tipo,
  referencia: '',
  x,
  y,
  paredIdx: null, // null indica que no está anclado a pared (ej: boca de techo)
  paredPos: null,
  datos: [],
  mostrarDato: false,
});

/**
 * Crea una nueva anotación de texto libre.
 */
export const createTexto = (texto = 'Texto', x = 0, y = 0): TextoPlano => ({
  id: generateId(),
  texto,
  x,
  y,
  tamano: 12,
});