// ═══════════════════════════════════════════════════════════════════════════
// MODULE: components/ConexionCard.tsx
// Tarjeta para editar una conexión (netlist) entre dos elementos eléctricos.
// ═══════════════════════════════════════════════════════════════════════════

import { Card } from '../../../ui/Card';
import { F } from '../../../ui/Field';
import type { Conexion, Ambiente, Circuito, Project, ElementoElectrico } from '../../../types/index';
import { calcularLongitudOrtogonal } from '../../../lib/electrical/calculations';

interface ConexionCardProps {
  conexion: Conexion;
  index: number;
  project: Project;
  circuitos: Circuito[];
  onChange: (c: Conexion) => void;
  onRemove: () => void;
}

export function ConexionCard({ conexion: c, index, project, circuitos, onChange, onRemove }: ConexionCardProps) {
  const ambientes = project.ambientes;
  
  // Helpers para renderizar las opciones agrupadas por ambiente
  const elementOptions = ambientes.map((a: Ambiente) => (
    <optgroup key={a.id} label={`Hoja: ${a.nombre}`}>
      {(a.elementos || []).map((el: ElementoElectrico) => (
        <option key={el.id} value={`${a.id}|${el.id}`}>
          {el.referencia ? `${el.referencia} (${el.tipo})` : el.tipo}
        </option>
      ))}
    </optgroup>
  ));

  const getNameFromId = (ambId: string, elId: string) => {
    const amb = ambientes.find((a: Ambiente) => a.id === ambId);
    const el = amb?.elementos.find((e: ElementoElectrico) => e.id === elId);
    if (!el) return '?';
    return el.referencia ? `${el.referencia} (${amb?.nombre})` : `${el.tipo} (${amb?.nombre})`;
  };

  const longitudAuto = calcularLongitudOrtogonal(project, c.from.ambienteId, c.from.elementoId, c.to.ambienteId, c.to.elementoId);


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
        <F label="Circuitos">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '4px 0' }}>
            {circuitos.map(circ => {
              const checked = (c.circuitosIds || []).includes(circ.id);
              return (
                <label key={circ.id} style={{ display: 'flex', alignItems: 'center', fontSize: 12, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      let newIds = [...(c.circuitosIds || [])];
                      if (e.target.checked) newIds.push(circ.id);
                      else newIds = newIds.filter(id => id !== circ.id);
                      onChange({ ...c, circuitosIds: newIds });
                    }}
                    style={{ marginRight: 4 }}
                  />
                  {circ.nombre}
                </label>
              );
            })}
            {circuitos.length === 0 && <span style={{fontSize:11, color:'var(--text-dim)'}}>No hay circuitos</span>}
          </div>
        </F>
      </div>

      <div className="field-row">
        <F label="Tipo">
          <select
            value={c.tipoConducto || 'cano_rigido'}
            onChange={e => onChange({ ...c, tipoConducto: e.target.value as any })}
          >
            <option value="cano_rigido">Caño Rígido</option>
            <option value="bandeja">Bandeja Portacables</option>
            <option value="canaleta">Canaleta / Cablecanal</option>
            <option value="enterrado">Enterrado</option>
            <option value="otro">Otro</option>
          </select>
        </F>
        <F label="Descripción">
          <input
            type="text"
            value={c.conducto || ''}
            onChange={e => onChange({ ...c, conducto: e.target.value })}
            placeholder="Ej: RL 20mm"
          />
        </F>
      </div>

      <div className="field-row">
        <F label="Longitud manual (m)">
          <input
            type="number"
            step="0.1"
            min="0"
            value={c.origenLongitud === 'declarada' ? (c.seccionConduccion || '') : ''} // Usando seccionConduccion temporalmente para la longitudDeclarada, idealmente agregaremos `longitudDeclarada` al modelo o asuminmos que es eso.
            onChange={e => {
              const val = parseFloat(e.target.value);
              if (isNaN(val)) {
                 onChange({ ...c, origenLongitud: undefined, seccionConduccion: undefined });
              } else {
                 onChange({ ...c, origenLongitud: 'declarada', seccionConduccion: val });
              }
            }}
            placeholder={longitudAuto !== null ? `Auto: ${longitudAuto.toFixed(2)}m` : 'Ej: 5.5'}
          />
        </F>
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
