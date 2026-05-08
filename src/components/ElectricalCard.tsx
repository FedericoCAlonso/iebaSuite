// ═══════════════════════════════════════════════════════════════════════════
// MODULE: components/ElectricalCard.tsx
// ═══════════════════════════════════════════════════════════════════════════

import type { ElementoElectrico } from '../types';
import type { DefinicionSimbolo } from '../lib/symbols';

// Importamos las funciones específicas del motor geométrico
import { pxToM, mToPx } from '../lib/geometry'; 

import { NumInput } from './NumImput';
import { Card } from './Card';
import { F } from './Field';

interface ElectricalCardProps {
  el: ElementoElectrico;
  index: number;
  wallCount: number;
  escala: number;
  symbolsLib: DefinicionSimbolo[];
  onChange: (el: ElementoElectrico) => void;
  onRemove: () => void;
  onEdit: () => void;
}

export function ElectricalCard({ 
  el, 
  index, 
  wallCount, 
  escala, 
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
    >
      {/* Botón para abrir el diálogo de edición visual */}
      <div style={{ marginBottom: '8px' }}>
        <button className="btn btn-ghost btn-sm btn-full" onClick={onEdit}>
          ✏️ Editar en el plano
        </button>
      </div>

      <F label="Tipo de símbolo">
        <select 
          value={el.tipo}
          onChange={e => onChange({ ...el, tipo: e.target.value })}
        >
          {symbolsLib.map(s => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
      </F>

      <div className="field-row">
        <F label="Referencia (L1, T2…)">
          <input 
            value={el.referencia || ''} 
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
              // Usamos las funciones del motor geométrico importadas
              value={el.paredPos != null ? pxToM(el.paredPos, escala) : 0} 
              onChange={(v) => onChange({ ...el, paredPos: mToPx(v, escala) })}
            />
          </F>
        </div>
      ) : (
        <div className="field-row">
          <F label="X (px plano)">
            <NumInput 
              value={Math.round(el.x || 0)} 
              onChange={(v) => onChange({ ...el, x: v })}
            />
          </F>
          <F label="Y (px plano)">
            <NumInput 
              value={Math.round(el.y || 0)} 
              onChange={(v) => onChange({ ...el, y: v })}
            />
          </F>
        </div>
      )}

      {/* ... Sección de datos técnicos igual que antes ... */}
      <div className="sec-hdr">Datos técnicos</div>
      
      {(el.datos || []).map((d, j) => (
        <div key={j} className="field-row" style={{ alignItems: 'flex-end', gap: '4px' }}>
          <input 
            style={{ flex: 1 }}
            value={d.clave || ''} 
            placeholder="clave" 
            onChange={(e) => {
              const a = [...el.datos];
              a[j] = { ...d, clave: e.target.value };
              onChange({ ...el, datos: a });
            }}
          />
          <input 
            style={{ flex: 1 }}
            value={d.valor || ''} 
            placeholder="valor" 
            onChange={(e) => {
              const a = [...el.datos];
              a[j] = { ...d, valor: e.target.value };
              onChange({ ...el, datos: a });
            }}
          />
          <button 
            className="btn btn-danger btn-xs" 
            onClick={() => {
              const a = [...el.datos];
              a.splice(j, 1);
              onChange({ ...el, datos: a });
            }}
          >✕</button>
        </div>
      ))}
      
      <button 
        className="btn btn-ghost btn-sm" 
        onClick={() => onChange({
          ...el, 
          datos: [...(el.datos || []), { clave: '', valor: '' }] 
        })}
      >
        + Agregar dato técnico
      </button>
    </Card>
  );
}