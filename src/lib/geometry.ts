/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MODULE: geometry.ts
 * 
 * Motor geométrico para el cálculo de estructuras de muros y posicionamiento.
 * Proporciona utilidades de álgebra vectorial y cálculo de intersecciones.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import type { Pared } from '../types';

/** Punto o Vector en el plano 2D */
export type Point = [number, number];

/** Estructura de un segmento de muro procesado para el renderizado */
export interface Segmento {
  inicio: Point;      // Punto [x, y] de inicio en mm papel
  fin: Point;         // Punto [x, y] de fin en mm papel
  dir: Point;         // Vector unitario de dirección del eje
  grosorPx: number;   // Grosor de la pared convertido a mm papel
  pared: Pared;       // Entidad original del modelo
  v_ext: Point;       // Normal unitaria hacia el exterior (cara visible)
  v_int: Point;       // Normal unitaria hacia el interior (cara oculta)
  largoPx?: number;   // Longitud en mm papel (opcional cache)
  largoM?: number;    // Longitud en metros reales (opcional cache)
}

// ─── UTILIDADES VECTORIALES ───

/** Convierte metros a píxeles según la escala (1:escala) */
export const mToPx = (m: number, esc: number): number => m * 1000.0 / esc;


/** 
 * Convierte una medida de píxeles en el plano a metros reales.
 * Fórmula: (píxeles * escala) / 1000
 */
export const pxToM = (px: number, escala: number): number => (px * escala) / 1000;

/** 
 * Rota un vector una cantidad de grados determinada.
 * IMPORTANTE: El ángulo es relativo a la dirección actual.
 * En el sistema SVG (Y-down), un ángulo positivo gira en sentido horario 
 * si el vector base es [1,0].
 */
export const rot = ([x, y]: Point, deg: number): Point => {
  const r = deg * Math.PI / 180;
  return [
    x * Math.cos(r) - y * Math.sin(r),
    x * Math.sin(r) + y * Math.cos(r)
  ];
};

export const add = ([ax, ay]: Point, [bx, by]: Point): Point => [ax + bx, ay + by];
export const sub = ([ax, ay]: Point, [bx, by]: Point): Point => [ax - bx, ay - by];
export const scale = ([x, y]: Point, s: number): Point => [x * s, y * s];



// Asegúrate de exportarlas en el retorno si usas el patrón de objeto, 
// o simplemente déjalas como export const si usas módulos.

/** Normaliza un vector para que tenga longitud 1 */
export const norm = ([x, y]: Point): Point => {
  const l = Math.hypot(x, y);
  return l > 1e-10 ? [x / l, y / l] : [0, 0];
};

/** Devuelve el vector perpendicular izquierdo (Normal) en sistema Y-down */
export const perpIzq = ([x, y]: Point): Point => [y, -x];

/** Producto punto entre dos vectores */
export const dot = ([ax, ay]: Point, [bx, by]: Point): number => ax * bx + ay * by;

/** Longitud o norma de un vector */
export const len = ([x, y]: Point): number => Math.hypot(x, y);

/** Calcula la intersección entre dos rectas definidas por punto y dirección */
export const lineIntersect = (
  [p1x, p1y]: Point, [d1x, d1y]: Point,
  [p2x, p2y]: Point, [d2x, d2y]: Point
): Point | null => {
  const cross = d1x * d2y - d1y * d2x;
  if (Math.abs(cross) < 1e-10) return null;
  const t = ((p2x - p1x) * d2y - (p2y - p1y) * d2x) / cross;
  return [p1x + d1x * t, p1y + d1y * t];
};

/** Limita el efecto de "pico" en las esquinas (uniones en inglete) muy agudas */
const ingleteLimitado = (pBase: Point, pCand: Point | null, g: number, limit = 4.0): Point => {
  if (!pCand) return pBase;
  return Math.hypot(pCand[0] - pBase[0], pCand[1] - pBase[1]) > limit * g ? pBase : pCand;
};

// ─── LÓGICA DE NEGOCIO GEOMÉTRICA ───

/**
 * Genera la secuencia de ejes (Segmentos) a partir de la definición de paredes.
 * Maneja el cálculo de rumbos basándose en ángulos relativos.
 */
export function construirEjes(paredes: Pared[], escala: number, sentido: number): Segmento[] {
  const segs: Segmento[] = [];
  let pos: Point = [0, 0];
  let dir: Point = [1, 0]; // Dirección inicial (Este)

  paredes.forEach((pared, i) => {
    const grosor = (pared.grosor !== null && pared.grosor !== 0) ? pared.grosor : 0.15;
    const grosorPx = mToPx(grosor, escala);

    // Lógica de Rumbos:
    // El primer muro (i=0) mantiene la dirección inicial [1, 0].
    // Los muros siguientes rotan respecto al anterior usando el ángulo relativo.
    // 'sentido' (1 o -1) invierte el giro para permitir trazados horarios/antihorarios.
    if (i > 0) {
      dir = rot(dir, sentido * (pared.angulo || 0));
    }

    // Caso de cierre automático (mínimo 3 paredes para formar un polígono, es decir, index >= 2)
    const esAutoCierre = pared.largo === 'auto' || (pared.largo === 0 && i >= 2);
    
    if (esAutoCierre) {
      if (i !== paredes.length - 1) return; // Solo la última puede ser auto-cierre
      const cierre: Point = [-pos[0], -pos[1]];
      const dist = len(cierre);
      if (dist < 1e-6) return;
      segs.push({
        inicio: pos,
        fin: [0, 0],
        dir: norm(cierre),
        grosorPx,
        pared,
        v_ext: [0, 0], v_int: [0, 0]
      });
      pos = [0, 0];
    } else {
      const largoNum = typeof pared.largo === 'number' ? pared.largo : 0;
      const largoPx = mToPx(largoNum, escala);
      const fin = add(pos, scale(dir, largoPx));
      segs.push({
        inicio: pos,
        fin,
        dir,
        grosorPx,
        pared,
        v_ext: [0, 0], v_int: [0, 0]
      });
      pos = fin;
    }
  });
  return segs;
}

/**
 * Calcula los vectores normales (v_ext y v_int) para cada segmento.
 * Utiliza el área signada para determinar la orientación (CW o CCW) del polígono.
 */
export function calcularVectores(segs: Segmento[]): void {
  let area = 0;
  segs.forEach(s => { area += s.inicio[0] * s.fin[1] - s.fin[0] * s.inicio[1]; });
  const cw = area >= 0;

  segs.forEach(s => {
    const p = perpIzq(s.dir); // p es NORMAL IZQUIERDA
    if (cw) {
      // En sentido horario, el interior queda a la DERECHA
      s.v_int = [-p[0], -p[1]] as Point; // Derecha = Interior
      s.v_ext = p;                       // Izquierda = Exterior
    } else {
      // En sentido antihorario, el interior queda a la IZQUIERDA
      s.v_int = p;                       // Izquierda = Interior
      s.v_ext = [-p[0], -p[1]] as Point; // Derecha = Exterior
    }
  });
}

/** Determina si el conjunto de segmentos forma un polígono cerrado */
export function esCerrado(segs: Segmento[]): boolean {
  if (segs.length < 3) return false;
  const i = segs[0].inicio;
  const f = segs[segs.length - 1].fin;
  return Math.hypot(f[0] - i[0], f[1] - i[1]) < 1.0;
}

/** Calcula el punto de intersección en las caras (internas o externas) de un muro */
export function puntoCara(segRef: Segmento, segVec: Segmento | null, lado: 'ext' | 'int', esFin: boolean): Point {
  const g = segRef.grosorPx;
  const offset: Point = lado === 'ext' ? scale(segRef.v_ext, g) : [0, 0];
  const basePt = esFin ? segRef.fin : segRef.inicio;

  if (!segVec) return add(basePt, offset);

  const offV: Point = lado === 'ext' ? scale(segVec.v_ext, segVec.grosorPx) : [0, 0];
  const cand = lineIntersect(
    add(segRef.inicio, offset), segRef.dir,
    add(segVec.inicio, offV), segVec.dir
  );

  return ingleteLimitado(add(basePt, offset), cand, g);
}

/** Genera los arrays de puntos necesarios para dibujar el polígono del muro */
export function poligonoMuro(segs: Segmento[], cerrado: boolean) {
  const n = segs.length;
  const ext: Point[] = [];
  const int: Point[] = [];

  for (let i = 0; i < n; i++) {
    const ant = (i > 0 || cerrado) ? segs[i > 0 ? i - 1 : n - 1] : null;
    const sig = (i < n - 1 || cerrado) ? segs[(i + 1) % n] : null;

    const iE = puntoCara(segs[i], ant, 'ext', false);
    const fE = puntoCara(segs[i], sig, 'ext', true);
    const iI = puntoCara(segs[i], ant, 'int', false);
    const fI = puntoCara(segs[i], sig, 'int', true);

    if (i === 0) { ext.push(iE); int.push(iI); }
    ext.push(fE); int.push(fI);
  }
  return { ext, int };
}

/** Calcula el rectángulo delimitador (BBox) de todo el conjunto */
export function bbox(segs: Segmento[], extra: Point[] = []): [number, number, number, number] {
  const pts: Point[] = [];
  segs.forEach(s => {
    pts.push(s.inicio, s.fin);
    pts.push(add(s.inicio, scale(s.v_ext, s.grosorPx)));
    pts.push(add(s.fin, scale(s.v_ext, s.grosorPx)));
  });
  pts.push(...extra);

  if (!pts.length) return [0, 0, 200, 200];
  const xs = pts.map(p => p[0]);
  const ys = pts.map(p => p[1]);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}

/** Dada una coordenada, encuentra el punto más cercano sobre los ejes de los muros */
export function snapAPared(cx: number, cy: number, segs: Segmento[]) {
  let bestDist = Infinity;
  let result = { segIdx: -1, seg: null as Segmento | null, pos: 0, dist: Infinity };

  segs.forEach((s, i) => {
    const v = sub(s.fin, s.inicio);
    const vLen = len(v);
    if (vLen < 1e-6) return;

    const vN = scale(v, 1 / vLen);
    const w = sub([cx, cy], s.inicio);
    let t = dot(w, vN);
    t = Math.max(0, Math.min(vLen, t));

    const proj = add(s.inicio, scale(vN, t));
    const dist = Math.hypot(cx - proj[0], cy - proj[1]);

    if (dist < bestDist) {
      bestDist = dist;
      result = { segIdx: i, seg: s, pos: t, dist };
    }
  });
  return result;
}

/** Devuelve la coordenada XY centrada en el grosor del muro para una posición dada */
export function posEnPared(seg: Segmento, pos: number): Point {
  const v = norm(sub(seg.fin, seg.inicio));
  return add(seg.inicio, scale(v, pos));
}

/** Calcula el ángulo de rotación de un símbolo para que su normal mire al interior */
export function anguloSimboloPared(seg: Segmento): number {
  const [nx, ny] = seg.v_int;
  return Math.atan2(nx, -ny) * 180 / Math.PI;
}