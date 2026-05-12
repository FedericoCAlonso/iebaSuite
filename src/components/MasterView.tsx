import React, { useState, useRef, useMemo } from 'react';
import { RENDERER } from '../lib/renderer';
import * as GEO from '../lib/geometry';
import { useZoomPan } from '../hooks/useZoomPan';
import type { Project, Ambiente, HojaMaestra, Abertura } from '../types';
import type { DefinicionSimbolo } from '../lib/symbols';

interface MasterViewProps {
  project: Project;
  symbolsLib: DefinicionSimbolo[];
  onUpdateAmbiente: (id: string, fn: (amb: Ambiente) => Ambiente) => void;
  onUpdateProject: (fn: (p: Project) => Project) => void;
  onSelectAmbiente: (id: string) => void;
  onTabChange: (tab: any) => void;
}

export function MasterView({
  project,
  symbolsLib,
  onUpdateAmbiente,
  onUpdateProject,
  onSelectAmbiente,
  onTabChange
}: MasterViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const { zoom, pan, resetZoom, zoomIn, zoomOut } = useZoomPan(containerRef);

  const escala = project.meta.escala;

  React.useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);
  
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [tempPos, setTempPos] = useState({ x: 0, y: 0 }); // metros

  // --- LÓGICA DE CLUSTERS Y FUSIÓN ---
  const clusters = useMemo(() => {
    const results: { rootId: string; ambs: Map<string, { x: number, y: number, rot: number }> }[] = [];
    const visitedGlobal = new Set<string>();

    project.ambientes.forEach(startAmb => {
      if (visitedGlobal.has(startAmb.id)) return;

      const clusterAmbs = new Map<string, { x: number, y: number, rot: number }>();
      const queue: { id: string, x: number, y: number, rot: number }[] = [{ id: startAmb.id, x: 0, y: 0, rot: 0 }];
      
      while (queue.length > 0) {
        const { id, x, y, rot } = queue.shift()!;
        if (clusterAmbs.has(id)) continue;
        
        clusterAmbs.set(id, { x, y, rot });
        visitedGlobal.add(id);

        const amb = project.ambientes.find(a => a.id === id);
        if (!amb) continue;

        (amb.aberturas || []).forEach(ab => {
          if (ab.ambienteVecinoId && ab.aberturaVecinaId) {
            const vecino = project.ambientes.find(a => a.id === ab.ambienteVecinoId);
            if (vecino && !clusterAmbs.has(vecino.id)) {
              const abVecina = vecino.aberturas.find(v => v.id === ab.aberturaVecinaId);
              if (abVecina) {
                const { allSegs: sA } = RENDERER.buildSegs(amb, project.meta);
                const { allSegs: sV } = RENDERER.buildSegs(vecino, project.meta);
                const segA = sA[ab.pared];
                const segV = sV[abVecina.pared];
                
                if (segA && segV) {
                  const angA = Math.atan2(segA.fin[1] - segA.inicio[1], segA.fin[0] - segA.inicio[0]) * 180 / Math.PI;
                  const angV = Math.atan2(segV.fin[1] - segV.inicio[1], segV.fin[0] - segV.inicio[0]) * 180 / Math.PI;
                  const nextRot = (angA + rot + 180) - angV;
                  
                  // El vecino se apoya en la cara EXTERIOR del ambiente actual
                  const pLocalA = getOpeningPosM(amb, ab, rot, true); 
                  // Y el vecino usa su propia cara INTERIOR para el enlace
                  const pLocalV = getOpeningPosM(vecino, abVecina, nextRot, false);
                  
                  queue.push({ 
                    id: vecino.id, 
                    x: x + pLocalA.x - pLocalV.x, 
                    y: y + pLocalA.y - pLocalV.y, 
                    rot: nextRot 
                  });
                }
              }
            }
          }
        });
      }
      results.push({ rootId: startAmb.id, ambs: clusterAmbs });
    });
    return results;
  }, [project.ambientes, project.meta, escala]);

  function getOpeningPosM(amb: Ambiente, ab: Abertura, rotationDeg: number, useExterior: boolean) {
    const { allSegs } = RENDERER.buildSegs(amb, project.meta);
    const s = allSegs[ab.pared];
    if (!s) return { x: 0, y: 0 };
    
    // Punto base en la cara interior (eje del dibujo)
    let pPx = GEO.posEnPared(s, GEO.mToPx(ab.posicion + ab.ancho / 2, escala));
    
    // Si pedimos la cara exterior, sumamos el grosor en la dirección de la normal exterior
    if (useExterior) {
      const normalExt = s.v_ext; // Ya es unitaria
      const grosorPx = s.grosorPx;
      pPx = GEO.add(pPx, GEO.scale(normalExt, grosorPx));
    }

    const localM = { x: GEO.pxToM(pPx[0], escala), y: GEO.pxToM(pPx[1], escala) };
    const rad = (rotationDeg || 0) * Math.PI / 180;
    return {
      x: localM.x * Math.cos(rad) - localM.y * Math.sin(rad),
      y: localM.x * Math.sin(rad) + localM.y * Math.cos(rad)
    };
  }

  const finalAmbientes = useMemo(() => {
    const results = [...project.ambientes];
    clusters.forEach(cluster => {
      const rootAmb = project.ambientes.find(a => a.id === cluster.rootId);
      if (!rootAmb || rootAmb.posX === undefined) return;
      
      cluster.ambs.forEach((offset: { x: number, y: number, rot: number }, id: string) => {
        const amb = results.find(a => a.id === id);
        if (amb) {
          amb.posX = rootAmb.posX! + offset.x;
          amb.posY = rootAmb.posY! + offset.y;
          amb.rotation = (rootAmb.rotation || 0) + offset.rot;
        }
      });
    });
    return results;
  }, [clusters, project.ambientes]);

  const unplaced = useMemo(() => finalAmbientes.filter(a => a.posX === undefined), [finalAmbientes]);

  const handlePointerDown = (e: React.PointerEvent, amb: Ambiente) => {
    e.stopPropagation();
    const cluster = clusters.find(c => c.ambs.has(amb.id));
    if (!cluster) return;
    setDraggingId(cluster.rootId);
    const rootAmb = project.ambientes.find(a => a.id === cluster.rootId)!;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clickX = (e.clientX - rect.left - pan.x) / zoom;
    const clickY = (e.clientY - rect.top - pan.y) / zoom;
    const ambX = GEO.mToPx(rootAmb.posX || 0, escala);
    const ambY = GEO.mToPx(rootAmb.posY || 0, escala);
    setDragOffset({ x: clickX - ambX, y: clickY - ambY });
    setTempPos({ x: rootAmb.posX || 0, y: rootAmb.posY || 0 });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const [rotatingId, setRotatingId] = useState<string | null>(null);
  const [initialRot, setInitialRot] = useState(0);
  const [initialAngle, setInitialAngle] = useState(0);

  const handleRotateDown = (e: React.PointerEvent, amb: Ambiente) => {
    e.stopPropagation();
    const cluster = clusters.find(c => c.ambs.has(amb.id));
    if (!cluster) return;
    setRotatingId(cluster.rootId);
    const rootAmb = project.ambientes.find(a => a.id === cluster.rootId)!;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clickAngle = Math.atan2(e.clientY - rect.top - (GEO.mToPx(rootAmb.posY || 0, escala) * zoom + pan.y), 
                                  e.clientX - rect.left - (GEO.mToPx(rootAmb.posX || 0, escala) * zoom + pan.x));
    setInitialRot(rootAmb.rotation || 0);
    setInitialAngle(clickAngle * 180 / Math.PI);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    if (draggingId) {
      const currentX = (e.clientX - rect.left - pan.x) / zoom;
      const currentY = (e.clientY - rect.top - pan.y) / zoom;
      setTempPos({ 
        x: parseFloat(GEO.pxToM(currentX - dragOffset.x, escala).toFixed(2)), 
        y: parseFloat(GEO.pxToM(currentY - dragOffset.y, escala).toFixed(2)) 
      });
    } else if (rotatingId) {
      const rootAmb = project.ambientes.find(a => a.id === rotatingId)!;
      const currentAngle = Math.atan2(e.clientY - rect.top - (GEO.mToPx(rootAmb.posY || 0, escala) * zoom + pan.y), 
                                      e.clientX - rect.left - (GEO.mToPx(rootAmb.posX || 0, escala) * zoom + pan.x));
      const delta = (currentAngle * 180 / Math.PI) - initialAngle;
      onUpdateAmbiente(rotatingId, a => ({ ...a, rotation: Math.round(initialRot + delta) }));
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingId) {
      onUpdateAmbiente(draggingId, a => ({ ...a, posX: tempPos.x, posY: tempPos.y }));
      setDraggingId(null);
    }
    if (rotatingId) setRotatingId(null);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const handlePlaceAll = () => {
    onUpdateProject(p => ({
      ...p,
      ambientes: p.ambientes.map((a, i) => ({
        ...a,
        posX: a.posX ?? (i * 2),
        posY: a.posY ?? 0
      }))
    }));
  };

  const handleAddHoja = () => {
    const nueva: HojaMaestra = {
      id: Date.now().toString(),
      nombre: 'Nueva Hoja Maestro',
      ambientesIds: []
    };
    onUpdateProject(p => ({
      ...p,
      hojasMaestras: [...(p.hojasMaestras || []), nueva]
    }));
  };

  return (
    <div className="master-view">
      <div className="master-sidebar">
        <div className="sidebar-header">
          <h3>Plano Maestro</h3>
          <button className="btn btn-ghost btn-sm" onClick={() => onTabChange('proyecto')}>✕ Cerrar</button>
        </div>

        <div className="sidebar-section">
          <h4>Sin Ubicar ({unplaced.length})</h4>
          {unplaced.length > 0 && <button className="btn btn-acc btn-xs" onClick={handlePlaceAll}>Ubicar todas</button>}
          <div className="unplaced-grid">
            {unplaced.map(amb => (
              <button 
                key={amb.id} 
                className="unplaced-btn"
                onClick={() => onUpdateAmbiente(amb.id, a => ({ ...a, posX: 0, posY: 0 }))}
              >
                <span style={{ fontSize: '18px' }}>📄</span>
                <span>{amb.nombre}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="sidebar-section">
          <h4>Hojas de relevamiento ({project.ambientes.length})</h4>
          <div className="amb-list">
            {project.ambientes.map(amb => (
              <div key={amb.id} className={`amb-item ${amb.id === draggingId ? 'dragging' : ''}`}>
                <div className="amb-item-main">
                  <span className="amb-name">{amb.nombre}</span>
                  <span className={`status-dot ${amb.posX !== undefined ? 'placed' : ''}`} title={amb.posX !== undefined ? 'Ubicada' : 'Sin ubicar'}></span>
                </div>
                <div className="amb-item-actions">
                  <button className="btn btn-xs" onClick={() => {
                    onSelectAmbiente(amb.id);
                    onTabChange('proyecto');
                  }}>Editar</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="sidebar-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h4>Hojas Maestras</h4>
            <button className="btn btn-acc btn-xs" onClick={handleAddHoja}>+ Nueva</button>
          </div>
          {(project.hojasMaestras || []).map(hoja => (
            <div key={hoja.id} className="hoja-item">
              <input 
                className="hoja-name-input"
                value={hoja.nombre} 
                onChange={e => onUpdateProject(p => ({
                  ...p,
                  hojasMaestras: p.hojasMaestras?.map(h => h.id === hoja.id ? { ...h, nombre: e.target.value } : h)
                }))}
              />
              <div className="hoja-ambs">{hoja.ambientesIds.length} seleccionadas</div>
            </div>
          ))}
        </div>
      </div>

      <div className="master-canvas-area" ref={containerRef}>
        <div className="canvas-toolbar">
          <button onClick={zoomIn}>➕</button>
          <button onClick={zoomOut}>➖</button>
          <button onClick={resetZoom}>🎯</button>
          {draggingId && <div className="coord-tip">X: {tempPos.x}m | Y: {tempPos.y}m</div>}
        </div>

        <svg 
          className="master-svg-root"
          width={dimensions.width} 
          height={dimensions.height} 
          onPointerMove={handlePointerMove}
        >
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            <rect x="-5000" y="-5000" width="10000" height="10000" fill="url(#grid)" />
            
            {/* RENDERIZADO UNIFICADO POR CLUSTERS */}
            {clusters.map(cluster => {
              const rootAmb = project.ambientes.find(a => a.id === cluster.rootId);
              if (!rootAmb || rootAmb.posX === undefined) return null;

              const isDragging = cluster.rootId === draggingId;
              const displayX = isDragging ? GEO.mToPx(tempPos.x, escala) : GEO.mToPx(rootAmb.posX!, escala);
              const displayY = isDragging ? GEO.mToPx(tempPos.y, escala) : GEO.mToPx(rootAmb.posY!, escala);
              const displayRot = rootAmb.rotation || 0;

              // Ambitos del cluster (para el renderizador unificado)
              const ambsInCluster = Array.from(cluster.ambs.keys()).map(id => {
                const amb = project.ambientes.find(a => a.id === id)!;
                const offset = cluster.ambs.get(id)!;
                return {
                  ...amb,
                  // Las posiciones en renderMasterContent deben ser relativas al root del cluster
                  // porque el <g> ya tiene el translate del root.
                  posX: offset.x,
                  posY: offset.y,
                  rotation: offset.rot
                };
              });

              return (
                <g 
                  key={cluster.rootId} 
                  transform={`translate(${displayX}, ${displayY}) rotate(${displayRot})`}
                >
                  {/* El "Dibujo" fusionado del cluster */}
                  <g dangerouslySetInnerHTML={{ 
                    __html: RENDERER.renderMasterContent(project, symbolsLib, ambsInCluster) 
                  }} />

                  {/* Capa de Interacción: Handles para cada ambiente del cluster */}
                  {ambsInCluster.map(amb => {
                    // Posición local del ambiente dentro del grupo del cluster
                    const lx = GEO.mToPx(amb.posX!, escala);
                    const ly = GEO.mToPx(amb.posY!, escala);
                    const lr = amb.rotation || 0;

                    return (
                      <g key={amb.id} transform={`translate(${lx}, ${ly}) rotate(${lr})`}>
                        {/* Rect de arrastre (toda la hoja) */}
                        <rect 
                          x="-150" y="-150" width="300" height="300" 
                          fill="transparent" 
                          onPointerDown={(e) => handlePointerDown(e, amb)}
                          onPointerUp={handlePointerUp}
                          style={{ cursor: isDragging ? 'grabbing' : 'grab', pointerEvents: 'all' }} 
                        />
                        
                        {/* Handle de rotación */}
                        <g 
                          transform="translate(0, -30)" 
                          onPointerDown={(e) => handleRotateDown(e, amb)} 
                          style={{ cursor: 'alias', pointerEvents: 'all' }}
                        >
                          <circle r="8" fill="white" stroke="var(--acc)" strokeWidth="1.5" />
                          <text textAnchor="middle" dominantBaseline="middle" fontSize="10" fill="var(--acc)" fontWeight="bold">⟳</text>
                        </g>
                      </g>
                    );
                  })}
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      <style>{`
        .master-view { display: flex; width: 100%; height: 100%; background: #fdfdfd; overflow: hidden; }
        .master-sidebar { width: 280px; border-right: 1px solid var(--border); display: flex; flex-direction: column; background: white; z-index: 10; }
        .sidebar-header { padding: 16px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
        .sidebar-section { padding: 16px; border-bottom: 1px solid var(--border); }
        .sidebar-section h4 { margin: 0 0 12px 0; font-size: 13px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.5px; }
        .unplaced-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
        .unplaced-btn { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 8px; border: 1px dashed var(--border); border-radius: 8px; background: #fafafa; cursor: pointer; font-size: 11px; color: var(--text-dim); transition: all 0.2s; }
        .unplaced-btn:hover { border-color: var(--acc); background: white; color: var(--text); transform: translateY(-2px); }
        .amb-list { display: flex; flex-direction: column; gap: 8px; }
        .amb-item { padding: 8px; border: 1px solid var(--border); border-radius: 6px; background: #fafafa; }
        .amb-item-main { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
        .status-dot { width: 8px; height: 8px; border-radius: 50%; background: #ccc; }
        .status-dot.placed { background: var(--acc); box-shadow: 0 0 4px var(--acc); }
        .amb-item-actions { display: flex; gap: 4px; }
        .hoja-item { padding: 8px; border: 1px solid var(--border); border-radius: 6px; margin-bottom: 8px; }
        .hoja-name-input { border: none; font-weight: bold; width: 100%; margin-bottom: 4px; font-size: 13px; }
        .master-canvas-area { flex: 1; position: relative; background: #f0f2f5; touch-action: none; }
        .canvas-toolbar { position: absolute; top: 16px; right: 16px; display: flex; flex-direction: column; gap: 8px; z-index: 5; }
        .canvas-toolbar button { width: 36px; height: 36px; border-radius: 8px; border: 1px solid var(--border); background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.1); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 18px; }
        .coord-tip { position: absolute; top: 0; right: 50px; background: rgba(0,0,0,0.8); color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; white-space: nowrap; }
      `}</style>
    </div>
  );
}
