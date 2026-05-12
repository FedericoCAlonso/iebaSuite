/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MODULE: geometry.ts
 * 
 * Motor geométrico para el cálculo de estructuras de muros y posicionamiento.
 * Proporciona utilidades de álgebra vectorial y cálculo de intersecciones.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import type { Pared, Project, Ambiente } from '../types';

/** Punto o Vector en el plano 2D */
export type Point = [number, number];

/** Estructura de un segmento de muro procesado para el renderizado */
export interface Segmento {
  inicio: Point;
  fin: Point;
  dir: Point;
  v_ext: Point;
  v_int: Point;
  grosorPx: number;
  pared?: Pared;
}

/** Estructura unificada para la malla global (Master Mesh) */
export interface MasterSegment {
  inicio: Point;
  fin: Point;
  dir: Point;
  v_ext: Point;
  grosorPx: number;
  esEnvolvente: boolean;
  roomIds: string[];
}

// ─── UTILIDADES VECTORIALES ───

export const mToPx = (metros: number, escala: number): number => (metros * 1000) / escala;
export const pxToM = (px: number, escala: number): number => (px * escala) / 1000;

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
export const norm = ([x, y]: Point): Point => {
  const l = Math.hypot(x, y);
  return l > 1e-10 ? [x / l, y / l] : [0, 0];
};
export const perpIzq = ([x, y]: Point): Point => [y, -x];
export const dot = ([ax, ay]: Point, [bx, by]: Point): number => ax * bx + ay * by;
export const len = ([x, y]: Point): number => Math.hypot(x, y);
export const dist = (p1: Point, p2: Point): number => Math.hypot(p1[0] - p2[0], p1[1] - p2[1]);

export const lineIntersect = (
  [p1x, p1y]: Point, [d1x, d1y]: Point,
  [p2x, p2y]: Point, [d2x, d2y]: Point
): Point | null => {
  const cross = d1x * d2y - d1y * d2x;
  if (Math.abs(cross) < 1e-10) return null;
  const t = ((p2x - p1x) * d2y - (p2y - p1y) * d2x) / cross;
  return [p1x + d1x * t, p1y + d1y * t];
};

const ingleteLimitado = (pBase: Point, pCand: Point | null, g: number, limit = 4.0): Point => {
  if (!pCand) return pBase;
  return Math.hypot(pCand[0] - pBase[0], pCand[1] - pBase[1]) > limit * g ? pBase : pCand;
};

// ─── LÓGICA DE NEGOCIO ───

export function construirEjes(paredes: Pared[], escala: number, sentido: number, origenX = 0, origenY = 0): Segmento[] {
  const segs: Segmento[] = [];
  let pos: Point = [mToPx(origenX, escala), mToPx(origenY, escala)];
  const startPos: Point = [...pos];
  let dir: Point = [1, 0];

  paredes.forEach((pared, i) => {
    const grosor = (pared.grosor !== null && pared.grosor !== 0) ? pared.grosor : 0.15;
    const grosorPx = mToPx(grosor, escala);
    if (i > 0) dir = rot(dir, sentido * (pared.angulo || 0));
    const esAutoCierre = pared.largo === 'auto' || (pared.largo === 0 && i >= 2);
    
    if (esAutoCierre) {
      if (i !== paredes.length - 1) return;
      const cierre: Point = [startPos[0] - pos[0], startPos[1] - pos[1]];
      const d = len(cierre);
      if (d < 1e-6) return;
      segs.push({
        inicio: pos, fin: [...startPos], dir: norm(cierre), grosorPx,
        pared, v_ext: [0, 0], v_int: [0, 0]
      });
      pos = [...startPos];
    } else {
      const largoNum = typeof pared.largo === 'number' ? pared.largo : 0;
      const largoPx = mToPx(largoNum, escala);
      const fin = add(pos, scale(dir, largoPx));
      segs.push({
        inicio: pos, fin, dir, grosorPx,
        pared, v_ext: [0, 0], v_int: [0, 0]
      });
      pos = fin;
    }
  });
  return segs;
}

export function calcularVectores(segs: Segmento[]): void {
  let area = 0;
  segs.forEach(s => { area += s.inicio[0] * s.fin[1] - s.fin[0] * s.inicio[1]; });
  const cw = area >= 0;
  segs.forEach(s => {
    const p = perpIzq(s.dir);
    if (cw) {
      s.v_int = [-p[0], -p[1]] as Point;
      s.v_ext = p;
    } else {
      s.v_int = p;
      s.v_ext = [-p[0], -p[1]] as Point;
    }
  });
}

export function snapAPared(cx: number, cy: number, segs: Segmento[]) {
  let bestDist = Infinity;
  let result = { segIdx: -1, seg: null as Segmento | null, pos: 0, dist: Infinity, lado: 'interior' as 'interior' | 'exterior' };
  segs.forEach((s, i) => {
    const v = sub(s.fin, s.inicio);
    const vLen = len(v);
    if (vLen < 1e-6) return;
    const vN = scale(v, 1 / vLen);
    const w = sub([cx, cy], s.inicio);
    let t = dot(w, vN);
    t = Math.max(0, Math.min(vLen, t));
    const proj = add(s.inicio, scale(vN, t));
    const distToAxis = dist([cx, cy], proj);
    const distToExt = dist([cx, cy], add(proj, scale(s.v_ext, s.grosorPx)));
    const lado: 'interior' | 'exterior' = distToAxis < distToExt ? 'interior' : 'exterior';
    const distAlLado = Math.min(distToAxis, distToExt);
    if (distAlLado < bestDist) {
      bestDist = distAlLado;
      result = { segIdx: i, seg: s, pos: t, dist: distAlLado, lado };
    }
  });
  return result;
}

export function esCerrado(segs: Segmento[]): boolean {
  if (segs.length < 3) return false;
  return dist(segs[segs.length - 1].fin, segs[0].inicio) < 1.0;
}

export function puntoCara(segRef: Segmento, segVec: Segmento | null, lado: 'ext' | 'int', esFin: boolean): Point {
  const g = segRef.grosorPx;
  const offset: Point = lado === 'ext' ? scale(segRef.v_ext, g) : [0, 0];
  const basePt = esFin ? segRef.fin : segRef.inicio;
  if (!segVec) return add(basePt, offset);
  const offV: Point = lado === 'ext' ? scale(segVec.v_ext, segVec.grosorPx) : [0, 0];
  const cand = lineIntersect(add(segRef.inicio, offset), segRef.dir, add(segVec.inicio, offV), segVec.dir);
  return ingleteLimitado(add(basePt, offset), cand, g);
}

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

export function isPointInPolygon(p: Point, poly: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1];
    const xj = poly[j][0], yj = poly[j][1];
    const intersect = ((yi > p[1]) !== (yj > p[1])) && (p[0] < (xj - xi) * (p[1] - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

export function isPointOnSegment(p: Point, s1: Point, s2: Point, tolerance = 0.5): boolean {
  const d = dist(s1, s2);
  if (d < 1e-6) return dist(p, s1) < tolerance;
  const t = dot(sub(p, s1), sub(s2, s1)) / (d * d);
  if (t < 0 || t > 1) return false;
  const proj = add(s1, scale(sub(s2, s1), t));
  return dist(p, proj) < tolerance;
}

export function fragmentarSegmento(seg: Segmento, puntos: Point[], tolerance = 1.0): Segmento[] {
  const lTotal = dist(seg.inicio, seg.fin);
  const cuts: number[] = [0, lTotal];
  puntos.forEach(p => {
    if (isPointOnSegment(p, seg.inicio, seg.fin, tolerance)) {
      const d = dist(p, seg.inicio);
      if (d > tolerance && d < lTotal - tolerance) cuts.push(d);
    }
  });
  cuts.sort((a, b) => a - b);
  const result: Segmento[] = [];
  for (let i = 0; i < cuts.length - 1; i++) {
    if (cuts[i+1] - cuts[i] < tolerance) continue;
    const inicio = add(seg.inicio, scale(seg.dir, cuts[i]));
    const fin = add(seg.inicio, scale(seg.dir, cuts[i+1]));
    result.push({ ...seg, inicio, fin });
  }
  return result;
}

export function transformPoint(p: Point, posX: number, posY: number, rotation: number, escala: number): Point {
  const rotated = rot(p, rotation);
  return [rotated[0] + mToPx(posX, escala), rotated[1] + mToPx(posY, escala)];
}

export function transformSegment(s: Segmento, posX: number, posY: number, rotation: number, escala: number): Segmento {
  return {
    ...s,
    inicio: transformPoint(s.inicio, posX, posY, rotation, escala),
    fin: transformPoint(s.fin, posX, posY, rotation, escala),
    dir: rot(s.dir, rotation),
    v_ext: rot(s.v_ext, rotation),
    v_int: rot(s.v_int, rotation)
  };
}

export function posEnPared(seg: Segmento, pos: number): Point {
  return add(seg.inicio, scale(seg.dir, pos));
}

export function anguloSimboloPared(seg: Segmento): number {
  const [nx, ny] = seg.v_int;
  return Math.atan2(nx, -ny) * 180 / Math.PI;
}

export function buildSegs(amb: Ambiente, meta: any) {
  const tramos = (amb.tramos || []).map((t: any) => {
    const s = construirEjes(t.paredes, meta.escala, t.sentido || 1);
    calcularVectores(s);
    return { segs: s, cerrado: esCerrado(s) };
  });
  const allSegs = tramos.flatMap((t: any) => t.segs);
  return { tramos, allSegs };
}

export function buildMasterMesh(project: Project): MasterSegment[] {
  const escala = project.meta.escala;
  const ambs = project.ambientes.filter(a => a.posX !== undefined && a.posY !== undefined);
  const pool: MasterSegment[] = ambs.flatMap(amb => {
    const { allSegs } = buildSegs(amb, project.meta);
    return allSegs.map(s => {
      const gs = transformSegment(s, amb.posX!, amb.posY!, amb.rotation || 0, escala);
      return { inicio: gs.inicio, fin: gs.fin, dir: gs.dir, v_ext: gs.v_ext, grosorPx: gs.grosorPx, esEnvolvente: false, roomIds: [amb.id] };
    });
  });
  if (!pool.length) return [];
  const vertices = pool.flatMap(s => [s.inicio, s.fin]);
  const fragments: MasterSegment[] = pool.flatMap(s => {
    const cuts = fragmentarSegmento({ inicio: s.inicio, fin: s.fin, dir: s.dir, v_ext: s.v_ext, v_int: [0,0], grosorPx: s.grosorPx }, vertices, 1.0);
    return cuts.map(c => ({ ...s, inicio: c.inicio, fin: c.fin, dir: c.dir }));
  });
  const mesh: MasterSegment[] = [];
  fragments.forEach(f => {
    const existing = mesh.find(m => (dist(m.inicio, f.inicio) < 2.0 && dist(m.fin, f.fin) < 2.0) || (dist(m.inicio, f.fin) < 2.0 && dist(m.fin, f.inicio) < 2.0));
    if (existing) { if (!existing.roomIds.includes(f.roomIds[0])) existing.roomIds.push(f.roomIds[0]); }
    else { mesh.push({ ...f }); }
  });
  const roomPolys = ambs.map(amb => {
    const { allSegs } = buildSegs(amb, project.meta);
    const { int } = poligonoMuro(allSegs, true);
    return int.map(p => transformPoint(p as Point, amb.posX!, amb.posY!, amb.rotation || 0, escala));
  });
  mesh.forEach(m => {
    const mid = scale(add(m.inicio, m.fin), 0.5);
    const checkPt = add(mid, scale(m.v_ext, 2.0 + m.grosorPx));
    m.esEnvolvente = !roomPolys.some(poly => isPointInPolygon(checkPt, poly));
  });
  return mesh;
}