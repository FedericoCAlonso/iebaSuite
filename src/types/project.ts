export interface Meta {
  nombre: string
  escala: number
  grosor_pared_default: number
  alturaDefault?: number
}

// ─── ESTADOS Y TIPOS DEL MODELO RELACIONAL ───

export type ProjectEstado = 'relevamiento' | 'presupuesto' | 'en_ejecucion' | 'ejecutado' | 'certificado'

export interface Inmueble {
  direccion: string
  partido: string
  provincia: string
  uso: 'residencial' | 'comercial' | 'industrial'
}

export interface Suministro {
  tension: number            // V
  fases: 1 | 2 | 3
  potenciaContratada?: number  // kW
  medidorId?: string
  categoriaTarifa?: string
}

// ─── PROJECT ───

export interface Project {
  // Campos del nuevo modelo relacional
  id: string
  clienteId: string
  electricistaId: string
  nombre: string
  estado: ProjectEstado
  inmueble: Inmueble
  suministro: Suministro
  createdAt: number
  updatedAt: number

  // Campos legacy del modelo plano (mantenidos para compatibilidad)
  meta: Meta
  ambientes: Ambiente[]
  circuitos?: Circuito[]
  conexiones?: Conexion[]
  tableros?: Tablero[]
  hojasMaestras?: HojaMaestra[]
  ownerId?: string
  sharedWith?: string[]
}

export interface HojaMaestra {
  id: string
  nombre: string
  descripcion?: string
  ambientesIds: string[]
}

// ─── CIRCUITOS ───

export type TipoCircuito = 'IUG' | 'IUE' | 'TUG' | 'TUE' | 'ACU' | 'MBT' | 'MBTF' | 'TEC' | 'OTRO';
export type TipoConducto = 'cano_rigido' | 'bandeja' | 'enterrado' | 'canaleta' | 'otro';

export interface Circuito {
  id: string;
  nombre: string;
  tipo: TipoCircuito;
  tableroId: string;           // ID del tablero al que pertenece (obligatorio)
  seccion: number;             // Sección del conductor en mm²
  material?: 'cobre' | 'aluminio';
  aislacion?: string;          // Tipo de aislamiento (ej: "PVC", "XLPE")
  proteccion?: string;         // Legacy: Ej: "10A TM"
  curvaDisparo?: string;       // Curva térmica/magnética (ej: "C", "D")
  corrienteNominal?: number;   // In del protector en A
  sensibilidadDR?: number;     // mA del diferencial (30, 300, etc.)
  cantConductores?: number;    // Cantidad de conductores activos (default: 2)
  conducto?: string;           // Descripción libre del conducto
  tipoConducto?: TipoConducto;
  color?: string;              // Color para visualización
  descripcion?: string;
}

// ─── TABLERO ───

export interface Tablero {
  id: string;
  nombre: string;
  tipo: 'general' | 'seccional' | 'auxiliar';
  ubicacion?: string;
  elementoId?: string;         // ID del ElementoElectrico que lo representa
  ambienteId?: string;         // ID del Ambiente donde está físicamente
}

// ─── CONEXIONES (NETLIST) ───

export interface Cable {
  tipo: 'fase' | 'neutro' | 'pe' | 'comando' | 'retorno';
  seccion: number;             // mm²
  color?: string;
}

export type OrigenLongitud = 'calculada' | 'declarada' | 'por_tramos';

export interface Conexion {
  id: string;
  circuitoId?: string;         // LEGACY
  circuitosIds?: string[];     // NUEVO: Soporta múltiples circuitos
  from: { ambienteId: string; elementoId: string };
  to: { ambienteId: string; elementoId: string };
  cables: Cable[];
  conducto?: string;
  tipoConducto?: TipoConducto;
  origenLongitud?: OrigenLongitud;
  seccionConduccion?: number;  // mm
  descripcion?: string;
}

// ─── AMBIENTE ───

export type TipoAmbiente = 'interior' | 'exterior' | 'semi_cubierto';

export interface Ambiente {
  id: string
  nombre: string
  etiqueta?: string
  tipoAmbiente?: TipoAmbiente
  sentido: 'horario' | 'antihorario'
  alturaLocal?: number
  tramos: Tramo[]
  aberturas: Abertura[]
  elementos: ElementoElectrico[]
  coberturas?: ZonaCobertura[]
  elementosEstructurales?: ElementoEstructural[]
  textos?: TextoPlano[]
  configHoja?: ConfigHoja
  mostrar_cotas: boolean
  cotaSize?: number
  rotation?: number
  posX?: number
  posY?: number
}

export interface Tramo {
  id: string
  cerrado: boolean
  paredes: Pared[]
  origenX?: number
  origenY?: number
  amarre?: PuntoAmarre
}

export interface PuntoAmarre {
  tipo: 'vertice' | 'medida_libre' | 'pendiente'
  ambienteRefId?: string
  tramoRefId?: string
  verticeRefIdx?: number
  offsetX?: number
  offsetY?: number
}

export interface ZonaCobertura {
  id: string
  tipo: 'total' | 'galeria' | 'pergola' | 'sin_techo'
  segmentos: { largo: number; angulo: number }[]
  origenX?: number
  origenY?: number
}

export interface ElementoEstructural {
  id: string
  tipo: 'columna' | 'viga' | 'pilar'
  x: number
  y: number
  ancho?: number
  profundidad?: number
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
  angulo: number
  grosor: number | null
  esquina_saliente: { ancho: number } | null
  irregularidades: Irregularidad[]
}

export interface Irregularidad {
  posicion: number
  ancho: number
  profundidad: number
}

// ─── ABERTURA ───

export type SubtipoPuerta = 'batiente' | 'corrediza' | 'vaiven' | 'pivotante';
export type SubtipoVentana = 'abatible' | 'corrediza' | 'guillotina' | 'pivotante' | 'fija';

export interface Abertura {
  id: string
  pared: number
  tipo: 'puerta' | 'ventana' | 'vano';
  subtipo?: SubtipoPuerta | SubtipoVentana;
  posicion: number
  ancho: number
  hojas: number
  lado: string
  sentido: string
  esPrincipal?: boolean;
  ambienteVecinoId?: string;
  aberturaVecinaId?: string;
  paredVecinaIdx?: number;
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
  altura?: number;
  circuitoId?: string;
  sistemaId?: string;          // NUEVO: ID del sistema MBT
  estado?: 'existente' | 'proyectado' | 'a_reemplazar'; // NUEVO
  esTablero?: boolean;
  columnaId?: string;
  lado?: 'interior' | 'exterior';
}

export interface TextoPlano {
  id: string;
  texto: string;
  x: number;
  y: number;
  tamano: number;
}