// ═══════════════════════════════════════════════════════════════════════════
// MODULE: components/ElectricalCard.tsx
// ═══════════════════════════════════════════════════════════════════════════

import type { ElementoElectrico, Circuito } from '../types';
import type { DefinicionSimbolo } from '../lib/symbols';

import { NumInput } from './NumImput';
import { Card } from './Card';
import { F } from './Field';

interface ElectricalCardProps {
  el: ElementoElectrico;
  index: number;
  wallCount: number;
  symbolsLib: DefinicionSimbolo[];
  circuitos: Circuito[];
  onChange: (el: ElementoElectrico) => void;
  onRemove: () => void;
  onEdit: () => void;
}

export function ElectricalCard({ 
  el, 
  index, 
  wallCount, 
  symbolsLib,
  circuitos,
  onChange, 
  onRemove, 
  onEdit 
}: ElectricalCardProps) {
  
  const symDef = symbolsLib.find(s => s.id === el.tipo);
  const label = symDef ? symDef.label : el.tipo;

  const circuito = circuitos.find(c => c.id === el.circuitoId);

  // Dot de color del circuito asignado
  const circuitoDot = circuito ? (
    <span style={{
      display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
      background: circuito.color || '#999', marginRight: 4, verticalAlign: 'middle'
    }} />
  ) : null;

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
        <F label="Altura montaje (m)">
          <NumInput 
            value={el.altura ?? 0} 
            onChange={(v) => onChange({ ...el, altura: v })}
          />
        </F>
      </div>

      <div className="field-row">
        <F label="Circuito">
          <select
            value={el.circuitoId || ''}
            onChange={e => onChange({ ...el, circuitoId: e.target.value || undefined })}
          >
            <option value="">— Sin circuito —</option>
            {circuitos.map(c => (
              <option key={c.id} value={c.id}>
                {c.nombre} ({c.tipo})
              </option>
            ))}
          </select>
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

      {/* Datos técnicos libres */}
      {el.datos.length > 0 && (
        <div style={{ marginTop: 4, marginBottom: 4 }}>
          {el.datos.map((d, di) => (
            <div key={di} className="field-row" style={{ alignItems: 'flex-end', marginBottom: 4 }}>
              <div style={{ flex: 1 }}>
                <F label="Clave">
                  <input
                    type="text"
                    value={d.clave}
                    onChange={e => {
                      const datos = el.datos.map((x, j) => j === di ? { ...x, clave: e.target.value } : x);
                      onChange({ ...el, datos });
                    }}
                    placeholder="ej: tensión"
                  />
                </F>
              </div>
              <div style={{ flex: 1 }}>
                <F label="Valor">
                  <input
                    type="text"
                    value={d.valor}
                    onChange={e => {
                      const datos = el.datos.map((x, j) => j === di ? { ...x, valor: e.target.value } : x);
                      onChange({ ...el, datos });
                    }}
                    placeholder="ej: 220V"
                  />
                </F>
              </div>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => onChange({ ...el, datos: el.datos.filter((_, j) => j !== di) })}
              >✕</button>
            </div>
          ))}
        </div>
      )}
      <button
        className="btn btn-ghost btn-sm"
        onClick={() => onChange({ ...el, datos: [...el.datos, { clave: '', valor: '' }] })}
      >
        + Dato técnico
      </button>

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

      {circuito && (
        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4, display: 'flex', alignItems: 'center' }}>
          {circuitoDot}
          {circuito.nombre} — {circuito.tipo} — {circuito.seccion}mm² — {circuito.proteccion}
        </div>
      )}
    </Card>
  );
}