// ═══════════════════════════════════════════════════════════════════════════
// MODULE: components/CircuitoCard.tsx
// Tarjeta de edición de un circuito eléctrico del proyecto.
// ═══════════════════════════════════════════════════════════════════════════

import { Card } from './Card';
import { F } from './Field';
import { NumInput } from './NumImput';
import type { Circuito, TipoCircuito } from '../types';

interface CircuitoCardProps {
  circuito: Circuito;
  index: number;
  onChange: (c: Circuito) => void;
  onRemove: () => void;
}

const TIPO_CIRCUITO_OPTIONS: { value: TipoCircuito; label: string }[] = [
  { value: 'IUG',  label: 'IUG' },
  { value: 'IUE',  label: 'IUE' },
  { value: 'TUG',  label: 'TUG' },
  { value: 'TUE',  label: 'TUE' },
  { value: 'ACU',  label: 'ACU' },
  { value: 'MBT',  label: 'MBT' },
  { value: 'MBTF', label: 'MBTF' },
  { value: 'TEC',  label: 'TEC' },
  { value: 'OTRO', label: 'OTRO' },
];

/** Color visual para cada tipo según convención IRAM / AEA */
const COLOR_DEFAULT: Partial<Record<TipoCircuito, string>> = {
  IUG:  '#F5A623',
  IUE:  '#E67E22',
  TUG:  '#4A90D9',
  TUE:  '#2980B9',
  ACU:  '#8E44AD',
  MBT:  '#27AE60',
  MBTF: '#16A085',
  TEC:  '#C0392B',
  OTRO: '#7F8C8D',
};

export function CircuitoCard({ circuito: c, index, onChange, onRemove }: CircuitoCardProps) {
  const badgeStyle: React.CSSProperties = {
    display: 'inline-block',
    width: 10,
    height: 10,
    borderRadius: '50%',
    background: c.color || COLOR_DEFAULT[c.tipo] || '#999',
    marginRight: 6,
    verticalAlign: 'middle',
  };

  return (
    <Card
      idx={`C${index + 1}`}
      idxColor="var(--accent)"
      title={c.nombre}
      badge={c.tipo}
      onRemove={onRemove}
      defaultOpen={false}
    >
      <div className="field-row">
        <F label="Nombre / ID">
          <input
            type="text"
            value={c.nombre}
            onChange={e => onChange({ ...c, nombre: e.target.value })}
            placeholder="TS1.C1"
            title="Convenio: {tablero}.{número} – ej: TS1.C1, TD1.C3"
          />
        </F>
        <F label="Tipo AEA">
          <select
            value={c.tipo}
            onChange={e => {
              const tipo = e.target.value as TipoCircuito;
              onChange({ ...c, tipo, color: c.color || COLOR_DEFAULT[tipo] || '#999' });
            }}
          >
            {TIPO_CIRCUITO_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </F>
      </div>

      <div className="field-row">
        <F label="Sección conductor (mm²)">
          <select
            value={String(c.seccion)}
            onChange={e => onChange({ ...c, seccion: parseFloat(e.target.value) })}
          >
            {[1.5, 2.5, 4, 6, 10, 16, 25].map(s => (
              <option key={s} value={String(s)}>{s} mm²</option>
            ))}
          </select>
        </F>
        <F label="Cant. conductores">
          <NumInput
            value={c.cantConductores ?? 2}
            onChange={v => onChange({ ...c, cantConductores: Math.max(1, Math.round(v)) })}
          />
        </F>
      </div>

      <div className="field-row">
        <F label="Protección">
          <input
            type="text"
            value={c.proteccion}
            onChange={e => onChange({ ...c, proteccion: e.target.value })}
            placeholder="16A TM"
            title="Ej: 10A TM, 16A TM+DR, 20A IA"
          />
        </F>
        <F label="Conducto">
          <input
            type="text"
            value={c.conducto || ''}
            onChange={e => onChange({ ...c, conducto: e.target.value })}
            placeholder="Ej: Caño PVC 20mm"
          />
        </F>
      </div>

      <div className="field-row" style={{ alignItems: 'center' }}>
        <F label="Color en plano">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={badgeStyle} />
            <input
              type="color"
              value={c.color || COLOR_DEFAULT[c.tipo] || '#4A90D9'}
              onChange={e => onChange({ ...c, color: e.target.value })}
              style={{ width: 36, height: 28, border: 'none', padding: 0, cursor: 'pointer', background: 'none' }}
            />
          </div>
        </F>
        <F label="Descripción">
          <input
            type="text"
            value={c.descripcion || ''}
            onChange={e => onChange({ ...c, descripcion: e.target.value })}
            placeholder="Ej: Iluminación dormitorio principal"
          />
        </F>
      </div>
    </Card>
  );
}
