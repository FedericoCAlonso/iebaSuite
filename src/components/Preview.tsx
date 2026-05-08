// ═══════════════════════════════════════════════════════════════════════════
// MODULE: components/Preview.tsx
// El plano reacciona según la tab activa del editor:
//   - 'electrico'  → insertar símbolo eléctrico (cursor crosshair)
//   - 'aberturas'  → snap a pared más cercana y crear abertura (cursor pointer sobre paredes)
//   - otras tabs   → plano de solo lectura (cursor default)
// ═══════════════════════════════════════════════════════════════════════════

import React, { useRef, useMemo, useCallback } from 'react';
import { useZoomPan } from '../hooks/useZoomPan';

import { RENDERER } from '../lib/renderer';
import * as GEO from '../lib/geometry';

import type { Ambiente } from '../types';
import type { EditorTab } from '../App';

interface PreviewProps {
  ambiente: Ambiente;
  meta: { nombre: string; escala: number; grosor_pared_default: number };
  symbolsLib: import('../lib/symbols').DefinicionSimbolo[];
  activeTab: EditorTab;
  onCanvasClick: (
    rawX: number,
    rawY: number,
    snapSegIdx: number | undefined,
    snapPos: number | undefined,
    clickedElecId: string | undefined
  ) => void;
}

/** Cursor del área del plano según el tab activo */
const CURSOR_BY_TAB: Record<EditorTab, string> = {
  proyecto:   'default',
  paredes:    'default',
  aberturas:  'crosshair',
  electrico:  'crosshair',
};

/** Texto de ayuda en el toolbar según el tab activo */
const HINT_BY_TAB: Record<EditorTab, string> = {
  proyecto:  '— Solo lectura —',
  paredes:   '— Solo lectura —',
  aberturas: 'Tocá una pared para agregar abertura',
  electrico: 'Click: insertar · Alt+Drag: pan · Scroll: zoom',
};

export function Preview({ ambiente, meta, symbolsLib, activeTab, onCanvasClick }: PreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { zoom, pan, resetZoom, zoomIn, zoomOut } = useZoomPan(containerRef);

  /**
   * Genera el string SVG. Memorizado para evitar re-renderizados pesados.
   */
  const svgContent = useMemo(() => {
    if (!ambiente || !meta) return null;
    return RENDERER.render(ambiente, meta, symbolsLib, false);
  }, [ambiente, meta, symbolsLib]);

  /**
   * Maneja el clic en el área del plano.
   * Convierte coordenadas de pantalla → coordenadas del plano técnico
   * y delega al handler unificado de App con toda la info necesaria.
   */
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!ambiente || !meta || !containerRef.current) return;

    // Tabs que no interactúan con el plano
    if (activeTab === 'proyecto' || activeTab === 'paredes') return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();

    // Coordenadas en el espacio del plano (con zoom y pan)
    const rawX = (e.clientX - rect.left - pan.x) / zoom;
    const rawY = (e.clientY - rect.top - pan.y) / zoom;

    const { dx, dy } = RENDERER.getBboxOffset(ambiente, meta);
    const px = rawX - dx;
    const py = rawY - dy;

    // ¿Se hizo click sobre un símbolo eléctrico existente?
    const target = e.target as HTMLElement;
    const elecEl = target.closest('[data-elec-id]');
    const clickedElecId = elecEl?.getAttribute('data-elec-id') ?? undefined;

    // Snap a la pared más cercana (útil tanto para eléctrico como aberturas)
    const segs = RENDERER.buildSegs(ambiente, meta);
    const snap = GEO.snapAPared(px, py, segs);

    onCanvasClick(
      px,
      py,
      snap.segIdx !== -1 ? snap.segIdx : undefined,
      snap.pos,
      clickedElecId
    );
  }, [ambiente, meta, activeTab, pan, zoom, onCanvasClick]);

  /** Información técnica de la geometría actual */
  const status = useMemo(() => {
    if (!ambiente) return null;
    const segs = RENDERER.buildSegs(ambiente, meta);
    return { 
      paredes: segs.length, 
      cerrado: GEO.esCerrado(segs) 
    };
  }, [ambiente, meta]);

  const isInteractive = activeTab === 'electrico' || activeTab === 'aberturas';

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
        
        <span className={`toolbar-help ${isInteractive ? 'active' : ''}`}>
          {HINT_BY_TAB[activeTab]}
        </span>
      </div>

      <div 
        className="preview-area" 
        ref={containerRef} 
        onClick={handleClick}
        style={{ 
          overflow: 'hidden', 
          position: 'relative', 
          cursor: CURSOR_BY_TAB[activeTab]
        }}
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

        {/* Toast Helper */}
        <div className={`toolbar-help ${activeTab !== 'proyecto' && activeTab !== 'paredes' ? 'active' : ''}`}>
          {activeTab === 'electrico' ? '⚡ Tocá el plano para insertar' : 
           activeTab === 'aberturas' ? '🚪 Tocá una pared' : ''}
        </div>

        {/* Controles de Zoom */}
        <div className="zoom-controls" onClick={(e) => e.stopPropagation()}>
          <button className="zoom-btn" onClick={zoomIn} title="Aumentar">+</button>
          <button className="zoom-btn" onClick={zoomOut} title="Reducir">−</button>
          <button className="zoom-btn" onClick={resetZoom} title="Ajustar">↺</button>
        </div>

        <div className="preview-hint">Zoom: {Math.round(zoom * 100)}%</div>
      </div>
    </div>
  );
}