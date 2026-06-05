import type { UnifilDiagram } from './unifilar'

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
  tension?: number            // V
  fases?: 1 | 3
  potenciaContratadaKW?: number  // kW
  nroMedidor?: string
  distribuidora?: string
  medidorId?: string
  categoriaTarifa?: string
}

// ─── PROJECT ───

export interface Project {
  // Campos del nuevo modelo relacional
  id: string
  nombre: string
  createdAt: number
  updatedAt: number

  // Relacional / config (mínimos campos obligatorios)
  clienteId?: string
  electricistaId?: string
  estado?: ProjectEstado
  sistemaDistribucion?: 'TT' | 'IT' | 'TN-S' | 'TN-C' | 'TN-C-S'
  inmueble?: Inmueble
  suministro?: Suministro

  // Campos legacy del modelo plano (mantenidos para compatibilidad)
  meta: Meta
  ambientes: Ambiente[]
  circuitos?: Circuito[]
  conexiones?: Conexion[]
  tableros?: Tablero[]
  hojasMaestras?: HojaMaestra[]
  ownerId?: string
  sharedWith?: string[]

  // Nuevas entidades
  diferenciales?: Diferencial[]
  tramos?: TramoConductor[]
  unifilDiagrams?: UnifilDiagram[]
}

export interface HojaMaestra {
  id: string
  nombre: string
  descripcion?: string
  ambientesIds: string[]
}

export type TipoElementoCabecera = 'seccionador' | 'interruptor_seccionador' | 'TM' | 'DR' | 'otro';

export interface CabeceraConfig {
  tipo: TipoElementoCabecera;
  polos?: 2 | 3 | 4;
  inominalA?: number;
  sensibilidadMA?: number;
  descripcion?: string;
}

// ─── CIRCUITOS ───

export type TipoCircuito = 'IUG' | 'IUE' | 'TUG' | 'TUE' | 'ACU' | 'MBT' | 'MBTF' | 'TEC' | 'DPS' | 'OTRO';
export type TipoConducto = 'cano_rigido' | 'bandeja' | 'enterrado' | 'canaleta' | 'otro';

export interface Circuito {
  id: string;
  nombre: string;
  tipo: TipoCircuito;
  tableroId: string;           // ID del tablero al que pertenece (obligatorio)
  seccion: number;             // Sección del conductor en mm²
  material?: 'cobre' | 'aluminio';               // default 'cobre'
  aislacion?: 'PVC' | 'XLPE' | 'EPR';            // default 'PVC'
  metodoInstalacion?: 'A1'|'A2'|'B1'|'B2'|'C'|'D'|'E'|'F'|'G';
  temperaturaAmbiente?: number;                  // °C, default 30
  longitudDeclarada?: number;                    // metros, prioridad sobre calculada
  caidaTensionMax?: number;                      // %, default 3
  curvaDisparo?: 'B' | 'C' | 'D';
  proteccion?: string;         // Legacy: Ej: "10A TM"
  corrienteNominal?: number;   // In del protector en A
  sensibilidadDR?: number;     // mA del diferencial (30, 300, etc.)
  cantConductores?: number;    // Cantidad de conductores activos (default: 2)
  conducto?: string;           // Descripción libre del conducto
  tipoConducto?: TipoConducto;
  color?: string;              // Color para visualización
  descripcion?: string;
  parentId?: string;           // ID del elemento aguas arriba (ej: Diferencial u otro circuito)
  polos?: 2 | 3 | 4;           // Cantidad de polos (para gráficas de conductores)
}

// ─── TABLERO ───

export interface Tablero {
  id: string;
  nombre: string;
  tipo: 'general' | 'seccional' | 'auxiliar';
  ubicacion?: string;
  elementoId?: string;         // ID del ElementoElectrico que lo representa
  ambienteId?: string;         // ID del Ambiente donde está físicamente
  factorSimultaneidad?: number; // default 1.0, editable por el proyectista
  diferencialesIds?: string[];   // IDs de diferenciales instalados en este tablero
  alimentadorDesdeTableroId?: string | 'red_distribuidora'; // ID del tablero aguas arriba o red
  alimentadorDesdeCircuitoId?: string; // ID del circuito que oficia de alimentador en el tablero superior
  interruptorCabecera?: CabeceraConfig; // Elemento de cabecera del tablero
}

// ─── DIFERENCIAL ───

export interface Diferencial {
  id: string;
  tableroId: string;
  sensibilidadMA: 10 | 30 | 100 | 300 | 500;
  tipo: 'AC' | 'A' | 'F' | 'B' | 'S' | 'G';
  inominalA: number;
  polos: 2 | 4;
  circuitosIds: string[];       // circuitos que protege
  descripcion?: string;
  parentId?: string;            // ID del elemento aguas arriba en el unifilar
}

// ─── TRAMO CONDUCTOR ───

export interface TramoConductor {
  id: string;
  conexionId: string;
  tipo: 'auto' | 'manual' | 'interhoja';
  longitudAuto?: number;        // calculada desde coordenadas, solo si mismo ambiente
  longitudManual?: number;      // ingresada por usuario
  longitudEfectiva: number;      // manual tiene prioridad sobre auto
  descripcion?: string;         // ej: "bajada desde techo", "cruce de jardín"
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
  /** Lista plana de paredes. Reemplaza a tramos[]. */
  paredes: Pared[]
  /** @deprecated Usar paredes[]. Se mantiene solo para migración de datos legacy. */
  tramos?: Tramo[]
  aberturas: Abertura[]
  escaleras?: Escalera[]
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

/** @deprecated Solo para migración de datos legacy. */
export interface Tramo {
  id: string
  cerrado: boolean
  paredes: Pared[]
  origenX?: number
  origenY?: number
  amarre?: PuntoAmarre
}

/** @deprecated Solo para migración de datos legacy. */
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
  refParedIdx?: number
  refDistancia?: number
}

export interface Irregularidad {
  posicion: number
  ancho: number
  profundidad: number
}

// ─── ESCALERA ───

export interface Escalera {
  id: string;
  paredIdx: number | null;
  posicion: number;
  ancho: number;
  sentido: 'sube' | 'baja';
  forma: 'recta' | 'L_der' | 'L_izq' | 'U_der' | 'U_izq' | 'caracol';
  largo1: number;
  largo2?: number;
  radio?: number;
  ambienteVecinoId?: string;
  escaleraVecinaId?: string;
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
  medicionPAT?: {
    valorOhms: number;
    metodo: 'caida_tension' | 'dos_puntas';
    fecha: string;
  };
}

export interface TextoPlano {
  id: string;
  texto: string;
  x: number;
  y: number;
  tamano: number;
}
