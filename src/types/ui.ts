export type EditorTab = 'resumen' | 'general' | 'hoja' | 'paredes' | 'aberturas' | 'electrico' | 'circuitos' | 'conexiones' | 'maestro' | 'cobertura';

export type ScreenView = 'projects' | 'editor';

import type { ElementoElectrico } from './project';

export type SymbolDialogData =
  | { mode: 'edit'; existing: ElementoElectrico }
  | { mode: 'create'; x: number; y: number; snapSegIdx?: number; snapPos?: number };
