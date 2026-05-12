import React from 'react';
import { Card } from '../../Card';
import { F } from '../../Field';
import { NumInput } from '../../NumImput';
import { type Ambiente } from '../../../types';

interface MasterConfigTabProps {
  activeAmbiente: Ambiente;
  onUpdateAmbiente: (fn: (a: Ambiente) => Ambiente) => void;
}

/**
 * Pestaña para la configuración de la integración de la hoja en el plano maestro.
 */
export const MasterConfigTab: React.FC<MasterConfigTabProps> = React.memo(({ 
  activeAmbiente, 
  onUpdateAmbiente 
}) => {
  return (
    <>
      <Card idx="📐" title="Configuración de Hoja Maestro" defaultOpen={true}>
        <F label="Formato">
          <select
            value={activeAmbiente.configHoja?.formato || 'A4'}
            onChange={e => onUpdateAmbiente(a => ({ 
              ...a, 
              configHoja: { ...(a.configHoja || { formato: 'A4', orientacion: 'horizontal' }), formato: e.target.value as any } 
            }))}
          >
            <option value="A4">A4 (210x297mm)</option>
            <option value="A3">A3 (297x420mm)</option>
          </select>
        </F>
        <F label="Orientación">
          <select
            value={activeAmbiente.configHoja?.orientacion || 'horizontal'}
            onChange={e => onUpdateAmbiente(a => ({ 
              ...a, 
              configHoja: { ...(a.configHoja || { formato: 'A4', orientacion: 'horizontal' }), orientacion: e.target.value as any } 
            }))}
          >
            <option value="horizontal">Horizontal</option>
            <option value="vertical">Vertical</option>
          </select>
        </F>
      </Card>

      <Card idx="🏗️" title="Integración en Proyecto" defaultOpen={true}>
        <div className="info-helper">Posicioná esta hoja en el plano maestro (en metros).</div>
        <div className="field-row">
          <F label="Posición X (m)">
            <NumInput
              value={activeAmbiente.posX || 0}
              onChange={v => onUpdateAmbiente(a => ({ ...a, posX: v }))}
            />
          </F>
          <F label="Posición Y (m)">
            <NumInput
              value={activeAmbiente.posY || 0}
              onChange={v => onUpdateAmbiente(a => ({ ...a, posY: v }))}
            />
          </F>
          <F label="Rotación (°)">
            <NumInput
              value={activeAmbiente.rotation || 0}
              onChange={v => onUpdateAmbiente(a => ({ ...a, rotation: v }))}
            />
          </F>
        </div>
      </Card>
    </>
  );
});
