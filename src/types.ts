// ═══════════════════════════════════════════════════════════════════════════
// MODULE: types.ts
// Definiciones de tipos/estructuras de datos.
// ═══════════════════════════════════════════════════════════════════════════

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
  updatedAt: number
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
  tipoAmbiente?: TipoAmbiente   // default: 'interior'
  sentido: 'horario' | 'antihorario'
  alturaLocal?: number           // Altura de techo en este ambiente (metros)
  paredes: Pared[]
  aberturas: Abertura[]
  elementos: ElementoElectrico[]
  textos?: TextoPlano[]
  configHoja?: ConfigHoja
  mostrar_cotas: boolean
  cotaSize?: number
  posX?: number
  posY?: number
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
   * ID del segundo ambiente que comparte esta abertura.
   * Una puerta pertenece a dos ambientes; se registra en uno
   * y se vincula al otro mediante este campo en el plano maestro.
   */
  ambienteVecinoId?: string;
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
}

// ─── TIPOS UI ───

export type SymbolId = string;

export interface TextoPlano {
  id: string;
  texto: string;
  x: number;               // metros
  y: number;               // metros
  tamano: number;          // mm en papel
}

export type EditorTab = 'proyecto' | 'paredes' | 'aberturas' | 'electrico' | 'circuitos' | 'conexiones' | 'maestro';

export type ScreenView = 'projects' | 'editor';

export type SymbolDialogData = 
  | { mode: 'create'; x: number; y: number; snapSegIdx?: number; snapPos?: number }
  | { mode: 'edit'; existing: ElementoElectrico };
