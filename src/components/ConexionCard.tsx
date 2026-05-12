// ═══════════════════════════════════════════════════════════════════════════
// MODULE: components/ConexionCard.tsx
// Tarjeta para editar una conexión (netlist) entre dos elementos eléctricos.
// ═══════════════════════════════════════════════════════════════════════════

import { Card } from './Card';
import { F } from './Field';
import type { Conexion, Ambiente, Circuito } from '../types';

interface ConexionCardProps {
  conexion: Conexion;
  index: number;
  ambientes: Ambiente[];
  circuitos: Circuito[];
  onChange: (c: Conexion) => void;
  onRemove: () => void;
}

export function ConexionCard({ conexion: c, index, ambientes, circuitos, onChange, onRemove }: ConexionCardProps) {
  // Helpers para renderizar las opciones agrupadas por ambiente
  const elementOptions = ambientes.map(a => (
    <optgroup key={a.id} label={`Hoja: ${a.nombre}`}>
      {(a.elementos || []).map(el => (
        <option key={el.id} value={`${a.id}|${el.id}`}>
          {el.referencia ? `${el.referencia} (${el.tipo})` : el.tipo}
        </option>
      ))}
    </optgroup>
  ));

  const getNameFromId = (ambId: string, elId: string) => {
    const amb = ambientes.find(a => a.id === ambId);
    const el = amb?.elementos.find(e => e.id === elId);
    if (!el) return '?';
    return el.referencia ? `${el.referencia} (${amb?.nombre})` : `${el.tipo} (${amb?.nombre})`;
  };

  return (
    <Card
      idx={`X${index + 1}`}
      idxColor="var(--green)"
      title={`Conexión: ${getNameFromId(c.from.ambienteId, c.from.elementoId)} ➔ ${getNameFromId(c.to.ambienteId, c.to.elementoId)}`}
      onRemove={onRemove}
      defaultOpen={true}
    >
      <div className="field-row">
        <F label="Desde (Origen)">
          <select
            value={c.from.elementoId ? `${c.from.ambienteId}|${c.from.elementoId}` : ''}
            onChange={e => {
              const [aId, elId] = e.target.value.split('|');
              onChange({ ...c, from: { ambienteId: aId, elementoId: elId } });
            }}
          >
            <option value="">— Seleccionar —</option>
            {elementOptions}
          </select>
        </F>
        <F label="Hasta (Destino)">
          <select
            value={c.to.elementoId ? `${c.to.ambienteId}|${c.to.elementoId}` : ''}
            onChange={e => {
              const [aId, elId] = e.target.value.split('|');
              onChange({ ...c, to: { ambienteId: aId, elementoId: elId } });
            }}
          >
            <option value="">— Seleccionar —</option>
            {elementOptions}
          </select>
        </F>
      </div>

      <div className="field-row">
        <F label="Circuito (opcional)">
          <select
            value={c.circuitoId || ''}
            onChange={e => onChange({ ...c, circuitoId: e.target.value || undefined })}
          >
            <option value="">— Sin especificar —</option>
            {circuitos.map(circ => (
              <option key={circ.id} value={circ.id}>
                {circ.nombre} ({circ.tipo})
              </option>
            ))}
          </select>
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

      <div className="field-row">
        <F label="Descripción">
          <input
            type="text"
            value={c.descripcion || ''}
            onChange={e => onChange({ ...c, descripcion: e.target.value })}
            placeholder="Ej: Retorno de luz"
          />
        </F>
      </div>
      
      {/* TODO: Más adelante podemos agregar UI para editar la lista de `c.cables` */}
      <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
        Contiene {c.cables?.length || 0} conductores. (Edición detallada de cables próximamente).
      </div>
    </Card>
  );
}
