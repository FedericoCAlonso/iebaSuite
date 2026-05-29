
// ═══════════════════════════════════════════════════════════════════════════
// MODULE: symbols.ts
// Librería dinámica de símbolos eléctricos. Reemplaza los símbolos hardcodeados.
// ═══════════════════════════════════════════════════════════════════════════

import symbolsFileData from '../../public/symbols.json';
import type { ModuleType } from '../types/index';

export interface SymbolCategory {
  id: string;
  name: string;
}

export interface DefinicionSimbolo {
  id: string;
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
  /** Uso del símbolo: 'planta' (croquis), 'unifilar' (diagrama), etc. */
  uso?: 'planta' | 'unifilar';
  /** Categoría para filtrado */
  categoria?: string;
  /** Tipo de medición asociada a este símbolo, si la hubiera */
  medicionAsociada?: ModuleType;
}

export interface SymbolsFile {
  categories: SymbolCategory[];
  symbols: DefinicionSimbolo[];
}

// ─── SÍMBOLOS ESTÁNDAR DEL BUNDLE (síncronos) ───

export const getDefaultSymbolsSync = (): DefinicionSimbolo[] => {
  return (symbolsFileData.symbols || []) as DefinicionSimbolo[];
};

export const getDefaultCategoriesSync = (): SymbolCategory[] => {
  return (symbolsFileData.categories || []) as SymbolCategory[];
};

export type SymbolUso = 'planta' | 'unifilar';

export const getSymbolsByUsoSync = (uso?: SymbolUso): DefinicionSimbolo[] => {
  if (!uso) return getDefaultSymbolsSync();
  return getDefaultSymbolsSync().filter(symbol => symbol.uso === uso);
};

export const getSymbolsByCategorySync = (categoria?: string): DefinicionSimbolo[] => {
  if (!categoria) return getDefaultSymbolsSync();
  return getDefaultSymbolsSync().filter(symbol => symbol.categoria === categoria);
};

// ─── GESTIÓN EN STORAGE ───

const SYMBOLS_KEY = 'ieba_custom_symbols_v1';

/**
 * Carga el archivo completo de símbolos (categorías y definiciones).
 * @deprecated Usar getDefaultSymbolsSync / getDefaultCategoriesSync para evitar bloqueos.
 */
export const fetchSymbolsFile = async (): Promise<SymbolsFile> => {
  try {
    const basePath = import.meta.env.BASE_URL || '/';
    const res = await fetch(`${basePath}symbols.json`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    return {
      categories: data.categories || [],
      symbols: data.symbols || []
    };
  } catch (err) {
    console.error("Error al cargar symbols.json estático:", err);
    return { categories: getDefaultCategoriesSync(), symbols: getDefaultSymbolsSync() };
  }
};

/**
 * Carga solo los símbolos base estáticos (para compatibilidad).
 * @deprecated Usar getDefaultSymbolsSync.
 */
export const fetchDefaultSymbols = async (): Promise<DefinicionSimbolo[]> => {
  return getDefaultSymbolsSync();
};

/**
 * Carga símbolos personalizados desde localStorage (síncrono).
 */
export const loadCustomSymbolsFromStorage = (): DefinicionSimbolo[] => {
  try {
    const data = localStorage.getItem(SYMBOLS_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data) as DefinicionSimbolo[];
    const defaultIds = new Set(getDefaultSymbolsSync().map(s => s.id));
    return parsed.filter(s => !defaultIds.has(s.id));
  } catch (error) {
    console.error("Error al cargar símbolos locales:", error);
    return [];
  }
};

/**
 * Carga la librería completa (locales + custom)
 * @deprecated Usar getDefaultSymbolsSync + loadCustomSymbolsFromStorage para carga no bloqueante.
 */
export const loadSymbolsAsync = async (): Promise<DefinicionSimbolo[]> => {
  const defaults = getDefaultSymbolsSync();
  const custom = loadCustomSymbolsFromStorage();
  return [...defaults, ...custom];
};

export const saveSymbols = (symbols: DefinicionSimbolo[]): void => {
  try {
    localStorage.setItem(SYMBOLS_KEY, JSON.stringify(symbols));
  } catch (error) {
    console.error("Error al guardar símbolos:", error);
  }
};