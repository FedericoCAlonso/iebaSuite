export interface LayoutElement {
  type: 'rect' | 'line' | 'text';
  x?: number;
  y?: number;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  width?: number;
  height?: number;
  text?: string;
  fontSize?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  anchor?: 'start' | 'middle' | 'end';
}

export interface TitleBlockConfig {
  width: number;
  height: number;
  elements: LayoutElement[];
}

export interface LayoutConfig {
  titleBlock: TitleBlockConfig;
}

export async function loadLayoutAsync(): Promise<LayoutConfig> {
  const resp = await fetch('./layout.json');
  if (!resp.ok) throw new Error("No se pudo cargar layout.json");
  return resp.json();
}
