// ═══════════════════════════════════════════════════════════════════════════
// MODULE: types.js
// Definiciones de tipos/estructuras de datos.
// En React: src/types.ts (con TypeScript interfaces/types)
// ═══════════════════════════════════════════════════════════════════════════

export interface Project {
  id: string
  meta: { nombre: string; escala: number; grosor_pared_default: number }
  ambientes: Ambiente[]
  updatedAt: number
}

export interface Ambiente {
  id: string
  nombre: string
  sentido: 'horario' | 'antihorario'
  mostrar_cotas: boolean
  paredes: Pared[]
  aberturas: Abertura[]
  elementos: ElementoElectrico[]
}

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

export interface Abertura {
  id: string
  pared: number
  tipo: 'puerta' | 'ventana' | 'vano' | string;
  posicion: number
  ancho: number
  hojas: number
  lado: string
  sentido: string
}

export interface ElementoElectrico {
  id: string
  tipo: SymbolId
  referencia: string
  x: number
  y: number            // posición en coordenadas del plano (px)
  paredIdx: number | null  // null = libre (techo/tierra)
  paredPos: number | null  // posición a lo largo de la pared (px)
  datos: { clave: string; valor: string }[]
  mostrarDato: boolean
}

export type SymbolId = string;


// IDs de símbolos disponibles
const SYMBOL_IDS = {
  // Libres (techo/planta)
  BOCA_TECHO:   'sym-boca-techo',
  TIERRA:       'sym-tierra',
  // De pared
  TOMA:         'sym-toma',
  BOCA_PARED:   'sym-boca-pared',
  TABLERO_S:    'sym-ts',
  TABLERO_P:    'sym-tp',
  LLAVE_1:      'sym-llave-1',
  LLAVE_2:      'sym-llave-2',
  LLAVE_COMB:   'sym-llave-comb',
};

export const SIMBOLOS_LIBRES = [SYMBOL_IDS.BOCA_TECHO, SYMBOL_IDS.TIERRA];
export const SIMBOLOS_PARED  = [
  SYMBOL_IDS.TOMA, SYMBOL_IDS.BOCA_PARED,
  SYMBOL_IDS.TABLERO_S, SYMBOL_IDS.TABLERO_P,
  SYMBOL_IDS.LLAVE_1, SYMBOL_IDS.LLAVE_2, SYMBOL_IDS.LLAVE_COMB,
];

export const SIMBOLOS_INFO = {
  [SYMBOL_IDS.BOCA_TECHO]:  { label: 'Centro (boca techo)', grupo: 'libre' },
  [SYMBOL_IDS.TIERRA]:      { label: 'Puesta a tierra (jabalina)', grupo: 'libre' },
  [SYMBOL_IDS.TOMA]:        { label: 'Tomacorriente', grupo: 'pared' },
  [SYMBOL_IDS.BOCA_PARED]:  { label: 'Boca iluminación pared', grupo: 'pared' },
  [SYMBOL_IDS.TABLERO_S]:   { label: 'Tablero seccional', grupo: 'pared' },
  [SYMBOL_IDS.TABLERO_P]:   { label: 'Tablero principal', grupo: 'pared' },
  [SYMBOL_IDS.LLAVE_1]:     { label: 'Llave 1 punto', grupo: 'pared' },
  [SYMBOL_IDS.LLAVE_2]:     { label: 'Llave 2 puntos', grupo: 'pared' },
  [SYMBOL_IDS.LLAVE_COMB]:  { label: 'Llave combinación', grupo: 'pared' },
};