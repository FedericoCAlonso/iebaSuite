// ═══════════════════════════════════════════════════════════════════════════
// MODULE: components/Preview.jsx
// Panel de preview interactivo con zoom/pan y click para símbolos.
// En React: src/components/Preview.tsx
// ═══════════════════════════════════════════════════════════════════════════
import React from 'react';
import { useZoomPan } from '../hooks/useZoomPan';
import { RENDERER } from '../lib/renderer';
import { GEO } from '../lib/geometry';
import type{ Ambiente, ElementoElectrico } from '../types';

interface PreviewProps {
  ambiente: Ambiente;
  meta: { nombre: string; escala: number; grosor_pared_default: number };
  onInsertElemento: (clickData: any) => void;
}

export function Preview({ ambiente, meta, onInsertElemento }: PreviewProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { zoom, pan, resetZoom, zoomIn, zoomOut } = useZoomPan(containerRef);

  const svgContent = React.useMemo(() => {
    if (!ambiente) return null;
    return RENDERER.render(ambiente, meta, false);
  }, [ambiente, meta]);

  const handleClick = React.useCallback((e: React.MouseEvent) => {
    if (!ambiente || !meta) return;
    const container=containerRef.current;
    if (!container) return;
    const rect=container.getBoundingClientRect();
    // coordenadas en espacio del SVG (sin transformación de zoom/pan)
    const rawX=(e.clientX-rect.left-pan.x)/zoom;
    const rawY=(e.clientY-rect.top -pan.y)/zoom;

    // obtener bbox offset para convertir a coordenadas del plano
    const {dx,dy}=RENDERER.getBboxOffset(ambiente,meta);
    const px=rawX-dx, py=rawY-dy;

    // click en elemento existente?
    const elecEl=(e.target as Element).closest('[data-elec-id]');
    if (elecEl) {
      const id=elecEl.getAttribute('data-elec-id');
      const el=ambiente.elementos?.find((x: ElementoElectrico)=>x.id===id);
      if (el) { onInsertElemento({existing:el}); return; }
    }

    // snap a pared
    const segs=RENDERER.buildSegs(ambiente,meta);
    const snap=GEO.snapAPared(px,py,segs);
    onInsertElemento({ x:px, y:py, snapSegIdx:snap.segIdx, snapPos:snap.pos, snapDist:snap.dist });
  }, [ambiente, meta, pan, zoom, onInsertElemento]);

  const status = React.useMemo(()=>{
    if (!ambiente) return null;
    const segs=RENDERER.buildSegs(ambiente,meta);
    return { paredes:segs.length, cerrado:GEO.esCerrado(segs) };
  },[ambiente,meta]);

  return (
    <div className="panel-right">
      <div className="preview-toolbar">
        <span style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--text3)'}}>PREVIEW · {ambiente?.nombre||'—'}</span>
        <span style={{flex:1}}/>
        {status && (
          <>
            <span className="status-ok" style={{fontFamily:'var(--mono)',fontSize:10}}>{status.paredes}p</span>
            <span className={status.cerrado?'status-ok':'status-warn'} style={{fontFamily:'var(--mono)',fontSize:10}}>
              {status.cerrado?'✓cerrado':'⚠abierto'}
            </span>
          </>
        )}
        <span style={{fontFamily:'var(--mono)',fontSize:9,color:'var(--text3)'}}>
          click=símbolo · alt+drag=pan · scroll=zoom
        </span>
      </div>
      <div className="preview-area" ref={containerRef} onClick={handleClick}>
        {svgContent ? (
          <div
            style={{transform:`translate(${pan.x}px,${pan.y}px) scale(${zoom})`, transformOrigin:'0 0', position:'absolute'}}
            dangerouslySetInnerHTML={{__html:svgContent}}
          />
        ) : (
          <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
            <div className="empty">Seleccioná un proyecto<br/>y configurá las paredes</div>
          </div>
        )}
        <div className="zoom-controls">
          <button className="zoom-btn" onClick={zoomIn} title="Zoom +">+</button>
          <button className="zoom-btn" onClick={zoomOut} title="Zoom −">−</button>
          <button className="zoom-btn" onClick={resetZoom} title="Reset zoom" style={{fontSize:11}}>↺</button>
        </div>
        <div className="preview-hint">Zoom: {Math.round(zoom*100)}%</div>
      </div>
    </div>
  );
}
