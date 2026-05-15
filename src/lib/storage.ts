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
  TextoPlano,
  Circuito,
  Tablero,
  Conexion,
  Cable,
  TipoCircuito,
  Tramo,
  ZonaCobertura,
  ElementoEstructural
} from '../types/index';

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
export const generateId = (): string => 
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
 * Crea un nuevo tramo de paredes.
 */
export const createTramo = (overide: Partial<Tramo> = {}): Tramo => ({
  id: generateId(),
  cerrado: true,
  paredes: [createPared()],
  ...overide
});

/**
 * Crea una nueva instancia de Ambiente.
 */
export const createAmbiente = (nombre = 'Ambiente'): Ambiente => ({
  id: generateId(),
  nombre,
  tipoAmbiente: 'interior',
  sentido: 'horario',
  alturaLocal: undefined, // hereda meta.alturaDefault
  mostrar_cotas: true,
  tramos: [createTramo()],
  aberturas: [],
  elementos: [],
  textos: [],
  configHoja: {
    formato: 'A4',
    orientacion: 'horizontal'
  }
});

/**
 * Crea una nueva instancia de Proyecto.
 * Ahora incluye los campos obligatorios del modelo relacional.
 */
export const createProject = (nombre = 'Nuevo Proyecto'): Project => ({
  id: Date.now().toString(),
  clienteId: '',
  electricistaId: '',
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
  createdAt: Date.now(),
  updatedAt: Date.now(),
  meta: { 
    nombre, 
    escala: 50, 
    grosor_pared_default: 0.15,
    alturaDefault: 2.6
  },
  ambientes: [createAmbiente('Ambiente 1')],
  circuitos: [],
  tableros: [],
  conexiones: [],
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
  x = 0, 
  y = 0
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

// ─── FÁBRICAS DE NUEVAS ENTIDADES ───

/**
 * Crea un nuevo circuito eléctrico.
 * El nombre sigue el convenio "{tableroId}.{número}" → ej: "TS1.C1"
 */
export const createCircuito = (overide: Partial<Circuito> = {}): Circuito => ({
  id: generateId(),
  nombre: 'TS1.C1',
  tipo: 'TUG' as TipoCircuito,
  tableroId: '',
  seccion: 2.5,
  proteccion: '16A TM',
  cantConductores: 2,
  conducto: 'PVC 20mm',
  color: '#4A90D9',
  ...overide
});

/**
 * Crea un nuevo tablero eléctrico.
 */
export const createTablero = (overide: Partial<Tablero> = {}): Tablero => ({
  id: generateId(),
  nombre: 'TS1',
  tipo: 'seccional',
  ...overide
});

/**
 * Crea una conexión (netlist) entre dos elementos.
 */
export const createConexion = (
  from: Conexion['from'],
  to: Conexion['to'],
  overide: Partial<Conexion> = {}
): Conexion => ({
  id: generateId(),
  from,
  to,
  cables: [
    { tipo: 'fase', seccion: 2.5, color: 'negro' } as Cable,
    { tipo: 'neutro', seccion: 2.5, color: 'celeste' } as Cable,
    { tipo: 'pe', seccion: 2.5, color: 'verde-amarillo' } as Cable,
  ],
  conducto: 'PVC 20mm',
  ...overide
});

/**
 * Crea una nueva zona de cobertura.
 */
export const createZonaCobertura = (overide: Partial<ZonaCobertura> = {}): ZonaCobertura => ({
  id: generateId(),
  tipo: 'galeria',
  segmentos: [{ largo: 1, angulo: 0 }],
  ...overide
});

/**
 * Crea un nuevo elemento estructural (columna).
 */
export const createElementoEstructural = (overide: Partial<ElementoEstructural> = {}): ElementoEstructural => ({
  id: generateId(),
  tipo: 'columna',
  x: 1,
  y: 1,
  ancho: 0.2,
  profundidad: 0.2,
  ...overide
});