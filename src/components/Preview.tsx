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

import type { Ambiente, Project, Meta, EditorTab } from '../types/index';
import type { DefinicionSimbolo } from '../lib/symbols';

interface PreviewProps {
  project: Project;
  ambiente: Ambiente;
  meta: Meta;
  activeTab: EditorTab;
  symbolsLib: DefinicionSimbolo[];
  onCanvasClick: (rawX: number, rawY: number, snapIdx?: number, snapPos?: number, clickedId?: string) => void;
  creationFlow?: { active: boolean; step: string; anchor: any; offsetX: number; offsetY: number };
}

/** Cursor del área del plano según el tab activo */
const CURSOR_BY_TAB: Record<EditorTab, string> = {
  proyecto:   'default',
  paredes:    'default',
  aberturas:  'crosshair',
  electrico:  'crosshair',
  circuitos:  'default',
  conexiones: 'default',
  maestro:    'default',
  cobertura:  'default',
};

/** Texto de ayuda en el toolbar según el tab activo */
const HINT_BY_TAB: Record<EditorTab, string> = {
  proyecto:  '— Solo lectura —',
  paredes:   '— Solo lectura —',
  aberturas: 'Tocá una pared para agregar abertura',
  electrico: 'Click: insertar · Alt+Drag: pan · Scroll: zoom',
  circuitos: '— Solo lectura —',
  conexiones:'— Solo lectura —',
  maestro:   '— Plano Maestro —',
  cobertura: '— Solo lectura —',
};

export function Preview({ project, ambiente, meta, symbolsLib, activeTab, onCanvasClick, creationFlow }: PreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { zoom, pan, resetZoom, zoomIn, zoomOut } = useZoomPan(containerRef);

  /**
   * Genera el string SVG. Memorizado para evitar re-renderizados pesados.
   */
  const svgContent = useMemo(() => {
    try {
      if (!ambiente || !meta) return '';
      if (activeTab === 'maestro') {
        return RENDERER.renderMaster(project, symbolsLib);
      }
      return RENDERER.render(ambiente, meta, symbolsLib, false, project);
    } catch (err) {
      console.error("Error en el renderizado SVG:", err);
      return '__ERROR__';
    }
  }, [ambiente, meta, symbolsLib, activeTab, project]);

  if (svgContent === '__ERROR__') {
    return (
      <div className="preview-area" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--red)', background: '#fff' }}>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <strong>⚠️ Error en el motor de dibujo</strong><br/>
          <small>Los datos de geometría contienen valores inválidos.</small>
        </div>
      </div>
    );
  }

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

    // Convertimos de unidades de dibujo (mm papel) a metros reales
    const pxM = GEO.pxToM(px, meta.escala);
    const pyM = GEO.pxToM(py, meta.escala);

    // ¿Se hizo click sobre un símbolo eléctrico existente?
    const target = e.target as HTMLElement;
    const elecEl = target.closest('[data-elec-id]');
    const clickedElecId = elecEl?.getAttribute('data-elec-id') ?? undefined;

    // Snap a la pared más cercana (útil tanto para eléctrico como aberturas)
    const { allSegs: segs } = RENDERER.buildSegs(ambiente, meta);
    const snap = GEO.snapAPared(px, py, segs);

    onCanvasClick(
      pxM,
      pyM,
      snap.segIdx !== -1 ? snap.segIdx : undefined,
      GEO.pxToM(snap.pos, meta.escala),
      clickedElecId
    );
  }, [ambiente, meta, activeTab, pan, zoom, onCanvasClick]);

  /** Información técnica de la geometría actual */
  const status = useMemo(() => {
    if (!ambiente) return null;
    const { tramos, allSegs: segs } = RENDERER.buildSegs(ambiente, meta);
    const allClosed = tramos.length > 0 && tramos.every(t => t.cerrado);
    return { 
      paredes: segs.length, 
      cerrado: allClosed 
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
              para visualizar la hoja
            </div>
          </div>
        )}

        {/* CORRECCIÓN 1: Marcador Paso B */}
        {creationFlow?.active && creationFlow.step === 'B' && creationFlow.anchor && (
          <div 
            style={{
              position: 'absolute',
              left: pan.x + (RENDERER.getBboxOffset(ambiente, meta).dx + GEO.mToPx(creationFlow.anchor.x + creationFlow.offsetX, meta.escala)) * zoom,
              top: pan.y + (RENDERER.getBboxOffset(ambiente, meta).dy + GEO.mToPx(creationFlow.anchor.y + creationFlow.offsetY, meta.escala)) * zoom,
              pointerEvents: 'none',
              transform: 'translate(-50%, -50%)'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20">
              <circle cx="10" cy="10" r="4" fill="none" stroke="var(--acc)" strokeWidth="1" strokeDasharray="2,2" />
              <line x1="0" y1="10" x2="20" y2="10" stroke="var(--acc)" strokeWidth="1" />
              <line x1="10" y1="0" x2="10" y2="20" stroke="var(--acc)" strokeWidth="1" />
            </svg>
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