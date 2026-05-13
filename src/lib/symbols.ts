// ═══════════════════════════════════════════════════════════════════════════
// MODULE: symbols.ts
// Librería dinámica de símbolos eléctricos. Reemplaza los símbolos hardcodeados.
// ═══════════════════════════════════════════════════════════════════════════

import type { SymbolId } from '../types/index';

export interface DefinicionSimbolo {
  id: SymbolId;
  label: string;
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

// ─── GESTIÓN EN STORAGE ───

const SYMBOLS_KEY = 'ieba_custom_symbols_v1';

/**
 * Carga los símbolos base estáticos desde el archivo externo JSON.
 */
export const fetchDefaultSymbols = async (): Promise<DefinicionSimbolo[]> => {
  try {
    const basePath = import.meta.env.BASE_URL || '/';
    const res = await fetch(`${basePath}symbols.json`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Error al cargar symbols.json estático:", err);
    return [];
  }
};

/**
 * Carga la librería completa (locales + custom)
 */
export const loadSymbolsAsync = async (): Promise<DefinicionSimbolo[]> => {
  const defaults = await fetchDefaultSymbols();
  try {
    const data = localStorage.getItem(SYMBOLS_KEY);
    if (!data) {
      saveSymbols(defaults);
      return defaults;
    }
    const parsed = JSON.parse(data);
    const defaultsIds = defaults.map(s => s.id);
    const custom = parsed.filter((s: DefinicionSimbolo) => !defaultsIds.includes(s.id));
    return [...defaults, ...custom];
  } catch (error) {
    console.error("Error al cargar símbolos locales:", error);
    return defaults;
  }
};

export const saveSymbols = (symbols: DefinicionSimbolo[]): void => {
  try {
    localStorage.setItem(SYMBOLS_KEY, JSON.stringify(symbols));
  } catch (error) {
    console.error("Error al guardar símbolos:", error);
  }
};
