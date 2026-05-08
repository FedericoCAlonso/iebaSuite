// ═══════════════════════════════════════════════════════════════════════════
// MODULE: components/WallCard.tsx
// ═══════════════════════════════════════════════════════════════════════════

import { useState } from 'react';
import { Card } from './Card';
import { F } from './Field';
import { NumInput } from './NumImput';
import type { Pared, Irregularidad } from '../types';

interface WallCardProps {
  pared: Pared;
  index: number;
  onChange: (pared: Pared) => void;
  onRemove: () => void;
}

export function WallCard({ pared, index, onChange, onRemove }: WallCardProps) {
  const [openIrr, setOpenIrr] = useState(false);

  // Formateo de títulos para la cabecera de la tarjeta
  const largoText = pared.largo === 'auto' ? 'AUTO' : pared.largo ? `${pared.largo}m` : '0m';
  const angText = pared.angulo != null ? `${pared.angulo}°` : '90°';

  /**
   * Helper para actualizar irregularidades de forma inmutable
   */
  const updateIrrs = (newIrrs: Irregularidad[]) => {
    onChange({ ...pared, irregularidades: newIrrs });
  };

  /**
   * Maneja el cambio en el largo, permitiendo el valor especial 'auto'
   */
  const handleLargoChange = (val: string) => {
    const cleanVal = val.toLowerCase().trim();
    if (cleanVal === 'auto') {
      onChange({ ...pared, largo: 'auto' });
    } else {
      const num = parseFloat(cleanVal);
      onChange({ ...pared, largo: isNaN(num) ? 0 : num });
    }
  };

  return (
    <Card
      idx={`P${index}`}
      title={`${largoText} / ${angText}`}
      badge={pared.grosor ? `g: ${pared.grosor}m` : 'g: def.'}
      onRemove={onRemove}
    >
      {/* Geometría Básica */}
      <div className="field-row">
        <F label="Largo (m o 'auto')">
          <input
            className="input-base"
            value={pared.largo ?? ''}
            onChange={(e) => handleLargoChange(e.target.value)}
            placeholder="ej: 3.50 o auto"
          />
        </F>
        <F label="Ángulo de inicio (°)">
          <NumInput 
            value={pared.angulo ?? 90} 
            onChange={(v) => onChange({ ...pared, angulo: v })} 
            placeholder="90"
          />
        </F>
      </div>

      <div className="field-row">
        <F label="Grosor específico (m)">
          <NumInput 
            value={pared.grosor ?? 0} 
            onChange={(v) => onChange({ ...pared, grosor: v || null })} 
            placeholder="heredar"
          />
        </F>
        <F label="Mocheta/Saliente (m)">
          <NumInput
            value={pared.esquina_saliente?.ancho ?? 0}
            onChange={(v) => onChange({ 
              ...pared, 
              esquina_saliente: v ? { ancho: v } : null 
            })}
            placeholder="0.00"
          />
        </F>
      </div>

      {/* Sección de Irregularidades (Columnas, Nichos, Mojinetes) */}
      <div className="sub-card" style={{ marginTop: '8px' }}>
        <div 
          className={`card-hdr-sub ${openIrr ? 'open' : ''}`} 
          onClick={() => setOpenIrr(!openIrr)}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: '4px' }}
        >
          <span style={{ fontSize: '11px', fontWeight: 'bold', flex: 1 }}>
            Irregularidades (Columnas/Nichos)
          </span>
          <span className="card-badge-small">{(pared.irregularidades || []).length}</span>
          <span style={{ fontSize: '10px', transform: openIrr ? 'rotate(90deg)' : 'none', transition: '0.2s' }}>
            ▶
          </span>
        </div>

        {openIrr && (
          <div className="sub-card-body" style={{ padding: '8px 0' }}>
            {(pared.irregularidades || []).map((irr, j) => (
              <div key={j} className="irr-row" style={{ display: 'flex', gap: '4px', marginBottom: '8px', alignItems: 'flex-end' }}>
                <span style={{ fontSize: '10px', color: 'var(--text3)', width: '15px' }}>i{j}</span>
                
                <F label="Pos(m)">
                  <NumInput 
                    value={irr.posicion} 
                    onChange={(v) => {
                      const a = [...pared.irregularidades];
                      a[j] = { ...irr, posicion: v };
                      updateIrrs(a);
                    }} 
                  />
                </F>
                
                <F label="Ancho">
                  <NumInput 
                    value={irr.ancho} 
                    onChange={(v) => {
                      const a = [...pared.irregularidades];
                      a[j] = { ...irr, ancho: v };
                      updateIrrs(a);
                    }} 
                  />
                </F>
                
                <F label="Prof(+/-)">
                  <NumInput 
                    value={irr.profundidad} 
                    onChange={(v) => {
                      const a = [...pared.irregularidades];
                      a[j] = { ...irr, profundidad: v };
                      updateIrrs(a);
                    }} 
                  />
                </F>

                <button 
                  className="btn btn-danger btn-xs" 
                  onClick={() => {
                    const a = pared.irregularidades.filter((_, idx) => idx !== j);
                    updateIrrs(a);
                  }}
                >✕</button>
              </div>
            ))}
            
            <button 
              className="btn btn-ghost btn-sm btn-full" 
              onClick={() => updateIrrs([
                ...(pared.irregularidades || []), 
                { posicion: 0, ancho: 0.20, profundidad: 0.15 }
              ])}
            >
              + Agregar columna/nicho
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}