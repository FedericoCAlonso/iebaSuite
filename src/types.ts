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
  paredes: Pared[]
  aberturas: Abertura[]
  elementos: ElementoElectrico[]
  textos?: TextoPlano[]
  configHoja?: ConfigHoja
  mostrar_cotas: boolean
  cotaSize?: number
}

export interface ConfigHoja {
  formato: 'A4' | 'A3'
  orientacion: 'vertical' | 'horizontal'
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
  tipo: 'puerta' | 'ventana' | 'vano';
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
  x: number                // posición X real (metros)
  y: number                // posición Y real (metros)
  paredIdx: number | null  // null = libre (techo/tierra)
  paredPos: number | null  // posición a lo largo de la pared (metros)
  datos: { clave: string; valor: string }[]
  mostrarDato: boolean
}

export type SymbolId = string;

export interface TextoPlano {
  id: string;
  texto: string;
  x: number;               // metros
  y: number;               // metros
  tamano: number;          // mm en papel
}
