// ═══════════════════════════════════════════════════════════════════════════
// MODULE: renderer/geometry.ts
// Construcción de segmentos y geometría base a partir del modelo.
// ═══════════════════════════════════════════════════════════════════════════
import * as GEO from '../geometry';
import type { Ambiente, Meta, Pared } from '../../types/index';

/**
 * Genera los segmentos geométricos procesados a partir de los datos de tramos.
 */
export function buildSegs(ambiente: Ambiente, meta: Meta) {
  const tramos = (ambiente.tramos || []).map(t => {
    const paredes = t.paredes.map((p: Pared) => ({
      ...p,
      grosor: p.grosor ?? meta.grosor_pared_default
    }));
    const segs = GEO.construirEjes(paredes, meta.escala, ambiente.sentido === 'horario' ? 1 : -1, t.origenX || 0, t.origenY || 0);
    GEO.calcularVectores(segs);
    return { segs, cerrado: t.cerrado };
  });
  
  return {
    tramos,
    allSegs: tramos.flatMap(t => t.segs)
  };
}
