/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MODULE: renderer.ts
 * 
 * Motor de renderizado SVG para planos eléctricos y arquitectónicos.
 * Transforma un modelo de datos (Ambiente) en una representación gráfica vectorial.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import * as GEO from './geometry';
import type { 
  Ambiente, 
  Pared, 
  Abertura, 
  ElementoElectrico, 
  Irregularidad
} from '../types';
import type { DefinicionSimbolo } from './symbols';

/** Interfaz para los metadatos globales del proyecto necesarios para el cálculo */
interface Meta {
  nombre: string;
  escala: number;
  grosor_pared_default: number;
}

/** Tipo simplificado para coordenadas [x, y] */
type Point = [number, number];

/** Configuración visual: Colores, grosores de línea y offsets de cotas */
const C = {
  PARED_FILL: '#D0D0D0', // Color de relleno de los muros
  EXT: '#111111',        // Línea de cara externa
  INT: '#444444',        // Línea de cara interna
  EXT_W: 1.2,            // Grosor línea externa
  INT_W: 0.4,            // Grosor línea interna
  INT_FILL: '#F8F8F0',   // Color de fondo del interior del ambiente
  COTA: '#1040A0',       // Color de las líneas de dimensión
  VENTANA: '#3366AA',    // Color para representar carpintería de vidrio
  PUERTA: '#222222',     // Color para carpintería de madera/metal
  ELEC: '#CC0000',       // Rojo técnico para elementos eléctricos
  MARGEN: 80,            // Margen de seguridad (padding) del SVG
  COTA_OFF: 0.50,        // Distancia de la cota respecto al muro (metros)
  COTA_ARR: 0.12,        // Largo de los "arrastres" o terminales de cota
  COTA_MAR: 0.08,        // Margen del texto sobre la línea de cota
} as const;

/** Formatea números a 2 decimales para optimizar el tamaño del SVG */
const f = (n: number): string => n.toFixed(2);

/** Convierte un array de puntos en un string compatible con el atributo 'points' de SVG */
const ptsAttr = (pts: Point[]): string => pts.map(p => `${f(p[0])},${f(p[1])}`).join(' ');

/** Genera un elemento <line> de SVG */
const line = (a: Point, b: Point, color: string, w: number, dash = ''): string =>
  `<line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}" stroke="${color}" stroke-width="${w}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;

/** Genera un elemento <text> de SVG con rotación opcional */
const txt = (pos: Point, text: string | number, ang: number, color: string, size: number, anchor: 'start' | 'middle' | 'end' = 'middle'): string =>
  `<text x="${f(pos[0])}" y="${f(pos[1])}" font-family="Arial,sans-serif" font-size="${size}" fill="${color}" text-anchor="${anchor}" dominant-baseline="middle" transform="rotate(${f(ang)},${f(pos[0])},${f(pos[1])})">${text}</text>`;

// ─── FUNCIONES DE RENDERIZADO INTERNAS (HELPERS) ───

/**
 * Renderiza irregularidades como columnas o nichos.
 * @param out Buffer de strings donde se acumula el SVG.
 * @param seg Segmento de pared (calculado por GEO) donde se apoya la irregularidad.
 * @param irr Objeto con la definición de la irregularidad (posición, ancho, profundidad).
 */
function _renderIrregularidad(out: string[], seg: any, irr: Irregularidad, escala: number, dx: number, dy: number): void {
  const posPx = GEO.mToPx(irr.posicion, escala);
  const aPx = GEO.mToPx(irr.ancho, escala);
  const pPx = GEO.mToPx(Math.abs(irr.profundidad), escala);
  
  const bI = GEO.add(seg.inicio, GEO.scale(seg.dir, posPx));
  const bF = GEO.add(bI, GEO.scale(seg.dir, aPx));
  
  if (irr.profundidad > 0) { // Columna hacia el interior del ambiente
    const p1 = GEO.add(bI, GEO.scale(seg.v_int, pPx));
    const p2 = GEO.add(bF, GEO.scale(seg.v_int, pPx));
    const pts = [bI, bF, p2, p1].map(p => GEO.add(p, [dx, dy]));
    
    // Polígono relleno de la columna
    out.push(`<polygon points="${ptsAttr(pts)}" fill="${C.PARED_FILL}" stroke="none"/>`);
    // Bordes visibles interiores
    out.push(line(pts[0], pts[3], C.INT, C.INT_W));
    out.push(line(pts[3], pts[2], C.INT, C.INT_W));
    out.push(line(pts[2], pts[1], C.INT, C.INT_W));
    // Tapa la línea interior original de la pared
    out.push(line(pts[0], pts[1], C.PARED_FILL, C.INT_W * 1.5));
  } else { // Nicho hacia el exterior (hueco en la pared, gana espacio interior)
    const p1 = GEO.add(bI, GEO.scale(seg.v_ext, pPx));
    const p2 = GEO.add(bF, GEO.scale(seg.v_ext, pPx));
    const pts = [bI, bF, p2, p1].map(p => GEO.add(p, [dx, dy]));
    
    // Polígono del nicho (color piso) para "comer" la pared gris
    out.push(`<polygon points="${ptsAttr(pts)}" fill="${C.INT_FILL}" stroke="none"/>`);
    // Bordes del nicho (ahora son el nuevo interior)
    out.push(line(pts[0], pts[3], C.INT, C.INT_W));
    out.push(line(pts[3], pts[2], C.INT, C.INT_W));
    out.push(line(pts[2], pts[1], C.INT, C.INT_W));
    // Tapa la línea interior original de la pared con color de piso
    out.push(line(pts[0], pts[1], C.INT_FILL, C.INT_W * 1.5));
  }
}

/**
 * Renderiza aberturas (Puertas, Ventanas, Vanos).
 * Calcula el corte en el muro y dibuja la carpintería correspondiente.
 */
function _renderAbertura(out: string[], ab: Abertura, segs: any[], escala: number, dx: number, dy: number): void {
  const seg = segs[ab.pared];
  if (!seg) return;

  const posPx = GEO.mToPx(ab.posicion, escala);
  const aPx = GEO.mToPx(ab.ancho, escala);
  const bI = GEO.add(seg.inicio, GEO.scale(seg.dir, posPx));
  const bF = GEO.add(bI, GEO.scale(seg.dir, aPx));
  const eI = GEO.add(bI, GEO.scale(seg.v_ext, seg.grosorPx));
  const eF = GEO.add(bF, GEO.scale(seg.v_ext, seg.grosorPx));
  
  const [bIT, bFT, eIT, eFT] = ([bI, bF, eI, eF] as Point[]).map(p => GEO.add(p, [dx, dy]));
  
  // Limpia el fondo del muro (hueco)
  out.push(`<polygon points="${ptsAttr([bIT, bFT, eFT, eIT])}" fill="white" stroke="none"/>`);

  if (ab.tipo === 'vano') {
    out.push(line(bIT, eIT, C.EXT, C.EXT_W * 2), line(bFT, eFT, C.EXT, C.EXT_W * 2));
  } else if (ab.tipo === 'ventana') {
    out.push(line(bIT, bFT, C.EXT, C.EXT_W * 1.5), line(eIT, eFT, C.EXT, C.EXT_W * 1.5));
    const lerp = (a: Point, b: Point, t: number) => GEO.add(a, GEO.scale(GEO.sub(b, a), t));
    [1/3, 2/3].forEach(t => {
      out.push(line(GEO.add(lerp(bI, eI, t), [dx, dy]), GEO.add(lerp(bF, eF, t), [dx, dy]), C.VENTANA, 1.2));
    });
  } else if (ab.tipo === 'puerta') {
    out.push(line(bIT, eIT, C.PUERTA, 1.4), line(bFT, eFT, C.PUERTA, 1.4));
    const vOpen = ab.lado === 'interior' ? seg.v_int : seg.v_ext;
    const drawHoja = (gozne: Point, hA: number) => {
      const pAb = GEO.add(gozne, GEO.scale(vOpen, hA));
      const [gT, pAbT] = [gozne, pAb].map(p => GEO.add(p, [dx, dy]));
      out.push(line(gT, pAbT, C.PUERTA, 1.0));
      const r = f(hA);
      out.push(`<circle cx="${f(gT[0])}" cy="${f(gT[1])}" r="${r}" fill="none" stroke="${C.PUERTA}" stroke-width="0.5" stroke-dasharray="2,2" opacity="0.3"/>`);
    };
    if (ab.sentido === 'derecha') drawHoja(ab.lado === 'interior' ? bI : eI, aPx);
    else drawHoja(ab.lado === 'interior' ? bF : eF, aPx);
  }
}

/**
 * Renderiza las líneas de cota (medidas) externas del ambiente.
 */
function _renderCotas(out: string[], segs: any[], escala: number, dx: number, dy: number): void {
  const offPx = GEO.mToPx(C.COTA_OFF, escala);
  const arrPx = GEO.mToPx(C.COTA_ARR, escala);
  const marPx = GEO.mToPx(C.COTA_MAR, escala);

  for (const seg of segs) {
    const dist = seg.grosorPx + offPx;
    const cI = GEO.add(GEO.add(seg.inicio, GEO.scale(seg.v_ext, dist)), [dx, dy]);
    const cF = GEO.add(GEO.add(seg.fin, GEO.scale(seg.v_ext, dist)), [dx, dy]);
    
    out.push(line(cI, cF, C.COTA, 0.6));
    const diag = GEO.norm(GEO.add(GEO.norm(seg.dir), GEO.norm(seg.v_ext)));
    const diag2 = GEO.scale(diag, -1);
    [cI, cF].forEach(pt => out.push(line(GEO.add(pt, GEO.scale(diag, arrPx / 2)), GEO.add(pt, GEO.scale(diag2, arrPx / 2)), C.COTA, 0.8)));

    const mid: Point = [(cI[0] + cF[0]) / 2, (cI[1] + cF[1]) / 2];
    let ang = Math.atan2(seg.dir[1], seg.dir[0]) * 180 / Math.PI;
    const tPos = (ang > 90 || ang < -90) 
      ? (ang += 180, GEO.add(mid, GEO.scale(seg.v_ext, -(marPx + 6))))
      : GEO.add(mid, GEO.scale(seg.v_ext, marPx + 5));

    const mLen = (GEO.len(GEO.sub(seg.fin, seg.inicio)) * escala / 1000).toFixed(2);
    out.push(txt(tPos, `${mLen} m`, ang, C.COTA, 11));
  }
}

/**
 * Renderiza un símbolo eléctrico individual.
 * Si el elemento tiene pared asignada, calcula automáticamente su posición y rotación.
 */
function _renderElemento(out: string[], el: ElementoElectrico, segs: any[], k: number, dx: number, dy: number, exportMode: boolean, symbolsLib: DefinicionSimbolo[]): void {
  let ex = el.x + dx;
  let ey = el.y + dy;
  let angRot = 0;

  if (el.paredIdx !== null && el.paredIdx < segs.length) {
    const seg = segs[el.paredIdx];
    const xy = GEO.posEnPared(seg, el.paredPos || 0);
    ex = xy[0] + dx;
    ey = xy[1] + dy;
    angRot = GEO.anguloSimboloPared(seg);
  }

  const symDef = symbolsLib.find(s => s.id === el.tipo);
  
  out.push(`<g transform="translate(${f(ex)},${f(ey)}) rotate(${f(angRot)})" data-elec-id="${el.id}" style="cursor:pointer" color="${C.ELEC}">`);
  
  if (symDef) {
    // Aplicamos la escala base del símbolo multiplicada por el tamaño unitario k
    const scaleFactor = k * symDef.escalaBase;
    out.push(`<g transform="scale(${f(scaleFactor)})" stroke-width="${f(0.9 / scaleFactor)}">`);
    out.push(symDef.svgContent);
    out.push('</g>');
  } else {
    // Fallback genérico si el símbolo no existe
    out.push(`<circle cx="0" cy="0" r="${f(k * 0.4)}" fill="none" stroke="currentColor" stroke-width="0.8"/>`);
  }

  if (exportMode && el.referencia) {
    out.push(txt([k * 0.8, -k * 0.8], el.referencia, -angRot, C.ELEC, 9, 'start'));
  }
  out.push('</g>');
}

// ─── OBJETO PÚBLICO RENDERER ───

export const RENDERER = {
  // El antiguo symbolPath(tipo, k) se elimina ya que ahora es dinámico

  /**
   * Genera los segmentos geométricos procesados a partir de los datos de paredes.
   */
  buildSegs(ambiente: Ambiente, meta: Meta) {
    const paredes = (ambiente.paredes || []).map((p: Pared) => ({
      ...p,
      grosor: p.grosor ?? meta.grosor_pared_default
    }));
    const segs = GEO.construirEjes(paredes, meta.escala, ambiente.sentido === 'horario' ? 1 : -1);
    GEO.calcularVectores(segs);
    return segs;
  },

  /**
   * Calcula elBounding Box total del dibujo para centrarlo y dimensionar el SVG.
   * @returns Desplazamiento (dx, dy) y dimensiones totales (W, H).
   */
  getBboxOffset(ambiente: Ambiente, meta: Meta) {
    const segs = this.buildSegs(ambiente, meta);
    if (!segs.length) return { dx: C.MARGEN, dy: C.MARGEN, W: 300, H: 200 };
    const offPx = GEO.mToPx(C.COTA_OFF, meta.escala);
    const cotaPts = segs.flatMap(s => [
      GEO.add(s.inicio, GEO.scale(s.v_ext, s.grosorPx + offPx)),
      GEO.add(s.fin, GEO.scale(s.v_ext, s.grosorPx + offPx))
    ]);
    const [xMin, yMin, xMax, yMax] = GEO.bbox(segs, cotaPts as Point[]);
    return {
      dx: -xMin + C.MARGEN,
      dy: -yMin + C.MARGEN,
      W: (xMax - xMin) + 2 * C.MARGEN,
      H: (yMax - yMin) + 2 * C.MARGEN + 28
    };
  },

  /**
   * FUNCIÓN PRINCIPAL: Genera el string SVG final.
   * @param ambiente Datos del ambiente (paredes, aberturas, elementos).
   * @param meta Metadatos del proyecto (escala, nombre).
   * @param exportMode Si es true, añade etiquetas técnicas (referencias) para impresión.
   */
  render(ambiente: Ambiente, meta: Meta, symbolsLib: DefinicionSimbolo[], exportMode = false): string {
    const segs = this.buildSegs(ambiente, meta);
    if (!segs.length) return `<svg width="300" height="200"></svg>`;

    const { dx, dy, W, H } = this.getBboxOffset(ambiente, meta);
    const cerrado = GEO.esCerrado(segs);
    const out: string[] = [];

    // 1. Polígono de fondo (piso)
    out.push(`<polygon points="${ptsAttr(segs.map(s => GEO.add(s.inicio, [dx, dy])))}" fill="${C.INT_FILL}" stroke="none"/>`);

    // 2. Muros principales
    const { ext, int } = GEO.poligonoMuro(segs, cerrado);
    const extT = ext.map(p => GEO.add(p as Point, [dx, dy]));
    const intT = int.map(p => GEO.add(p as Point, [dx, dy]));
    out.push(`<polygon points="${ptsAttr([...extT, ...([...intT].reverse())])}" fill="${C.PARED_FILL}" stroke="none"/>`);
    
    // Contornos de muros
    extT.forEach((p, i) => out.push(line(p, extT[(i + 1) % extT.length], C.EXT, C.EXT_W)));
    intT.forEach((p, i) => out.push(line(p, intT[(i + 1) % intT.length], C.INT, C.INT_W)));

    // 3. Irregularidades (columnas/nichos)
    segs.forEach(seg => {
      seg.pared.irregularidades?.forEach((irr: Irregularidad) => {
        _renderIrregularidad(out, seg, irr, meta.escala, dx, dy);
      });
    });

    // 4. Aberturas y Cotas
    ambiente.aberturas?.forEach(ab => _renderAbertura(out, ab, segs, meta.escala, dx, dy));
    if (ambiente.mostrar_cotas) _renderCotas(out, segs, meta.escala, dx, dy);

    // 5. Elementos Eléctricos
    const kSize = GEO.mToPx(0.22, meta.escala);
    ambiente.elementos?.forEach((el: ElementoElectrico) => {
      _renderElemento(out, el, segs, kSize, dx, dy, exportMode, symbolsLib);
    });

    // 6. Textos libres
    ambiente.textos?.forEach((t) => {
      // Usamos C.TXT o un color oscuro.
      out.push(txt([t.x + dx, t.y + dy], t.texto, 0, '#333', t.tamano, 'middle'));
    });

    // 7. Pie de plano (Título)
    out.push(txt([W / 2, H - 10], `${meta.nombre} — ${ambiente.nombre}`, 0, '#333', 11, 'middle'));

    // Envolver todo en el tag <svg>
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${f(W)}" height="${f(H)}" viewBox="0 0 ${f(W)} ${f(H)}">
      <rect width="100%" height="100%" fill="white"/>
      ${out.join('\n')}
    </svg>`;
  }
};