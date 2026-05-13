import React from 'react';
import { Card } from '../../Card';
import { F } from '../../Field';
import { NumInput } from '../../NumImput';
import { ElectricalCard } from '../../ElectricalCard';
import { createElementoEstructural } from '../../../lib/storage';
import { RENDERER } from '../../../lib/renderer';
import { 
  type Project, type Ambiente, type ElementoElectrico, 
  type Circuito, type SymbolDialogData 
} from '../../../types/index';

interface ElectricalTabProps {
  project: Project;
  activeAmbiente: Ambiente;
  symbolsLib: any[];
  circuitos: Circuito[];
  updateElectrical: (fn: (elementos: ElementoElectrico[]) => ElementoElectrico[]) => void;
  updateStructural: (fn: (elementos: any[]) => any[]) => void;
  onSymbolDialog: (data: SymbolDialogData) => void;
  onShowNetlist: () => void;
  pendingConnection?: { ambienteId: string, elementoId: string } | null;
  onStartConnecting?: (elId: string) => void;
  onFinishConnecting?: (ambId: string, elId: string) => void;
  onCancelConnecting?: () => void;
}

/**
 * Pestaña para la gestión de bocas eléctricas y elementos estructurales.
 */
export const ElectricalTab: React.FC<ElectricalTabProps> = React.memo(({ 
  project, 
  activeAmbiente, 
  symbolsLib, 
  circuitos, 
  updateElectrical, 
  updateStructural, 
  onSymbolDialog, 
  onShowNetlist,
  pendingConnection,
  onStartConnecting,
  onFinishConnecting,
  onCancelConnecting
}) => {
  return (
    <>
      <div className="info-helper">
        🖱 Tocá el plano para insertar un símbolo.<br />
        Los símbolos de pared hacen snap automáticamente.
      </div>
      
      <div style={{ padding: '8px' }}>
        <Card title="Columnas y Estructura" idx="🏗️" defaultOpen={false}>
          {(activeAmbiente.elementosEstructurales || []).map((ee) => (
            <div key={ee.id} className="structural-item" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 8, marginBottom: 8 }}>
              <div className="field-row">
                <F label="Etiqueta/Desc">
                  <input 
                    type="text" 
                    value={ee.descripcion || ''} 
                    onChange={e => updateStructural(ees => ees.map(x => x.id === ee.id ? { ...x, descripcion: e.target.value } : x))} 
                  />
                </F>
                <F label="X (m)">
                  <NumInput 
                    value={ee.x} 
                    onChange={v => updateStructural(ees => ees.map(x => x.id === ee.id ? { ...x, x: v } : x))} 
                  />
                </F>
                <F label="Y (m)">
                  <NumInput 
                    value={ee.y} 
                    onChange={v => updateStructural(ees => ees.map(x => x.id === ee.id ? { ...x, y: v } : x))} 
                  />
                </F>
              </div>
              <div className="field-row">
                <F label="Ancho (m)">
                  <NumInput 
                    value={ee.ancho || 0.2} 
                    onChange={v => updateStructural(ees => ees.map(x => x.id === ee.id ? { ...x, ancho: v } : x))} 
                  />
                </F>
                <F label="Prof. (m)">
                  <NumInput 
                    value={ee.profundidad || 0.2} 
                    onChange={v => updateStructural(ees => ees.map(x => x.id === ee.id ? { ...x, profundidad: v } : x))} 
                  />
                </F>
                <button 
                  className="btn btn-danger btn-sm" 
                  onClick={() => updateStructural(ees => ees.filter(x => x.id !== ee.id))}
                >✕</button>
              </div>
            </div>
          ))}
          <button 
            className="btn btn-ghost btn-sm btn-full" 
            onClick={() => updateStructural(ees => [...ees, createElementoEstructural()])}
          >
            + Agregar Columna
          </button>
        </Card>
      </div>

      <div style={{ padding: '0 8px 8px' }}>
        <button className="btn btn-acc btn-full" onClick={onShowNetlist}>
          📄 Ver Listado de Materiales (Netlist)
        </button>
      </div>
      
      {activeAmbiente.elementos.map((el, i) => (
        <ElectricalCard
          key={el.id}
          el={el}
          index={i}
          wallCount={RENDERER.buildSegs(activeAmbiente, project.meta).allSegs.length}
          symbolsLib={symbolsLib}
          circuitos={circuitos}
          columnas={activeAmbiente.elementosEstructurales}
          onChange={(nel) => updateElectrical(ps => ps.map((x, j) => j === i ? nel : x))}
          onRemove={() => updateElectrical(ps => ps.filter((_, j) => j !== i))}
          onEdit={() => onSymbolDialog({ mode: 'edit', existing: el })}
          activeAmbienteId={activeAmbiente.id}
          pendingConnection={pendingConnection}
          onStartConnecting={onStartConnecting}
          onFinishConnecting={onFinishConnecting}
          onCancelConnecting={onCancelConnecting}
        />
      ))}
    </>
  );
});
