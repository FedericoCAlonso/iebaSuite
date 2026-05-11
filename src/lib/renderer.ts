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
  Project,
  Ambiente, 
  Pared, 
  Abertura, 
  ElementoElectrico, 
  Irregularidad,
  Meta
} from '../types';
import type { DefinicionSimbolo } from './symbols';
import type { LayoutConfig } from './layout';

/** Interfaz para los metadatos globales del proyecto (Importada de types) */

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
  COTA_SIZE_DEFAULT: 2.5 // mm en papel
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
function _renderCotas(out: string[], ambiente: Ambiente, segs: any[], escala: number, dx: number, dy: number): void {
  const offPx = GEO.mToPx(C.COTA_OFF, escala);
  const arrPx = GEO.mToPx(C.COTA_ARR, escala);
  const marPx = GEO.mToPx(C.COTA_MAR, escala);
  const cotaSize = ambiente.cotaSize || C.COTA_SIZE_DEFAULT;

  for (const seg of segs) {
    const dist = seg.grosorPx + offPx;
    const cI = GEO.add(GEO.add(seg.inicio, GEO.scale(seg.v_ext, dist)), [dx, dy]);
    const cF = GEO.add(GEO.add(seg.fin, GEO.scale(seg.v_ext, dist)), [dx, dy]);
    
    out.push(line(cI, cF, C.COTA, 0.3)); // Línea más fina para cotas
    const diag = GEO.norm(GEO.add(GEO.norm(seg.dir), GEO.norm(seg.v_ext)));
    const diag2 = GEO.scale(diag, -1);
    [cI, cF].forEach(pt => out.push(line(GEO.add(pt, GEO.scale(diag, arrPx / 2)), GEO.add(pt, GEO.scale(diag2, arrPx / 2)), C.COTA, 0.4)));

    const mid: Point = [(cI[0] + cF[0]) / 2, (cI[1] + cF[1]) / 2];
    let ang = Math.atan2(seg.dir[1], seg.dir[0]) * 180 / Math.PI;
    
    // Offset del texto proporcional al tamaño de fuente
    const textOffset = cotaSize * 0.8;
    const tPos = (ang > 90 || ang < -90) 
      ? (ang += 180, GEO.add(mid, GEO.scale(seg.v_ext, -(marPx + textOffset))))
      : GEO.add(mid, GEO.scale(seg.v_ext, marPx + textOffset));

    const mLen = (GEO.len(GEO.sub(seg.fin, seg.inicio)) * escala / 1000).toFixed(2);
    out.push(txt(tPos, `${mLen} m`, ang, C.COTA, cotaSize));
  }
}

/** 
 * Calcula la posición [x,y] de un elemento en el canvas (mm papel)
 */
function _getElementPos(el: ElementoElectrico, segs: any[], escala: number, dx: number, dy: number): Point {
  let ex = GEO.mToPx(el.x, escala) + dx;
  let ey = GEO.mToPx(el.y, escala) + dy;
  if (el.paredIdx !== null && el.paredIdx < segs.length) {
    const seg = segs[el.paredIdx];
    const xy = GEO.posEnPared(seg, GEO.mToPx(el.paredPos || 0, escala));
    ex = xy[0] + dx;
    ey = xy[1] + dy;
  }
  return [ex, ey];
}

/** 
 * Calcula la posición global [x,y] de un elemento en el canvas maestro (mm papel sin offsets de layout)
 */
function _getGlobalElementPos(project: Project, ambienteId: string, elementoId: string, escala: number): Point | null {
  const amb = project.ambientes.find(a => a.id === ambienteId);
  if (!amb) return null;
  const el = amb.elementos?.find(e => e.id === elementoId);
  if (!el) return null;
  
  const segs = RENDERER.buildSegs(amb, project.meta);
  const localPos = _getElementPos(el, segs, escala, 0, 0);
  
  const gX = GEO.mToPx(amb.posX || 0, escala) + localPos[0];
  const gY = GEO.mToPx(amb.posY || 0, escala) + localPos[1];
  return [gX, gY];
}

/**
 * Renderiza las conexiones (netlist) entre bocas.
 */
function _renderConexiones(out: string[], ambiente: Ambiente, project: Project | undefined, _segs: any[], escala: number, dx: number, dy: number): void {
  if (!project?.conexiones) return;
  project.conexiones.forEach(con => {
    // Si la conexión involucra a este ambiente
    if (con.from.ambienteId === ambiente.id || con.to.ambienteId === ambiente.id) {
      const p1Global = _getGlobalElementPos(project, con.from.ambienteId, con.from.elementoId, escala);
      const p2Global = _getGlobalElementPos(project, con.to.ambienteId, con.to.elementoId, escala);
      
      if (p1Global && p2Global) {
        const currGX = GEO.mToPx(ambiente.posX || 0, escala);
        const currGY = GEO.mToPx(ambiente.posY || 0, escala);
        
        const p1: Point = [p1Global[0] - currGX + dx, p1Global[1] - currGY + dy];
        const p2: Point = [p2Global[0] - currGX + dx, p2Global[1] - currGY + dy];

        const midX = (p1[0] + p2[0]) / 2;
        const midY = (p1[1] + p2[1]) / 2;
        const dxDir = p2[0] - p1[0];
        const dyDir = p2[1] - p1[1];
        const len = Math.hypot(dxDir, dyDir);
        const nx = len > 0 ? -dyDir / len : 0;
        const ny = len > 0 ? dxDir / len : 0;
        const curveOffset = Math.min(len * 0.15, 20);
        const cx = midX + nx * curveOffset;
        const cy = midY + ny * curveOffset;

        let color = '#3498DB';
        if (con.circuitoId) {
          const circ = project.circuitos?.find(c => c.id === con.circuitoId);
          if (circ && circ.color) color = circ.color;
        }

        out.push(`<path d="M ${f(p1[0])} ${f(p1[1])} Q ${f(cx)} ${f(cy)}, ${f(p2[0])} ${f(p2[1])}" fill="none" stroke="${color}" stroke-width="0.8" stroke-dasharray="2,2" opacity="0.8"/>`);
      }
    }
  });
}

/**
 * Renderiza un símbolo eléctrico individual.
 * Si el elemento tiene pared asignada, calcula automáticamente su posición y rotación.
 */
function _renderElemento(out: string[], el: ElementoElectrico, segs: any[], escala: number, dx: number, dy: number, exportMode: boolean, symbolsLib: DefinicionSimbolo[]): void {
  // Convertimos las posiciones de metros a unidades de dibujo (mm papel)
  const pos = _getElementPos(el, segs, escala, dx, dy);
  const ex = pos[0];
  const ey = pos[1];
  let angRot = 0;

  if (el.paredIdx !== null && el.paredIdx < segs.length) {
    const seg = segs[el.paredIdx];
    angRot = GEO.anguloSimboloPared(seg);
  }

  const k = GEO.mToPx(0.22, escala); // Tamaño base 22cm en metros

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
   * Calcula el layout de la hoja (posiciones dx, dy y dimensiones de página)
   */
  getLayout(ambiente: Ambiente, meta: Meta) {
    const segs = this.buildSegs(ambiente, meta);
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
  },

  /**
   * Calcula elBounding Box total (Legacy, para compatibilidad si se requiere)
   */
  getBboxOffset(ambiente: Ambiente, meta: Meta) {
    const layout = this.getLayout(ambiente, meta);
    return { dx: layout.dx, dy: layout.dy, W: layout.pageW, H: layout.pageH };
  },

  /**
   * FUNCIÓN PRINCIPAL: Genera el string SVG final.
   * @param ambiente Datos del ambiente (paredes, aberturas, elementos).
   * @param meta Metadatos del proyecto (escala, nombre).
   * @param exportMode Si es true, añade etiquetas técnicas (referencias) para impresión.
   * @param project Proyecto completo (para renderizar conexiones).
   */
  render(ambiente: Ambiente, meta: Meta, symbolsLib: DefinicionSimbolo[], exportMode = false, project?: Project): string {
    const segs = this.buildSegs(ambiente, meta);
    const { dx, dy, pageW, pageH, margin } = this.getLayout(ambiente, meta);
    const conf = ambiente.configHoja || { formato: 'A4', orientacion: 'horizontal' };
    
    const out: string[] = [];
    
    if (!segs.length) {
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${pageW}mm" height="${pageH}mm" viewBox="0 0 ${pageW} ${pageH}">
        <rect width="100%" height="100%" fill="white"/>
        <rect x="${margin}" y="${margin}" width="${pageW - 2 * margin}" height="${pageH - 2 * margin}" fill="none" stroke="#ccc" stroke-width="0.5"/>
      </svg>`;
    }

    const cerrado = GEO.esCerrado(segs);

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
    if (ambiente.mostrar_cotas) _renderCotas(out, ambiente, segs, meta.escala, dx, dy);

    // 4.5 Conexiones
    if (project) {
      _renderConexiones(out, ambiente, project, segs, meta.escala, dx, dy);
    }

    // 5. Elementos Eléctricos
    ambiente.elementos?.forEach((el: ElementoElectrico) => {
      _renderElemento(out, el, segs, meta.escala, dx, dy, exportMode, symbolsLib);
    });

    // 6. Textos libres
    ambiente.textos?.forEach((t) => {
      out.push(txt([GEO.mToPx(t.x, meta.escala) + dx, GEO.mToPx(t.y, meta.escala) + dy], t.texto, 0, '#333', t.tamano, 'middle'));
    });

    // ─── ELEMENTOS DE HOJA (MARGEN Y RÓTULO) ───
    const layout = (window as any).layoutConfig as LayoutConfig;
    
    // Línea de margen (1cm)
    out.push(`<rect x="${margin}" y="${margin}" width="${pageW - 2 * margin}" height="${pageH - 2 * margin}" fill="none" stroke="black" stroke-width="0.5"/>`);
    
    if (layout?.titleBlock) {
      const { width: rW, height: rH, elements } = layout.titleBlock;
      const rX = pageW - margin - rW;
      const rY = pageH - margin - rH;

      out.push(`<g transform="translate(${rX},${rY})">`);
      elements.forEach(e => {
        if (e.type === 'rect') {
          out.push(`<rect x="${e.x}" y="${e.y}" width="${e.width}" height="${e.height}" fill="${e.fill || 'none'}" stroke="${e.stroke || 'black'}" stroke-width="${e.strokeWidth || 0.5}"/>`);
        } else if (e.type === 'line') {
          out.push(`<line x1="${e.x1}" y1="${e.y1}" x2="${e.x2}" y2="${e.y2}" stroke="${e.stroke || 'black'}" stroke-width="${e.strokeWidth || 0.5}"/>`);
        } else if (e.type === 'text') {
          let content = e.text || '';
          content = content.replace('{PROJECT_NAME}', meta.nombre.toUpperCase())
                          .replace('{AMBIENTE_NAME}', ambiente.nombre.toUpperCase())
                          .replace('{SCALE}', meta.escala.toString())
                          .replace('{FORMAT}', conf.formato)
                          .replace('{ORIENTATION}', conf.orientacion.toUpperCase());
          
          out.push(txt([e.x || 0, e.y || 0], content, 0, e.fill || 'black', e.fontSize || 3, e.anchor || 'start'));
        }
      });
      out.push('</g>');
    }

    // Envolver todo en el tag <svg>
    const widthAttr = exportMode ? `${pageW}mm` : `${pageW}`;
    const heightAttr = exportMode ? `${pageH}mm` : `${pageH}`;
    
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${widthAttr}" height="${heightAttr}" viewBox="0 0 ${pageW} ${pageH}">
      <rect width="100%" height="100%" fill="white"/>
      ${out.join('\n')}
    </svg>`;
  },
  
  /**
   * Renderiza el Plano Maestro: Agrega todos los ambientes del proyecto en una sola vista.
   */
  renderMaster(project: Project, symbolsLib: DefinicionSimbolo[]): string {
    const margin = 20;
    const out: string[] = [];
    const meta = project.meta;
    const escala = meta.escala;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    project.ambientes.forEach((amb: Ambiente) => {
      const segs = this.buildSegs(amb, meta);
      if (!segs.length) return;
      
      const gX = GEO.mToPx(amb.posX || 0, escala);
      const gY = GEO.mToPx(amb.posY || 0, escala);
      
      const pts = segs.map(s => GEO.add(s.inicio, [gX, gY]));
      pts.forEach(p => {
        if (p[0] < minX) minX = p[0];
        if (p[1] < minY) minY = p[1];
        if (p[0] > maxX) maxX = p[0];
        if (p[1] > maxY) maxY = p[1];
      });

      // Dibujar polígono de fondo
      out.push(`<polygon points="${pts.map(p => `${f(p[0])},${f(p[1])}`).join(' ')}" fill="${C.INT_FILL}" stroke="none"/>`);
      
      // Dibujar muros
      const { ext } = GEO.poligonoMuro(segs, GEO.esCerrado(segs));
      const extT = ext.map(p => GEO.add(p as Point, [gX, gY]));
      out.push(`<polygon points="${ptsAttr(extT)}" fill="${C.PARED_FILL}" stroke="black" stroke-width="0.5"/>`);
      
      // Nombre del ambiente
      const [bX1, bY1, bX2, bY2] = GEO.bbox(segs, []);
      const mid: Point = [gX + (bX1+bX2)/2, gY + (bY1+bY2)/2];
      out.push(txt(mid, amb.nombre.toUpperCase(), 0, '#666', 8));

      // Elementos Eléctricos
      amb.elementos?.forEach((el: ElementoElectrico) => {
        _renderElemento(out, el, segs, escala, gX, gY, false, symbolsLib);
      });
    });

    // Conexiones globales
    if (project.conexiones) {
      project.conexiones.forEach(con => {
        const p1Global = _getGlobalElementPos(project, con.from.ambienteId, con.from.elementoId, escala);
        const p2Global = _getGlobalElementPos(project, con.to.ambienteId, con.to.elementoId, escala);
        if (p1Global && p2Global) {
          const midX = (p1Global[0] + p2Global[0]) / 2;
          const midY = (p1Global[1] + p2Global[1]) / 2;
          const dxDir = p2Global[0] - p1Global[0];
          const dyDir = p2Global[1] - p1Global[1];
          const len = Math.hypot(dxDir, dyDir);
          const nx = len > 0 ? -dyDir / len : 0;
          const ny = len > 0 ? dxDir / len : 0;
          const curveOffset = Math.min(len * 0.15, 20);
          const cx = midX + nx * curveOffset;
          const cy = midY + ny * curveOffset;

          let color = '#3498DB';
          if (con.circuitoId) {
            const circ = project.circuitos?.find(c => c.id === con.circuitoId);
            if (circ && circ.color) color = circ.color;
          }
          out.push(`<path d="M ${f(p1Global[0])} ${f(p1Global[1])} Q ${f(cx)} ${f(cy)}, ${f(p2Global[0])} ${f(p2Global[1])}" fill="none" stroke="${color}" stroke-width="0.8" stroke-dasharray="2,2" opacity="0.8"/>`);
        }
      });
    }

    if (minX === Infinity) {
      return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 420 297"><rect width="100%" height="100%" fill="white"/></svg>`;
    }

    const w = maxX - minX + 2 * margin;
    const h = maxY - minY + 2 * margin;
    const vx = minX - margin;
    const vy = minY - margin;

    return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="${f(vx)} ${f(vy)} ${f(w)} ${f(h)}">
      <rect x="${f(vx)}" y="${f(vy)}" width="${f(w)}" height="${f(h)}" fill="white"/>
      ${out.join('\n')}
    </svg>`;
  }
};