import React from 'react';
import { F } from '../../Field';
import { WallCard } from '../../WallCard';
import { createPared } from '../../../lib/storage';
import { type Ambiente } from '../../../types';

interface WallsTabProps {
  activeAmbiente: Ambiente;
  activeTramoIdx: number;
  setActiveTramoIdx: (idx: number) => void;
  onUpdateAmbiente: (updateFn: (amb: Ambiente) => Ambiente) => void;
}

/**
 * Componente especializado para la gestión de tramos y paredes.
 * Recibe únicamente los datos y callbacks necesarios para su funcionamiento.
 */
export const WallsTab: React.FC<WallsTabProps> = React.memo(({ 
  activeAmbiente, 
  activeTramoIdx, 
  setActiveTramoIdx, 
  onUpdateAmbiente 
}) => {
  const currentTramo = activeAmbiente.tramos[activeTramoIdx];

  if (!currentTramo) return null;

  return (
    <div className="paredes-editor">
      {/* Selector de Tramo Activo e Indicadores */}
      <div className="tramo-controls" style={{ padding: '8px', borderBottom: '1px solid var(--border)', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{ flex: 1 }}>
            <F label="Tramo activo">
              <select 
                className="input-base"
                value={activeTramoIdx} 
                onChange={e => {
                  const idx = Number(e.target.value);
                  if (idx >= 0 && idx < activeAmbiente.tramos.length) {
                    setActiveTramoIdx(idx);
                  }
                }}
              >
                {activeAmbiente.tramos.map((t, i) => (
                  <option key={t.id} value={i}>
                    Tramo {i + 1} ({t.cerrado ? 'cerrado' : 'abierto'})
                  </option>
                ))}
              </select>
            </F>
          </div>
          <div style={{ textAlign: 'right', fontSize: '11px', color: 'var(--text-dim)' }}>
            {activeTramoIdx + 1} de {activeAmbiente.tramos.length}
          </div>
        </div>

        {/* Info del tramo actual */}
        <div style={{ fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className={`status-tag ${currentTramo.cerrado ? 'ok' : 'warn'}`}>
            {currentTramo.cerrado ? '✓ Tramo Cerrado' : '⚠ Tramo Abierto'}
          </span>
          {!currentTramo.cerrado && !currentTramo.amarre && (
            <span style={{ color: 'var(--orange)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              ⚠️ Sin referenciar
            </span>
          )}
        </div>
      </div>

      {/* Lista de paredes del tramo activo */}
      <div>
        {currentTramo.paredes.map((w, i) => (
          <WallCard
            key={w.id}
            pared={w}
            index={i}
            isLast={i === currentTramo.paredes.length - 1}
            onChange={(nw) => onUpdateAmbiente(a => {
              const nts = [...a.tramos];
              const nps = [...nts[activeTramoIdx].paredes];
              nps[i] = nw;
              nts[activeTramoIdx] = { ...nts[activeTramoIdx], paredes: nps };
              return { ...a, tramos: nts };
            })}
            onRemove={() => onUpdateAmbiente(a => {
              const nts = [...a.tramos];
              const nps = nts[activeTramoIdx].paredes.filter((_, j) => j !== i);
              nts[activeTramoIdx] = { ...nts[activeTramoIdx], paredes: nps };
              return { ...a, tramos: nts };
            })}
          />
        ))}
        <button 
          className="btn btn-ghost btn-sm btn-full" 
          style={{ marginTop: '8px' }} 
          onClick={() => onUpdateAmbiente(a => {
            const nts = [...a.tramos];
            nts[activeTramoIdx] = { ...nts[activeTramoIdx], paredes: [...nts[activeTramoIdx].paredes, createPared()] };
            return { ...a, tramos: nts };
          })}
        >
          + Agregar pared al tramo {activeTramoIdx + 1}
        </button>
      </div>
    </div>
  );
});
