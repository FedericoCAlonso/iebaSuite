// ═══════════════════════════════════════════════════════════════════════════
// MODULE: components/ElectricalCard.tsx
// ═══════════════════════════════════════════════════════════════════════════

import type { ElementoElectrico } from '../types';
import type { DefinicionSimbolo } from '../lib/symbols';

import { NumInput } from './NumImput';
import { Card } from './Card';
import { F } from './Field';

interface ElectricalCardProps {
  el: ElementoElectrico;
  index: number;
  wallCount: number;
  symbolsLib: DefinicionSimbolo[];
  onChange: (el: ElementoElectrico) => void;
  onRemove: () => void;
  onEdit: () => void;
}

export function ElectricalCard({ 
  el, 
  index, 
  wallCount, 
  symbolsLib,
  onChange, 
  onRemove, 
  onEdit 
}: ElectricalCardProps) {
  
  const symDef = symbolsLib.find(s => s.id === el.tipo);
  const label = symDef ? symDef.label : el.tipo;

  return (
    <Card
      idx={`E${index}`} 
      idxColor="var(--red)"
      title={label}
      badge={el.referencia || '—'}
      onRemove={onRemove}
      onEdit={onEdit}
    >
      <div className="field-row">
        <F label="Ref. Plano">
          <input 
            type="text" 
            value={el.referencia} 
            onChange={(e) => onChange({ ...el, referencia: e.target.value })} 
            placeholder="L1"
          />
        </F>
        <F label="Mostrar dato en SVG">
          <select 
            value={el.mostrarDato ? 'si' : 'no'} 
            onChange={(e) => onChange({ ...el, mostrarDato: e.target.value === 'si' })}
          >
            <option value="no">No</option>
            <option value="si">Sí (1er dato)</option>
          </select>
        </F>
      </div>

      {el.paredIdx != null ? (
        <div className="field-row">
          <F label="Pared #">
            <NumInput 
              value={el.paredIdx ?? 0} 
              onChange={(v) => onChange({
                ...el,
                paredIdx: Math.max(0, Math.min(wallCount - 1, Math.round(v)))
              })}
            />
          </F>
          <F label="Pos. en pared (m)">
            <NumInput 
              value={el.paredPos ?? 0} 
              onChange={(v) => onChange({ ...el, paredPos: v })}
            />
          </F>
        </div>
      ) : (
        <div className="field-row">
          <F label="X (m)">
            <NumInput 
              value={el.x || 0} 
              onChange={(v) => onChange({ ...el, x: v })}
            />
          </F>
          <F label="Y (m)">
            <NumInput 
              value={el.y || 0} 
              onChange={(v) => onChange({ ...el, y: v })}
            />
          </F>
        </div>
      )}
    </Card>
  );
}