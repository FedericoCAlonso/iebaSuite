// ═══════════════════════════════════════════════════════════════════════════
// MODULE: geometry.js
// Motor geométrico. Port 1:1 del Python.
// En React: src/lib/geometry.ts
// ═══════════════════════════════════════════════════════════════════════════

export const GEO = (() => {
  const mToPx    = (m: number, esc: number) => m * 1000.0 / esc;
  const rot      = ([x,y]: [number,number], deg: number): [number,number] => { const r=deg*Math.PI/180; return [x*Math.cos(r)-y*Math.sin(r), x*Math.sin(r)+y*Math.cos(r)]; };
  const add      = ([ax,ay]: [number,number], [bx,by]: [number,number]): [number,number] => [ax+bx, ay+by];
  const sub      = ([ax,ay]: [number,number], [bx,by]: [number,number]): [number,number] => [ax-bx, ay-by];
  const scale    = ([x,y]: [number,number], s: number): [number,number] => [x*s, y*s];
  const norm     = ([x,y]: [number,number]): [number,number] => { const l=Math.hypot(x,y); return l>1e-10?[x/l,y/l]:[0,0]; };
  const perpIzq  = ([x,y]: [number,number]): [number,number] => [-y, x];
  const dot      = ([ax,ay]: [number,number], [bx,by]: [number,number]): number => ax*bx+ay*by;
  const len      = ([x,y]: [number,number]): number => Math.hypot(x,y);

  const lineIntersect = ([p1x,p1y],[d1x,d1y],[p2x,p2y],[d2x,d2y]) => {
    const cross = d1x*d2y - d1y*d2x;
    if (Math.abs(cross)<1e-10) return null;
    const t = ((p2x-p1x)*d2y-(p2y-p1y)*d2x)/cross;
    return [p1x+d1x*t, p1y+d1y*t];
  };

  const ingleteLimitado = (pBase, pCand, g, limit=4.0) => {
    if (!pCand) return pBase;
    return Math.hypot(pCand[0]-pBase[0],pCand[1]-pBase[1]) > limit*g ? pBase : pCand;
  };

  // Construye segmentos desde array de paredes
  function construirEjes(paredes, escala, sentido) {
    const segs = [];
    let pos: [number, number] = [0,0], dir: [number, number] = [1,0];
    const n = paredes.length;
    for (let i=0; i<n; i++) {
      const p = paredes[i];
      const g = (p.grosor != null && p.grosor !== '') ? parseFloat(p.grosor) : 0.15;
      const gPx = mToPx(g, escala);
      if (i>0) dir  = rot(dir, sentido*(parseFloat(p.angulo)||0)) as [number, number];
      if (p.largo==='auto' || p.largo===null || p.largo==='') {
        if (i!==n-1) continue;
        const cierre : [number, number] =[-pos[0],-pos[1]], dist=len(cierre);
        if (dist<1e-6) continue;
        const dirA=norm(cierre);
        segs.push({ inicio:pos, fin:[0,0], dir:dirA, gPx, pared:p, v_ext:[0,0], v_int:[0,0] });
        pos=[0,0]; continue;
      }
      const lPx = mToPx(parseFloat(p.largo)||0, escala);
      const fin = add(pos, scale(dir,lPx));
      segs.push({ inicio:pos, fin, dir, gPx, pared:p, v_ext:[0,0], v_int:[0,0] });
      pos=fin;
    }
    return segs;
  }

  // Asigna v_ext / v_int usando área signada
    function calcularVectores(segs) {
    let area = 0;
    for (const s of segs) area += s.inicio[0]*s.fin[1] - s.fin[0]*s.inicio[1];
      const cw = area >= 0;
    for (const s of segs) {
      const p = perpIzq(s.dir);
      if (cw) { s.v_int = p; s.v_ext = [-p[0], -p[1]]; }
      else    { s.v_ext = p; s.v_int = [-p[0], -p[1]]; }
    }
  } 
  function esCerrado(segs) {
    if (segs.length<3) return false;
    const [ix,iy]=segs[0].inicio, [fx,fy]=segs[segs.length-1].fin;
    return Math.hypot(fx-ix,fy-iy)<1.0;
  }

  function puntoCara(segRef, segVec, lado, esFin) {
    const g=segRef.gPx;
    const offset : [number, number] = lado==='ext' ? scale(segRef.v_ext,g) : [0,0];
    const basePt = esFin ? segRef.fin : segRef.inicio;
    if (!segVec) return add(basePt,offset);
    const offV : [number, number] = lado==='ext' ? scale(segVec.v_ext,segVec.gPx) : [0,0];
    const cand = lineIntersect(add(segRef.inicio,offset),segRef.dir, add(segVec.inicio,offV),segVec.dir);
    return ingleteLimitado(add(basePt,offset), cand, g);
  }

  function poligonoMuro(segs, cerrado) {
    const n=segs.length, ext=[], int=[];
    for (let i=0; i<n; i++) {
      const ant = (i>0||cerrado) ? segs[i>0?i-1:n-1] : null;
      const sig = (i<n-1||cerrado) ? segs[(i+1)%n] : null;
      const iE=puntoCara(segs[i],ant,'ext',false), fE=puntoCara(segs[i],sig,'ext',true);
      const iI=puntoCara(segs[i],ant,'int',false), fI=puntoCara(segs[i],sig,'int',true);
      if (i===0){ext.push(iE);int.push(iI);}
      ext.push(fE); int.push(fI);
    }
    return { ext, int };
  }

  function bbox(segs, extra=[]) {
    const pts=[];
    for (const s of segs) {
      pts.push(s.inicio,s.fin,add(s.inicio,scale(s.v_ext,s.gPx)),add(s.fin,scale(s.v_ext,s.gPx)));
    }
    pts.push(...extra);
    if (!pts.length) return [0,0,200,200];
    const xs=pts.map(p=>p[0]), ys=pts.map(p=>p[1]);
    return [Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)];
  }

  // Dado un click en (cx,cy), encuentra la pared más cercana y la posición sobre ella
  function snapAPared(cx, cy, segs) {
    let best=null, bestDist=Infinity, bestPos=0, bestSeg=null, bestIdx=-1;
    for (let i=0; i<segs.length; i++) {
      const s=segs[i];
      const v=sub(s.fin,s.inicio);
      const vLen=len(v);
      if (vLen<1e-6) continue;
      const vN=scale(v,1/vLen);
      const w=sub([cx,cy],s.inicio);
      let t=dot(w,vN);
      t=Math.max(0,Math.min(vLen,t));
      const proj=add(s.inicio,scale(vN,t));
      const dist=Math.hypot(cx-proj[0],cy-proj[1]);
      if (dist<bestDist) { bestDist=dist; bestPos=t; bestSeg=s; bestIdx=i; }
    }
    return { segIdx:bestIdx, seg:bestSeg, pos:bestPos, dist:bestDist };
  }

  // Posición xy de un elemento de pared dado segmento y pos (px a lo largo)
  function posEnPared(seg, pos) {
    const v=norm(sub(seg.fin,seg.inicio));
    const base=add(seg.inicio,scale(v,pos));
    // desplazar al centro de la pared (cara interior)
    return add(base, scale(seg.v_ext, seg.gPx*0.5));
  }

  // Ángulo de rotación del símbolo según la normal interior de la pared
  // Convención: sin rotación = normal apuntando hacia arriba (0,-1) en SVG
  function anguloSimboloPared(seg) {
    const nx=seg.v_int[0], ny=seg.v_int[1];
    // atan2 respecto a "arriba" (0,-1)
    return Math.atan2(nx, -ny) * 180 / Math.PI;
  }

  return {
    mToPx, rot, add, sub, scale, norm, perpIzq, len, dot,
    construirEjes, calcularVectores, esCerrado,
    poligonoMuro, puntoCara, bbox, snapAPared, posEnPared, anguloSimboloPared,
  };
})();