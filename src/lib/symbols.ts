// ═══════════════════════════════════════════════════════════════════════════
// MODULE: symbols.ts
// Librería dinámica de símbolos eléctricos. Reemplaza los símbolos hardcodeados.
// ═══════════════════════════════════════════════════════════════════════════

import type { SymbolId } from '../types';

export interface DefinicionSimbolo {
  id: SymbolId;
  label: string;
  grupo: 'libre' | 'pared';
  /** 
   * SVG path u otros elementos gráficos asumiendo un espacio normalizado
   * donde 1 unidad geométrica = 1k (aprox. 0.22m).
   * El color se hereda mediante 'currentColor'.
   */
  svgContent: string;
  /** Factor de escala por defecto si el símbolo se dibujó más grande/chico */
  escalaBase: number;
  /** Punto de anclaje (por defecto 0,0) */
  anclaje: { x: number; y: number };
}

/** 
 * Librería por defecto de símbolos ieBA.
 * Esto se usará para inicializar la base de datos local.
 */
export const DEFAULT_SYMBOLS: DefinicionSimbolo[] = [
  {
    id: 'sym-boca-techo',
    label: 'Centro (boca techo)',
    grupo: 'libre',
    escalaBase: 1,
    anclaje: { x: 0, y: 0 },
    svgContent: `<circle cx="0" cy="0" r="0.48" fill="currentColor"/>`
  },
  {
    id: 'sym-tierra',
    label: 'Puesta a tierra (jabalina)',
    grupo: 'libre',
    escalaBase: 1,
    anclaje: { x: 0, y: 0 },
    svgContent: `
      <line x1="-0.45" y1="-0.28" x2="0.45" y2="-0.28" fill="none" stroke="currentColor"/>
      <line x1="-0.30" y1="0" x2="0.30" y2="0" fill="none" stroke="currentColor"/>
      <line x1="-0.15" y1="0.28" x2="0.15" y2="0.28" fill="none" stroke="currentColor"/>
      <line x1="0" y1="-0.504" x2="0" y2="-0.28" fill="none" stroke="currentColor"/>
    `
  },
  {
    id: 'sym-toma',
    label: 'Tomacorriente',
    grupo: 'pared',
    escalaBase: 1,
    anclaje: { x: 0, y: 0 },
    svgContent: `
      <path d="M-0.45,0 A0.45,0.45 0 0,1 0.45,0" fill="none" stroke="currentColor"/>
      <line x1="-0.45" y1="0" x2="-0.45" y2="0.54" fill="none" stroke="currentColor"/>
      <line x1="0.45" y1="0" x2="0.45" y2="0.54" fill="none" stroke="currentColor"/>
      <line x1="-0.11" y1="-0.09" x2="0.11" y2="-0.09" fill="none" stroke="currentColor"/>
    `
  },
  {
    id: 'sym-boca-pared',
    label: 'Boca iluminación pared',
    grupo: 'pared',
    escalaBase: 1,
    anclaje: { x: 0, y: 0 },
    svgContent: `
      <circle cx="0" cy="0" r="0.4" fill="none" stroke="currentColor"/>
      <line x1="-0.4" y1="0" x2="0.4" y2="0" fill="none" stroke="currentColor"/>
      <line x1="0" y1="-0.4" x2="0" y2="0.4" fill="none" stroke="currentColor"/>
    `
  },
  {
    id: 'sym-ts',
    label: 'Tablero seccional',
    grupo: 'pared',
    escalaBase: 1,
    anclaje: { x: 0, y: 0 },
    svgContent: `
      <rect x="-0.4" y="-0.2" width="0.8" height="0.4" fill="currentColor"/>
      <line x1="-0.4" y1="-0.2" x2="0.4" y2="0.2" stroke="#fff" stroke-width="0.1"/>
    `
  },
  {
    id: 'sym-tp',
    label: 'Tablero principal',
    grupo: 'pared',
    escalaBase: 1,
    anclaje: { x: 0, y: 0 },
    svgContent: `
      <rect x="-0.5" y="-0.25" width="1" height="0.5" fill="none" stroke="currentColor"/>
      <rect x="-0.5" y="-0.25" width="0.5" height="0.5" fill="currentColor"/>
    `
  },
  {
    id: 'sym-llave-1',
    label: 'Llave 1 punto',
    grupo: 'pared',
    escalaBase: 1,
    anclaje: { x: 0, y: 0 },
    svgContent: `
      <circle cx="0" cy="0" r="0.25" fill="currentColor"/>
      <line x1="0" y1="0" x2="0.35" y2="-0.35" fill="none" stroke="currentColor"/>
    `
  },
  {
    id: 'sym-llave-2',
    label: 'Llave 2 puntos',
    grupo: 'pared',
    escalaBase: 1,
    anclaje: { x: 0, y: 0 },
    svgContent: `
      <circle cx="0" cy="0" r="0.25" fill="currentColor"/>
      <line x1="0" y1="0" x2="0.35" y2="-0.35" fill="none" stroke="currentColor"/>
      <line x1="0" y1="0" x2="-0.35" y2="-0.35" fill="none" stroke="currentColor"/>
    `
  },
  {
    id: 'sym-llave-comb',
    label: 'Llave combinación',
    grupo: 'pared',
    escalaBase: 1,
    anclaje: { x: 0, y: 0 },
    svgContent: `
      <circle cx="0" cy="0" r="0.25" fill="none" stroke="currentColor"/>
      <circle cx="0" cy="0" r="0.1" fill="currentColor"/>
      <line x1="0" y1="0" x2="0.35" y2="-0.35" fill="none" stroke="currentColor"/>
    `
  }
];

// ─── GESTIÓN EN STORAGE ───

const SYMBOLS_KEY = 'ieba_custom_symbols_v1';

export const loadSymbols = (): DefinicionSimbolo[] => {
  try {
    const data = localStorage.getItem(SYMBOLS_KEY);
    if (!data) {
      saveSymbols(DEFAULT_SYMBOLS);
      return DEFAULT_SYMBOLS;
    }
    const parsed = JSON.parse(data);
    // Merge defaults with custom (in case we add new defaults in updates)
    const defaultsIds = DEFAULT_SYMBOLS.map(s => s.id);
    const custom = parsed.filter((s: DefinicionSimbolo) => !defaultsIds.includes(s.id));
    return [...DEFAULT_SYMBOLS, ...custom];
  } catch (error) {
    console.error("Error al cargar símbolos:", error);
    return DEFAULT_SYMBOLS;
  }
};

export const saveSymbols = (symbols: DefinicionSimbolo[]): void => {
  try {
    localStorage.setItem(SYMBOLS_KEY, JSON.stringify(symbols));
  } catch (error) {
    console.error("Error al guardar símbolos:", error);
  }
};
