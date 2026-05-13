export interface Meta {
  nombre: string
  escala: number
  grosor_pared_default: number
  alturaDefault?: number  // Altura de techo por defecto (metros). Ej: 2.6
}

export interface Project {
  id: string
  meta: Meta
  ambientes: Ambiente[]
  circuitos?: Circuito[]       // Lista de circuitos del proyecto
  conexiones?: Conexion[]      // Netlist: relaciones entre elementos
  tableros?: Tablero[]         // Tableros eléctricos del proyecto
  /** Lista de hojas maestras para composición de ambientes */
  hojasMaestras?: HojaMaestra[]
  updatedAt: number
  ownerId?: string        // uid Firebase, opcional hasta que haya auth
  sharedWith?: string[]   // para compartir proyectos en el futuro
}

/**
 * Define una composición de múltiples ambientes para visualización y reporte.
 */
export interface HojaMaestra {
  /** Identificador único de la hoja maestra */
  id: string
  /** Nombre descriptivo de la hoja */
  nombre: string
  /** Descripción opcional de la hoja */
  descripcion?: string
  /** IDs de los ambientes que componen esta hoja */
  ambientesIds: string[]
}

// ─── CIRCUITOS ───

export type TipoCircuito = 'IUG' | 'IUE' | 'TUG' | 'TUE' | 'ACU' | 'MBT' | 'MBTF' | 'TEC' | 'OTRO';

export interface Circuito {
  id: string;
  /**
   * Identificador de circuito con prefijo de tablero.
   * Convenio: "{tableroId}.{numero}" → ej: "TS1.C1", "TD1.C3"
   */
  nombre: string;
  tipo: TipoCircuito;
  tableroId?: string;          // ID del tablero al que pertenece
  seccion: number;             // Sección del conductor en mm²
  proteccion: string;          // Ej: "10A TM", "16A TM+DR", "20A IA"
  cantConductores?: number;    // Cantidad de conductores activos (default: 2)
  conducto?: string;           // Descripción libre del conducto
  color?: string;              // Color para visualización en plano
  descripcion?: string;        // Descripción libre del circuito
}

// ─── TABLERO ───

export interface Tablero {
  id: string;
  nombre: string;             // Ej: "TS1" (Tablero Seccional 1), "TG" (Tablero General)
  tipo: 'general' | 'seccional' | 'auxiliar';
  ubicacion?: string;         // Descripción libre: "Cocina", "Garage", etc.
  elementoId?: string;        // ID del ElementoElectrico que lo representa en el plano
  ambienteId?: string;        // ID del Ambiente donde está físicamente
}

// ─── CONEXIONES (NETLIST) ───

export interface Cable {
  tipo: 'fase' | 'neutro' | 'pe' | 'comando' | 'retorno';
  seccion: number;            // mm²
  color?: string;             // Ej: "negro", "celeste", "verde-amarillo"
}

export interface Conexion {
  id: string;
  circuitoId?: string;        // ID del circuito al que pertenece
  from: { ambienteId: string; elementoId: string };
  to: { ambienteId: string; elementoId: string };
  cables: Cable[];            // Conductores que componen esta conexión
  conducto?: string;          // Descripción libre del conducto
  seccionConduccion?: number; // Diámetro exterior del conducto (mm)
  descripcion?: string;
}

// ─── AMBIENTE ───

export type TipoAmbiente = 'interior' | 'exterior' | 'semi_cubierto';

export interface Ambiente {
  id: string
  nombre: string
  /** Nombre corto para identificar en vista maestro (ej: "P.B.", "Jardín Norte") */
  etiqueta?: string
  tipoAmbiente?: TipoAmbiente   // default: 'interior'
  sentido: 'horario' | 'antihorario'
  alturaLocal?: number           // Altura de techo en este ambiente (metros)
  /** Lista de tramos de paredes que componen el ambiente */
  tramos: Tramo[]
  aberturas: Abertura[]
  elementos: ElementoElectrico[]
  /** Zonas de cobertura especiales (galerías, pérgolas, etc.) */
  coberturas?: ZonaCobertura[]
  /** Elementos de la estructura edilicia (columnas, vigas, pilar) */
  elementosEstructurales?: ElementoEstructural[]
  textos?: TextoPlano[]
  configHoja?: ConfigHoja
  mostrar_cotas: boolean
  cotaSize?: number
  /** Rotación global de la hoja en el plano maestro (grados) */
  rotation?: number
  posX?: number
  posY?: number
}

/**
 * Define una secuencia de paredes consecutivas.
 */
export interface Tramo {
  /** Identificador único del tramo */
  id: string
  /** true = secuencia de paredes cierra polígono, false = tramo abierto */
  cerrado: boolean
  /** Lista de paredes que componen el tramo */
  paredes: Pared[]
  /** Coordenada absoluta X del primer vértice del tramo (metros) */
  origenX?: number
  /** Coordenada absoluta Y del primer vértice del tramo (metros) */
  origenY?: number
  /** Referencia espacial opcional para el inicio del tramo */
  amarre?: PuntoAmarre
}

/**
 * Define la referencia espacial de un tramo respecto a otro punto del plano.
 */
export interface PuntoAmarre {
  /** Tipo de referencia: coincidencia con vértice, offset libre o flotante */
  tipo: 'vertice' | 'medida_libre' | 'pendiente'
  /** ID del ambiente de referencia */
  ambienteRefId?: string
  /** ID del tramo de referencia */
  tramoRefId?: string
  /** Índice del vértice en el tramo referenciado */
  verticeRefIdx?: number
  /** Desplazamiento horizontal en metros */
  offsetX?: number
  /** Desplazamiento vertical en metros */
  offsetY?: number
}

/**
 * Define áreas especiales de cobertura en el plano.
 */
export interface ZonaCobertura {
  /** Identificador único de la zona */
  id: string
  /** Tipo de cobertura (total, galería, pérgola, sin techo) */
  tipo: 'total' | 'galeria' | 'pergola' | 'sin_techo'
  /** Polígono paramétrico relativo al ambiente */
  segmentos: { largo: number; angulo: number }[]
  /** Coordenada absoluta X del primer vértice (metros) */
  origenX?: number
  /** Coordenada absoluta Y del primer vértice (metros) */
  origenY?: number
}

/**
 * Define elementos de la estructura edilicia que no son paredes.
 */
export interface ElementoEstructural {
  /** Identificador único del elemento */
  id: string
  /** Tipo de elemento estructural */
  tipo: 'columna' | 'viga' | 'pilar'
  /** Posición X en metros relativos al ambiente */
  x: number
  /** Posición Y en metros relativos al ambiente */
  y: number
  /** Ancho del elemento en metros */
  ancho?: number
  /** Profundidad del elemento en metros */
  profundidad?: number
  /** Descripción o notas adicionales */
  descripcion?: string
}

export interface ConfigHoja {
  formato: 'A4' | 'A3'
  orientacion: 'vertical' | 'horizontal'
}

// ─── PARED ───

export interface Pared {
  id: string
  largo: number | 'auto'
  angulo: number          // giro al inicio (default 90)
  grosor: number | null   // null = hereda del proyecto
  esquina_saliente: { ancho: number } | null
  irregularidades: Irregularidad[]
}

export interface Irregularidad {
  posicion: number
  ancho: number
  profundidad: number
}

// ─── ABERTURA ───

/** Subtipos de puerta */
export type SubtipoPuerta = 'batiente' | 'corrediza' | 'vaiven' | 'pivotante';
/** Subtipos de ventana */
export type SubtipoVentana = 'abatible' | 'corrediza' | 'guillotina' | 'pivotante' | 'fija';

export interface Abertura {
  id: string
  pared: number
  tipo: 'puerta' | 'ventana' | 'vano';
  subtipo?: SubtipoPuerta | SubtipoVentana;  // Variante dentro del tipo
  posicion: number
  ancho: number
  hojas: number
  lado: string
  sentido: string
  /**
   * true = este ambiente "posee" la abertura y la renderiza
   * false = la abertura es tomada del ambiente vecino (no renderizar duplicada)
   * Si undefined, asumir true para backwards compatibility
   */
  esPrincipal?: boolean;
  /**
   * ID del segundo ambiente que comparte esta abertura.
   * Una puerta pertenece a dos ambientes; se registra en uno
   * y se vincula al otro mediante este campo en el plano maestro.
   */
  ambienteVecinoId?: string;
  aberturaVecinaId?: string;  // ID de la abertura vinculada en la otra hoja
  paredVecinaIdx?: number;   // Índice de pared en el ambiente vecino
}

// ─── ELEMENTO ELÉCTRICO ───

export interface ElementoElectrico {
  id: string;
  tipo: string;
  referencia: string;
  x: number;
  y: number;
  paredIdx: number | null;
  paredPos: number | null;
  datos: { clave: string; valor: string }[];
  mostrarDato: boolean;
  altura?: number;      // Altura de montaje en metros (ej: 0.4 para TUG, 1.2 para interruptores)
  circuitoId?: string;  // ID del Circuito (de Project.circuitos[])
  esTablero?: boolean;  // true si este elemento representa un tablero
  columnaId?: string;   // ID de la columna a la que está anclado
  lado?: 'interior' | 'exterior'; // Lado de la pared donde se monta (default 'interior')
}

export interface TextoPlano {
  id: string;
  texto: string;
  x: number;               // metros
  y: number;               // metros
  tamano: number;          // mm en papel
}
