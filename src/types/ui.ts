import type { ElementoElectrico } from './project';

export type SymbolId = string;

export type EditorTab = 'general' | 'hoja' | 'paredes' | 'aberturas' | 'electrico' | 'circuitos' | 'conexiones' | 'maestro' | 'cobertura';

export type ScreenView = 'projects' | 'editor';

export type SymbolDialogData = 
  | { mode: 'create'; x: number; y: number; snapSegIdx?: number; snapPos?: number }
  | { mode: 'edit'; existing: ElementoElectrico };
