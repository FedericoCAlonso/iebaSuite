import { useState, useMemo } from 'react';
import { RENDERER } from '../lib/renderer';
import * as GEO from '../lib/geometry';
import { createPared, createZonaCobertura } from '../lib/storage';
import { 
  type Project, type Ambiente, type Abertura, 
  type ElementoElectrico, type Circuito, type Conexion 
} from '../types';

/**
 * Custom Hook que encapsula toda la lógica de estado y cálculos del editor.
 * Aplica el principio de SRP (Single Responsibility Principle).
 */
export function useEditorState(
  project: Project,
  activeAmbiente: Ambiente,
  onUpdateAmbiente: (updateFn: (amb: Ambiente) => Ambiente) => void,
  onUpdateProject: (fn: (p: Project) => Project) => void
) {
  const [activeTramoIdx, setActiveTramoIdx] = useState(0);
  
  // Estado del flujo de creación Paso A/B
  const [creationFlow, setCreationFlow] = useState<{
    active: boolean;
    type: 'tramo' | 'cobertura';
    step: 'A' | 'B';
    anchor: { x: number; y: number; label: string; ref?: any } | null;
    offsetX: number;
    offsetY: number;
  }>({ active: false, type: 'tramo', step: 'A', anchor: null, offsetX: 0, offsetY: 0 });

  // --- Geometría: Cálculo de todos los vértices anclables ---
  const allVertices = useMemo(() => {
    if (!activeAmbiente || !project) return [];
    const { tramos } = RENDERER.buildSegs(activeAmbiente, project.meta);
    const result: { x: number, y: number, label: string, ref: any }[] = [];
    
    // Vértices de tramos de paredes
    tramos.forEach((t, ti) => {
      t.segs.forEach((s, si) => {
        const xM = GEO.pxToM(s.inicio[0], project.meta.escala);
        const yM = GEO.pxToM(s.inicio[1], project.meta.escala);
        result.push({ 
          x: xM, y: yM, 
          label: `Tramo ${ti + 1} · Vértice ${si + 1} — (${xM.toFixed(2)}m, ${yM.toFixed(2)}m)`,
          ref: { type: 'vertice', ambienteRefId: activeAmbiente.id, tramoRefId: activeAmbiente.tramos[ti].id, verticeRefIdx: si }
        });
        if (si === t.segs.length - 1) {
          const xF = GEO.pxToM(s.fin[0], project.meta.escala);
          const yF = GEO.pxToM(s.fin[1], project.meta.escala);
          result.push({ 
            x: xF, y: yF, 
            label: `Tramo ${ti + 1} · Vértice ${si + 2} — (${xF.toFixed(2)}m, ${yF.toFixed(2)}m)`,
            ref: { type: 'vertice', ambienteRefId: activeAmbiente.id, tramoRefId: activeAmbiente.tramos[ti].id, verticeRefIdx: si + 1 }
          });
        }
      });
    });

    // Vértices de zonas de cobertura
    (activeAmbiente.coberturas || []).forEach((cob, ci) => {
      let curX = cob.origenX || 0;
      let curY = cob.origenY || 0;
      let curAng = 0;
      result.push({ 
        x: curX, y: curY, 
        label: `Cobert. ${ci + 1} · Origen — (${curX.toFixed(2)}m, ${curY.toFixed(2)}m)`, 
        ref: { type: 'cobertura', id: cob.id, idx: 0 } 
      });
      
      cob.segmentos.forEach((s, si) => {
        curAng += s.angulo;
        curX += s.largo * Math.cos(curAng * Math.PI / 180);
        curY += s.largo * Math.sin(curAng * Math.PI / 180);
        result.push({ 
          x: curX, y: curY, 
          label: `Cobert. ${ci + 1} · Vértice ${si + 1} — (${curX.toFixed(2)}m, ${curY.toFixed(2)}m)`, 
          ref: { type: 'cobertura', id: cob.id, idx: si + 1 } 
        });
      });
    });

    // Opción por defecto
    result.push({ x: 0, y: 0, label: "Origen libre (0, 0)", ref: { type: 'pendiente' } });
    return result;
  }, [activeAmbiente, project]);

  // --- Handlers de actualización semántica ---
  const updateOpenings = (fn: (aberturas: Abertura[]) => Abertura[]) => {
    onUpdateProject(proj => {
      const currentAmb = proj.ambientes.find(a => a.id === activeAmbiente.id);
      if (!currentAmb) return proj;
      
      const nextOpenings = fn(currentAmb.aberturas || []);
      
      return {
        ...proj,
        ambientes: proj.ambientes.map(amb => {
          // Actualizar hoja actual
          if (amb.id === activeAmbiente.id) {
            return { ...amb, aberturas: nextOpenings };
          }
          
          // Sincronizar hojas vinculadas
          const linkedOpenings = (amb.aberturas || []).map(targetOp => {
            if (targetOp.ambienteVecinoId === activeAmbiente.id) {
              const sourceOp = nextOpenings.find(o => o.id === targetOp.aberturaVecinaId);
              if (sourceOp) {
                return {
                  ...targetOp,
                  ancho: sourceOp.ancho,
                  tipo: sourceOp.tipo,
                  subtipo: sourceOp.subtipo,
                  hojas: sourceOp.hojas,
                  // Simetría: Si una abre para adentro, la otra para afuera
                  lado: sourceOp.lado === 'interior' ? 'exterior' : (sourceOp.lado === 'exterior' ? 'interior' : sourceOp.lado),
                  // Simetría: Si una es derecha, la otra es izquierda (desde el otro lado)
                  sentido: sourceOp.sentido === 'derecha' ? 'izquierda' : (sourceOp.sentido === 'izquierda' ? 'derecha' : sourceOp.sentido)
                };
              }
            }
            return targetOp;
          });
          
          return { ...amb, aberturas: linkedOpenings };
        })
      };
    });
  };

  const updateElectrical = (fn: (elementos: ElementoElectrico[]) => ElementoElectrico[]) =>
    onUpdateAmbiente(a => ({ ...a, elementos: fn(a.elementos || []) }));

  const updateStructural = (fn: (elementos: import('../types').ElementoEstructural[]) => import('../types').ElementoEstructural[]) =>
    onUpdateAmbiente(a => ({ ...a, elementosEstructurales: fn(a.elementosEstructurales || []) }));

  const updateCircuitos = (fn: (circuitos: Circuito[]) => Circuito[]) =>
    onUpdateProject(p => ({ ...p, circuitos: fn(p.circuitos || []) }));

  const updateConexiones = (fn: (conexiones: Conexion[]) => Conexion[]) =>
    onUpdateProject(p => ({ ...p, conexiones: fn(p.conexiones || []) }));

  /**
   * Vincula una abertura de la hoja activa con una ya existente en otra hoja.
   * Crea un enlace bidireccional, sincroniza propiedades y AUTO-ROTA la hoja esclava
   * para que los muros coincidan en el plano maestro.
   */
  const linkOpening = (targetAmbId: string, targetOpeningId: string, currentOpeningId: string) => {
    onUpdateProject(proj => {
      const targetAmb = proj.ambientes.find(a => a.id === targetAmbId);
      const targetOp = targetAmb?.aberturas.find(o => o.id === targetOpeningId);
      if (!targetAmb || !targetOp) return proj;

      // 1. Calcular rotación necesaria para que los muros queden enfrentados
      const { allSegs: segsActiva } = RENDERER.buildSegs(activeAmbiente, proj.meta);
      const { allSegs: segsVecina } = RENDERER.buildSegs(targetAmb, proj.meta);
      
      const opActiva = activeAmbiente.aberturas.find(o => o.id === currentOpeningId);
      if (!opActiva) return proj;

      const sActiva = segsActiva[opActiva.pared];
      const sVecina = segsVecina[targetOp.pared];
      
      let rotacionEsclava = 0;
      if (sActiva && sVecina) {
        const angActiva = Math.atan2(sActiva.fin[1] - sActiva.inicio[1], sActiva.fin[0] - sActiva.inicio[0]) * 180 / Math.PI;
        const angVecina = Math.atan2(sVecina.fin[1] - sVecina.inicio[1], sVecina.fin[0] - sVecina.inicio[0]) * 180 / Math.PI;
        // Queremos que angVecina + rotationB = angActiva + 180
        rotacionEsclava = (angActiva + 180) - angVecina;
      }

      return {
        ...proj,
        ambientes: proj.ambientes.map(amb => {
          // Actualizar abertura en la hoja actual (ESCLAVA)
          if (amb.id === activeAmbiente.id) {
            return {
              ...amb,
              rotation: rotacionEsclava, // Aplicamos la rotación calculada
              aberturas: (amb.aberturas || []).map(o => {
                if (o.id === currentOpeningId) {
                  return { 
                    ...o, 
                    ambienteVecinoId: targetAmbId, 
                    aberturaVecinaId: targetOpeningId,
                    esPrincipal: false, // La existente manda
                    ancho: targetOp.ancho,
                    tipo: targetOp.tipo,
                    subtipo: targetOp.subtipo,
                    lado: targetOp.lado === 'interior' ? 'exterior' : 'interior',
                    sentido: targetOp.sentido === 'derecha' ? 'izquierda' : 'derecha'
                  };
                }
                return o;
              })
            };
          }
          // Actualizar abertura en la hoja destino (MAESTRA)
          if (amb.id === targetAmbId) {
            return {
              ...amb,
              aberturas: (amb.aberturas || []).map(o => {
                if (o.id === targetOpeningId) {
                  return { 
                    ...o, 
                    ambienteVecinoId: activeAmbiente.id, 
                    aberturaVecinaId: currentOpeningId,
                    esPrincipal: true 
                  };
                }
                return o;
              })
            };
          }
          return amb;
        })
      };
    });
  };

  // --- Handlers del Flujo de Creación ---
  const startCreation = (type: 'tramo' | 'cobertura') => {
    setCreationFlow({ active: true, type, step: 'A', anchor: null, offsetX: 0, offsetY: 0 });
  };

  const cancelCreation = () => setCreationFlow(prev => ({ ...prev, active: false }));
  const setCreationStep = (step: 'A' | 'B') => setCreationFlow(prev => ({ ...prev, step }));
  const setCreationAnchor = (anchor: any) => setCreationFlow(prev => ({ ...prev, anchor }));
  const setCreationOffset = (x: number, y: number) => setCreationFlow(prev => ({ ...prev, offsetX: x, offsetY: y }));

  const confirmCreation = () => {
    const finalX = (creationFlow.anchor?.x || 0) + creationFlow.offsetX;
    const finalY = (creationFlow.anchor?.y || 0) + creationFlow.offsetY;
    
    if (creationFlow.type === 'tramo') {
      onUpdateAmbiente(a => {
        const nts = [...a.tramos];
        nts[activeTramoIdx] = { ...nts[activeTramoIdx], cerrado: false };
        const newIdx = nts.length;
        nts.push({ 
          id: Date.now().toString(), 
          cerrado: false, 
          paredes: [createPared()],
          origenX: finalX,
          origenY: finalY,
          amarre: creationFlow.anchor?.ref
        });
        setActiveTramoIdx(newIdx);
        return { ...a, tramos: nts };
      });
    } else {
      onUpdateAmbiente(a => ({
        ...a,
        coberturas: [...(a.coberturas || []), {
          ...createZonaCobertura(),
          origenX: finalX,
          origenY: finalY
        }]
      }));
    }
    cancelCreation();
  };

  return {
    // Estado
    activeTramoIdx, setActiveTramoIdx,
    creationFlow,
    
    // Acciones del flujo
    startCreation, cancelCreation, setCreationStep, setCreationAnchor, setCreationOffset, confirmCreation,
    
    // Geometría
    allVertices,
    
    // Helpers de actualización
    updateOpenings, updateElectrical, updateStructural, updateCircuitos, updateConexiones,
    linkOpening,
    
    // Atajos de datos
    circuitos: project.circuitos || [],
    conexiones: project.conexiones || []
  };
}
