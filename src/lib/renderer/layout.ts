// ═══════════════════════════════════════════════════════════════════════════
// MODULE: renderer/layout.ts
// Cálculos de posicionamiento en la hoja (A4, A3) y Bounding Boxes.
// ═══════════════════════════════════════════════════════════════════════════
import * as GEO from '../geometry';
import type { Point } from '../geometry';
import type { Ambiente, Meta } from '../../types/index';
import { buildSegs } from '../geometry';
import { C } from './constants';

export function getLayout(ambiente: Ambiente, meta: Meta) {
  const { allSegs: segs } = buildSegs(ambiente, meta);
  const conf = ambiente.configHoja || { formato: 'A4', orientacion: 'horizontal' };
  const margin = 10;
  const rotuloH = 35;
  
  let pageW = conf.formato === 'A3' ? 420 : 297;
  let pageH = conf.formato === 'A3' ? 297 : 210;
  if (conf.orientacion === 'vertical') [pageW, pageH] = [pageH, pageW];

  if (!segs.length) {
    return { dx: margin, dy: margin, pageW, pageH, margin, rotuloH };
  }

  const offPx = GEO.mToPx(C.COTA_OFF, meta.escala);
  const cotaPts = segs.flatMap(s => [
    GEO.add(s.inicio, GEO.scale(s.v_ext, s.grosorPx + offPx)),
    GEO.add(s.fin, GEO.scale(s.v_ext, s.grosorPx + offPx))
  ]);
  const [xMin, yMin, xMax, yMax] = GEO.bbox(segs, cotaPts as Point[]);
  
  const drawW = xMax - xMin;
  const drawH = yMax - yMin;
  const availableW = pageW - 2 * margin;
  const availableH = pageH - 2 * margin - rotuloH;
  
  const dx = -xMin + margin + (availableW - drawW) / 2;
  const dy = -yMin + margin + (availableH - drawH) / 2;

  return { dx, dy, pageW, pageH, margin, rotuloH };
}

export function getBboxOffset(ambiente: Ambiente, meta: Meta) {
  const layout = getLayout(ambiente, meta);
  return { dx: layout.dx, dy: layout.dy, W: layout.pageW, H: layout.pageH };
}
