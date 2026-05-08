// ═══════════════════════════════════════════════════════════════════════════
// MODULE: components/Preview.tsx
// ═══════════════════════════════════════════════════════════════════════════

import React, { useRef, useMemo, useCallback } from 'react';
import { useZoomPan } from '../hooks/useZoomPan';

// Motores refactorizados
import {RENDERER } from '../lib/renderer';
import * as GEO from '../lib/geometry';

// Tipos
import type { Ambiente, ElementoElectrico } from '../types';
import type { SymbolDialogData } from '../App';

interface PreviewProps {
  ambiente: Ambiente;
  meta: { nombre: string; escala: number; grosor_pared_default: number };
  onInsertElemento: (clickData: SymbolDialogData) => void;
}

export function Preview({ ambiente, meta, onInsertElemento }: PreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { zoom, pan, resetZoom, zoomIn, zoomOut } = useZoomPan(containerRef);

  /**
   * Genera el string SVG. 
   * Se memoriza para evitar re-renderizados pesados si no cambian los datos.
   */
  const svgContent = useMemo(() => {
    if (!ambiente || !meta) return null;
    return RENDERER.render(ambiente, meta, false);
  }, [ambiente, meta]);

  /**
   * Maneja el clic en el área del plano.
   * Convierte coordenadas de pantalla a coordenadas del plano técnico.
   */
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!ambiente || !meta || !containerRef.current) return;
    
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    
    // 1. Coordenadas relativas al contenedor SVG (considerando zoom y pan)
    const rawX = (e.clientX - rect.left - pan.x) / zoom;
    const rawY = (e.clientY - rect.top - pan.y) / zoom;

    const { dx, dy } = RENDERER.getBboxOffset(ambiente, meta);

    // 2. Ajustar por el offset del Bounding Box (dx, dy) que usa el     const { dx, dy } = getBboxOffset(ambiente, meta);
    const px = rawX - dx;
    const py = rawY - dy;

    // 3. ¿Click en un símbolo existente? (Delegamos al modo 'edit')
    const target = e.target as HTMLElement;
    const elecEl = target.closest('[data-elec-id]');
    
    if (elecEl) {
      const id = elecEl.getAttribute('data-elec-id');
      const el = ambiente.elementos?.find((x: ElementoElectrico) => x.id === id);
      if (el) {
        onInsertElemento({ mode: 'edit', existing: el });
        return;
      }
    }

    // 4. Modo creación: Calcular snap a la pared más cercana
    const segs = RENDERER.buildSegs(ambiente, meta);
    const snap = GEO.snapAPared(px, py, segs);

    // Notificamos al App para que abra el SymbolDialog con los datos de inserción
    onInsertElemento({ 
      mode: 'create',
      x: px, 
      y: py, 
      snapSegIdx: snap.segIdx !== -1 ? snap.segIdx : undefined, 
      snapPos: snap.pos 
    });

  }, [ambiente, meta, pan, zoom, onInsertElemento]);

  /** Informacion técnica de la geometría actual */
  const status = useMemo(() => {
    if (!ambiente) return null;
    const segs = RENDERER.buildSegs(ambiente, meta);
    return { 
      paredes: segs.length, 
      cerrado: GEO.esCerrado(segs) 
    };
  }, [ambiente, meta]);

  return (
    <div className="panel-right">
      <div className="preview-toolbar">
        <span className="toolbar-label">
          VISTA PREVIA · {ambiente?.nombre || '—'}
        </span>
        <div className="toolbar-spacer" />
        
        {status && (
          <div className="status-group">
            <span className="status-tag">{status.paredes} paredes</span>
            <span className={`status-tag ${status.cerrado ? 'ok' : 'warn'}`}>
              {status.cerrado ? '✓ Perímetro Cerrado' : '⚠ Perímetro Abierto'}
            </span>
          </div>
        )}
        
        <span className="toolbar-help">
          Click: insertar · Alt+Drag: pan · Scroll: zoom
        </span>
      </div>

      <div 
        className="preview-area" 
        ref={containerRef} 
        onClick={handleClick}
        style={{ overflow: 'hidden', position: 'relative', cursor: 'crosshair' }}
      >
        {svgContent ? (
          <div
            className="svg-container"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
              position: 'absolute'
            }}
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        ) : (
          <div className="empty-overlay">
            <div className="empty-msg">
              Seleccioná un proyecto<br/>
              para visualizar el croquis
            </div>
          </div>
        )}

        {/* Controles de Zoom Flotantes */}
        <div className="zoom-controls">
          <button className="zoom-btn" onClick={zoomIn} title="Aumentar">+</button>
          <button className="zoom-btn" onClick={zoomOut} title="Reducir">−</button>
          <button className="zoom-btn" onClick={resetZoom} title="Ajustar">↺</button>
        </div>

        <div className="preview-hint">Zoom: {Math.round(zoom * 100)}%</div>
      </div>
    </div>
  );
}