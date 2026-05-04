// ═══════════════════════════════════════════════════════════════════════════
// MODULE: renderer.js
// Genera el string SVG a partir de un ambiente.
// En React: src/lib/renderer.ts
// ═══════════════════════════════════════════════════════════════════════════
import {GEO} from './geometry';

export const RENDERER = (() => {
  const C = {
    PARED_FILL:'#D0D0D0', EXT:'#111111', INT:'#444444',
    EXT_W:1.2, INT_W:0.4, INT_FILL:'#F8F8F0',
    COTA:'#1040A0', VENTANA:'#3366AA', PUERTA:'#222222',
    ELEC:'#CC0000', MARGEN:80,
    COTA_OFF:0.50, COTA_ARR:0.12, COTA_MAR:0.08,
  };

  const ptsAttr = pts => pts.map(p=>`${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ');
  const f       = n   => n.toFixed(2);
  const line    = (a,b,color,w,dash='') =>
    `<line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}" stroke="${color}" stroke-width="${w}"${dash?` stroke-dasharray="${dash}"`:''}/>`; 
  const txt = (pos,text,ang,color,size,anchor='middle') =>
    `<text x="${f(pos[0])}" y="${f(pos[1])}" font-family="Arial,sans-serif" font-size="${size}" fill="${color}" text-anchor="${anchor}" dominant-baseline="middle" transform="rotate(${ang.toFixed(1)},${f(pos[0])},${f(pos[1])})">${text}</text>`;

  // ── Símbolo eléctrico inline (sin <use>) ──
  function symbolPath(tipo, k) {
    const c=C.ELEC, sw=0.9;
    switch(tipo) {
      case 'sym-boca-techo': {
        const r=k*0.48;
        return `<circle cx="0" cy="0" r="${f(r)}" fill="${c}"/>`;
      }
      case 'sym-tierra': {
        // IEC: tres líneas horizontales decrecientes
        const w1=k*0.9, w2=k*0.6, w3=k*0.3, sp=k*0.28;
        return [
          `<line x1="${f(-w1/2)}" y1="${f(-sp)}"  x2="${f(w1/2)}" y2="${f(-sp)}"  stroke="${c}" stroke-width="${sw}"/>`,
          `<line x1="${f(-w2/2)}" y1="0"           x2="${f(w2/2)}" y2="0"          stroke="${c}" stroke-width="${sw}"/>`,
          `<line x1="${f(-w3/2)}" y1="${f(sp)}"    x2="${f(w3/2)}" y2="${f(sp)}"   stroke="${c}" stroke-width="${sw}"/>`,
          `<line x1="0" y1="${f(-sp*1.8)}" x2="0" y2="${f(-sp)}" stroke="${c}" stroke-width="${sw}"/>`,
        ].join('');
      }
      case 'sym-toma': {
        // Omega: semicírculo + dos patitas + rayita central
        const r=k*0.45, pw=r*0.5;
        return [
          `<path d="M${f(-r)},0 A${f(r)},${f(r)} 0 0,1 ${f(r)},0" fill="none" stroke="${c}" stroke-width="${sw}"/>`,
          `<line x1="${f(-r)}" y1="0" x2="${f(-r)}" y2="${f(r*1.2)}" stroke="${c}" stroke-width="${sw}"/>`,
          `<line x1="${f(r)}"  y1="0" x2="${f(r)}"  y2="${f(r*1.2)}" stroke="${c}" stroke-width="${sw}"/>`,
          `<line x1="${f(-pw/2)}" y1="${f(-r*0.2)}" x2="${f(pw/2)}" y2="${f(-r*0.2)}" stroke="${c}" stroke-width="${sw}"/>`,
        ].join('');
      }
      case 'sym-boca-pared': {
        // Círculo relleno + T invertida (base)
        const r=k*0.38, bw=k*0.5, bh=k*0.28;
        return [
          `<circle cx="0" cy="0" r="${f(r)}" fill="${c}"/>`,
          `<line x1="0" y1="${f(r)}" x2="0" y2="${f(r+bh)}" stroke="${c}" stroke-width="${sw*1.2}"/>`,
          `<line x1="${f(-bw/2)}" y1="${f(r+bh)}" x2="${f(bw/2)}" y2="${f(r+bh)}" stroke="${c}" stroke-width="${sw*1.2}"/>`,
        ].join('');
      }
      case 'sym-ts': {
        const w=k*0.55, h=k*1.6;
        return [
          `<rect x="${f(-w/2)}" y="${f(-h/2)}" width="${f(w)}" height="${f(h)}" fill="none" stroke="${c}" stroke-width="${sw}"/>`,
          `<line x1="${f(-w/2)}" y1="${f(h/2)}" x2="${f(w/2)}" y2="${f(-h/2)}" stroke="${c}" stroke-width="${sw}"/>`,
        ].join('');
      }
      case 'sym-tp': {
        const w=k*0.55, h=k*1.6;
        return [
          `<rect x="${f(-w/2)}" y="${f(-h/2)}" width="${f(w)}" height="${f(h)}" fill="none" stroke="${c}" stroke-width="${sw}"/>`,
          `<line x1="${f(-w/2)}" y1="${f(-h/2)}" x2="${f(w/2)}" y2="${f(h/2)}"  stroke="${c}" stroke-width="${sw}"/>`,
          `<line x1="${f(-w/2)}" y1="${f(h/2)}"  x2="${f(w/2)}" y2="${f(-h/2)}" stroke="${c}" stroke-width="${sw}"/>`,
        ].join('');
      }
      case 'sym-llave-1':
      case 'sym-llave-2':
      case 'sym-llave-comb': {
        const r=k*0.3, lp=k*1.4, lc=k*0.26;
        const palanca = (ox=0) => [
          `<line x1="${f(ox+r*0.7)}" y1="${f(-r*0.7)}" x2="${f(ox+lp*0.7)}" y2="${f(-lp*0.7)}" stroke="${c}" stroke-width="${sw}"/>`,
          `<line x1="${f(ox+lp*0.7)}" y1="${f(-lp*0.7)}" x2="${f(ox+lp*0.7+lc*0.7)}" y2="${f(-lp*0.7+lc*0.7)}" stroke="${c}" stroke-width="${sw}"/>`,
        ].join('');
        const base = `<circle cx="0" cy="0" r="${f(r)}" fill="none" stroke="${c}" stroke-width="${sw}"/>`;
        if (tipo==='sym-llave-1') return base+palanca();
        if (tipo==='sym-llave-2') return base+palanca(-k*0.18)+palanca(k*0.18);
        // combinación: palanca normal + flecha invertida
        return base+palanca()+
          `<line x1="${f(-r*0.7)}" y1="${f(r*0.7)}" x2="${f(-lp*0.7)}" y2="${f(lp*0.7)}" stroke="${c}" stroke-width="${sw}"/>` +
          `<line x1="${f(-lp*0.7)}" y1="${f(lp*0.7)}" x2="${f(-lp*0.7+lc*0.7)}" y2="${f(lp*0.7-lc*0.7)}" stroke="${c}" stroke-width="${sw}"/>`;
      }
      default: return `<circle cx="0" cy="0" r="${f(k*0.4)}" fill="none" stroke="${c}" stroke-width="0.8"/>`;
    }
  }

  // ── Renderer principal ──
  function render(ambiente, meta, exportMode=false) {
    const escala  = meta.escala||50;
    const grosorD = meta.grosor_pared_default||0.15;
    const sentido = ambiente.sentido==='horario' ? 1 : -1;
    const paredes = (ambiente.paredes||[]).map(p=>({
      ...p, grosor: (p.grosor!=null&&p.grosor!=='') ? parseFloat(p.grosor) : grosorD
    }));

    if (paredes.length<1) return _svgVacio(300,200,'Sin paredes definidas');

    const segs=GEO.construirEjes(paredes,escala,sentido);
    if (!segs.length) return _svgVacio(300,200,'Sin segmentos');
    GEO.calcularVectores(segs);
    const cerrado=GEO.esCerrado(segs);

    // puntos de cotas para bbox
    const cotaPts=[];
    if (ambiente.mostrar_cotas!==false) {
      const offPx=GEO.mToPx(C.COTA_OFF,escala);
      for (const s of segs) {
        cotaPts.push(GEO.add(s.inicio,GEO.scale(s.v_ext,s.gPx+offPx)));
        cotaPts.push(GEO.add(s.fin,   GEO.scale(s.v_ext,s.gPx+offPx)));
      }
    }

    const [xMin,yMin,xMax,yMax]=GEO.bbox(segs,cotaPts);
    const dx=-xMin+C.MARGEN, dy=-yMin+C.MARGEN;
    const W=(xMax-xMin)+2*C.MARGEN, H=(yMax-yMin)+2*C.MARGEN+28;

    const out=[];

    // fondo interior
    const ptsFondo=segs.map(s=>GEO.add(s.inicio,[dx,dy]));
    out.push(`<polygon points="${ptsAttr(ptsFondo)}" fill="${C.INT_FILL}" stroke="none"/>`);

    // muros
    const {ext,int}=GEO.poligonoMuro(segs,cerrado);
    const extT=ext.map(p=>GEO.add(p,[dx,dy]));
    const intT=int.map(p=>GEO.add(p,[dx,dy]));
    out.push(`<polygon points="${ptsAttr([...extT,...([...intT].reverse())])}" fill="${C.PARED_FILL}" stroke="none"/>`);
    for (let i=0;i<extT.length;i++) out.push(line(extT[i],extT[(i+1)%extT.length],C.EXT,C.EXT_W));
    for (let i=0;i<intT.length;i++) out.push(line(intT[i],intT[(i+1)%intT.length],C.INT,C.INT_W));

    // irregularidades
    for (const seg of segs) {
      for (const irr of (seg.pared.irregularidades||[])) {
        _renderIrregularidad(out, seg, irr, escala, dx, dy);
      }
    }

    // esquinas salientes
    for (let i=0;i<segs.length;i++) {
      if (!segs[i].pared.esquina_saliente) continue;
      if (!cerrado && i===segs.length-1) continue;
      const sb=segs[(i+1)%segs.length];
      const aPx=GEO.mToPx(segs[i].pared.esquina_saliente.ancho,escala);
      const c=segs[i].fin;
      const pts=[c,
        GEO.add(c,GEO.scale(segs[i].v_int,aPx)),
        GEO.add(GEO.add(c,GEO.scale(segs[i].v_int,aPx)),GEO.scale(sb.v_int,aPx)),
        GEO.add(c,GEO.scale(sb.v_int,aPx))
      ].map(p=>GEO.add(p,[dx,dy]));
      out.push(`<polygon points="${ptsAttr(pts)}" fill="${C.PARED_FILL}" stroke="${C.EXT}" stroke-width="${C.EXT_W}"/>`);
    }

    // aberturas
    for (const ab of (ambiente.aberturas||[])) {
      _renderAbertura(out, ab, segs, escala, dx, dy);
    }

    // cotas
    if (ambiente.mostrar_cotas!==false) {
      _renderCotas(out, segs, escala, dx, dy);
    }

    // elementos eléctricos
    const elecSize=GEO.mToPx(0.22,escala);
    for (const el of (ambiente.elementos||[])) {
      _renderElemento(out, el, segs, elecSize, dx, dy, exportMode);
    }

    // título
    const titleTxt=`${meta.nombre||''} — ${ambiente.nombre||''} — 1:${escala}`;
    out.push(`<text x="${f(W/2)}" y="${f(H-10)}" font-family="Arial,sans-serif" font-size="11" font-weight="bold" fill="#333" text-anchor="middle">${titleTxt}</text>`);

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${f(W)}" height="${f(H)}" viewBox="0 0 ${f(W)} ${f(H)}">\n<rect width="100%" height="100%" fill="white"/>\n${out.join('\n')}\n</svg>`;
  }

  function _svgVacio(w,h,msg) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="#F8F8F0"/><text x="${w/2}" y="${h/2}" font-family="monospace" font-size="12" fill="#aaa" text-anchor="middle">${msg}</text></svg>`;
  }

  function _renderIrregularidad(out,seg,irr,escala,dx,dy) {
    const posPx=GEO.mToPx(irr.posicion,escala), aPx=GEO.mToPx(irr.ancho,escala), pPx=GEO.mToPx(Math.abs(irr.profundidad),escala);
    const bI=GEO.add(seg.inicio,GEO.scale(seg.dir,posPx)), bF=GEO.add(bI,GEO.scale(seg.dir,aPx));
    const eI=GEO.add(bI,GEO.scale(seg.v_ext,seg.gPx)), eF=GEO.add(bF,GEO.scale(seg.v_ext,seg.gPx));
    let pts;
    if (irr.profundidad>0) pts=[eI,eF,GEO.add(eF,GEO.scale(seg.v_ext,pPx)),GEO.add(eI,GEO.scale(seg.v_ext,pPx))];
    else { const off=seg.gPx-pPx; pts=[GEO.add(bI,GEO.scale(seg.v_ext,off)),GEO.add(bF,GEO.scale(seg.v_ext,off)),eF,eI]; }
    const ptsT=pts.map(p=>GEO.add(p,[dx,dy]));
    out.push(`<polygon points="${ptsAttr(ptsT)}" fill="${C.PARED_FILL}" stroke="${C.EXT}" stroke-width="${C.EXT_W}"/>`);
  }

  function _renderAbertura(out,ab,segs,escala,dx,dy) {
    const si=parseInt(ab.pared);
    if (si<0||si>=segs.length) return;
    const seg=segs[si];
    const posPx=GEO.mToPx(ab.posicion||0,escala), aPx=GEO.mToPx(ab.ancho||0.9,escala);
    const bI=GEO.add(seg.inicio,GEO.scale(seg.dir,posPx)), bF=GEO.add(bI,GEO.scale(seg.dir,aPx));
    const eI=GEO.add(bI,GEO.scale(seg.v_ext,seg.gPx)), eF=GEO.add(bF,GEO.scale(seg.v_ext,seg.gPx));
    const [bIT,bFT,eIT,eFT]=[bI,bF,eI,eF].map(p=>GEO.add(p,[dx,dy]));
    out.push(`<polygon points="${ptsAttr([bIT,bFT,eFT,eIT])}" fill="white" stroke="none"/>`);
    if (ab.tipo==='vano') {
      out.push(line(bIT,eIT,C.EXT,C.EXT_W*2)); out.push(line(bFT,eFT,C.EXT,C.EXT_W*2));
    } else if (ab.tipo==='ventana') {
      const lerp=(a,b,t)=>GEO.add(a,GEO.scale(GEO.sub(b,a),t));
      out.push(line(bIT,bFT,C.EXT,C.EXT_W*1.5)); out.push(line(eIT,eFT,C.EXT,C.EXT_W*1.5));
      for (const t of [1/3,2/3]) out.push(line(GEO.add(lerp(bI,eI,t),[dx,dy]),GEO.add(lerp(bF,eF,t),[dx,dy]),C.VENTANA,1.2));
    } else if (ab.tipo==='puerta') {
      out.push(line(bIT,eIT,C.PUERTA,1.4)); out.push(line(bFT,eFT,C.PUERTA,1.4));
      const vOpen=ab.lado==='interior'?seg.v_int:seg.v_ext;
      const hojas=ab.hojas||1, aH=aPx/hojas;
      const drawHoja=(gozne,extremo,hA)=>{
        const pAb=GEO.add(gozne,GEO.scale(vOpen,hA));
        const [gT,pAbT]=[gozne,pAb].map(p=>GEO.add(p,[dx,dy]));
        out.push(line(gT,pAbT,C.PUERTA,1.0));
        const angC=Math.atan2(extremo[1]-gozne[1],extremo[0]-gozne[0])*180/Math.PI;
        const angA=Math.atan2(vOpen[1],vOpen[0])*180/Math.PI;
        const r=hA; const a0=angC*Math.PI/180, a1=angA*Math.PI/180;
        const x0=gT[0]+r*Math.cos(a0),y0=gT[1]+r*Math.sin(a0);
        const x1=gT[0]+r*Math.cos(a1),y1=gT[1]+r*Math.sin(a1);
        const diff=((angA-angC)%360+360)%360;
        out.push(`<path d="M${f(x0)},${f(y0)} A${f(r)},${f(r)} 0 0,${diff<180?1:0} ${f(x1)},${f(y1)}" fill="none" stroke="${C.PUERTA}" stroke-width="0.7"/>`);
      };
      if (hojas===1) {
        const [g,e]=ab.sentido==='derecha'
          ?(ab.lado==='interior'?[bI,bF]:[eI,eF])
          :(ab.lado==='interior'?[bF,bI]:[eF,eI]);
        drawHoja(g,e,aPx);
      } else {
        const g1=ab.lado==='interior'?bI:eI, g2=ab.lado==='interior'?bF:eF;
        const mid=[(g1[0]+g2[0])/2,(g1[1]+g2[1])/2];
        drawHoja(g1,mid,aH); drawHoja(g2,mid,aH);
      }
    }
  }

  function _renderCotas(out,segs,escala,dx,dy) {
    const offPx=GEO.mToPx(C.COTA_OFF,escala), arrPx=GEO.mToPx(C.COTA_ARR,escala), marPx=GEO.mToPx(C.COTA_MAR,escala);
    for (const seg of segs) {
      const dist : number =seg.gPx+offPx;
      const cI : [number, number] =GEO.add(GEO.add(seg.inicio,GEO.scale(seg.v_ext,dist)),[dx,dy]);
      const cF : [number, number] =GEO.add(GEO.add(seg.fin,   GEO.scale(seg.v_ext,dist)),[dx,dy]);
      out.push(line(cI,cF,C.COTA,0.6));
      const dN : [number, number] =GEO.norm(seg.dir), veN : [number, number] =GEO.norm(seg.v_ext);
      const diag : [number, number] =GEO.norm(GEO.add(dN,veN)), diag2 : [number, number] =[-diag[0],-diag[1]];
      for (const pt of [cI,cF]) {
        out.push(line(GEO.add(pt,GEO.scale(diag,arrPx/2)),GEO.add(pt,GEO.scale(diag2,arrPx/2)),C.COTA,0.8));
      }
      const rI=GEO.add(GEO.add(seg.inicio,GEO.scale(seg.v_ext,seg.gPx)),[dx,dy]);
      const rF=GEO.add(GEO.add(seg.fin,   GEO.scale(seg.v_ext,seg.gPx)),[dx,dy]);
      out.push(line(rI,cI,C.COTA,0.35,'3,3')); out.push(line(rF,cF,C.COTA,0.35,'3,3'));
      const mid : [number, number] =[(cI[0]+cF[0])/2,(cI[1]+cF[1])/2];
      let ang : number =Math.atan2(seg.dir[1],seg.dir[0])*180/Math.PI;
      let tPos : [number, number];
      if (ang>90||ang<-90){ang+=180;tPos=GEO.add(mid,GEO.scale(seg.v_ext,-(marPx+6)));}
      else tPos=GEO.add(mid,GEO.scale(seg.v_ext,marPx+5));
      const lm : string =(Math.hypot(seg.fin[0]-seg.inicio[0],seg.fin[1]-seg.inicio[1])*escala/1000).toFixed(2);
      out.push(txt(tPos,`${lm} m`,ang,C.COTA,11));
    }
  }

  function _renderElemento(out,el,segs,k,dx,dy,exportMode) {
    let ex=el.x+dx, ey=el.y+dy, angRot=0;
    // si tiene pared asignada, recalcular posición
    if (el.paredIdx!=null && el.paredIdx<segs.length) {
      const seg=segs[el.paredIdx];
      const xy=GEO.posEnPared(seg,el.paredPos||0);
      ex=xy[0]+dx; ey=xy[1]+dy;
      angRot=GEO.anguloSimboloPared(seg);
    }
    const sym=symbolPath(el.tipo,k);
    out.push(`<g transform="translate(${f(ex)},${f(ey)}) rotate(${f(angRot)})" data-elec-id="${el.id}" style="cursor:pointer">`);
    out.push(sym);
    if (exportMode) {
      if (el.referencia) out.push(`<text x="${f(k*0.7)}" y="${f(-k*0.8)}" font-family="Arial" font-size="9" fill="${C.ELEC}">${el.referencia}</text>`);
      if (el.mostrarDato&&el.datos?.length>0) out.push(`<text x="${f(k*0.7)}" y="${f(k*1.1)}" font-family="Arial" font-size="8" fill="${C.ELEC}">${el.datos[0].valor}</text>`);
    }
    out.push('</g>');
  }

  // Expone segs y escala para uso externo (preview interactivo)
  function buildSegs(ambiente, meta) {
    const escala=meta.escala||50, grosorD=meta.grosor_pared_default||0.15, sentido=ambiente.sentido==='horario'?1:-1;
    const paredes=(ambiente.paredes||[]).map(p=>({...p,grosor:(p.grosor!=null&&p.grosor!=='')?parseFloat(p.grosor):grosorD}));
    const segs=GEO.construirEjes(paredes,escala,sentido);
    GEO.calcularVectores(segs);
    return segs;
  }

  function getBboxOffset(ambiente,meta) {
    const escala=meta.escala||50;
    const segs=buildSegs(ambiente,meta);
    if (!segs.length) return {dx:C.MARGEN,dy:C.MARGEN,W:300,H:200};
    const offPx=GEO.mToPx(C.COTA_OFF,escala);
    const cotaPts=segs.flatMap(s=>[GEO.add(s.inicio,GEO.scale(s.v_ext,s.gPx+offPx)),GEO.add(s.fin,GEO.scale(s.v_ext,s.gPx+offPx))]);
    const [xMin,yMin,xMax,yMax]=GEO.bbox(segs,cotaPts);
    return { dx:-xMin+C.MARGEN, dy:-yMin+C.MARGEN, W:(xMax-xMin)+2*C.MARGEN, H:(yMax-yMin)+2*C.MARGEN+28 };
  }

  return { render, buildSegs, getBboxOffset, symbolPath };
})();