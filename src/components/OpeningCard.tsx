// ═══════════════════════════════════════════════════════════════════════════
// MODULE: components/OpeningCard.tsx
// ═══════════════════════════════════════════════════════════════════════════
import React from 'react';
import { NumInput } from './NumImput';
import { Card } from './Card';
import { F } from './Field';
import { type Abertura, type Ambiente, type SubtipoPuerta, type SubtipoVentana } from '../types';

interface OpeningCardProps {
  ab: Abertura;
  index: number;
  wallCount: number;
  /** Lista de ambientes del proyecto para vincular abertura al ambiente vecino */
  ambientes: Ambiente[];
  activeAmbienteId: string;
  onLinkOpening?: (targetAmbId: string, targetOpeningId: string, currentOpeningId: string) => void;
  onChange: (ab: Abertura) => void;
  onRemove: () => void;
}

const SUBTIPO_PUERTA: { value: SubtipoPuerta; label: string }[] = [
  { value: 'batiente',  label: 'Batiente (abatible)' },
  { value: 'corrediza', label: 'Corrediza' },
  { value: 'vaiven',    label: 'Vaivén' },
  { value: 'pivotante', label: 'Pivotante' },
];

const SUBTIPO_VENTANA: { value: SubtipoVentana; label: string }[] = [
  { value: 'abatible',  label: 'Abatible / De abrir' },
  { value: 'corrediza', label: 'Corrediza' },
  { value: 'guillotina',label: 'Guillotina' },
  { value: 'pivotante', label: 'Pivotante' },
  { value: 'fija',      label: 'Fija (paño fijo)' },
];

/** Título descriptivo según tipo y subtipo */
function buildTitle(ab: Abertura): string {
  const tipo = ab.tipo ? ab.tipo.charAt(0).toUpperCase() + ab.tipo.slice(1) : 'Abertura';
  const subtipo = ab.subtipo ? ` · ${ab.subtipo}` : '';
  return `${tipo}${subtipo} · Pared ${ab.pared}`;
}

export function OpeningCard({ 
  ab, index, wallCount, ambientes, activeAmbienteId, onLinkOpening, onChange, onRemove 
}: OpeningCardProps) {
  // Ambientes disponibles para vincular (todos excepto el actual)
  const otrosAmbientes = ambientes.filter(a => a.id !== activeAmbienteId);

  return (
    <Card
      idx={`A${index}`} idxColor="var(--blue)"
      title={buildTitle(ab)}
      badge={`${ab.ancho || '?'}m`}
      onRemove={onRemove}
    >
      <div style={{ marginBottom: '12px', borderBottom: '1px solid var(--border-dim)', paddingBottom: '8px' }}>
         <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
           ID: {ab.id} {ab.esPrincipal === false && '(Esclava)'}
         </span>
      </div>
      {/* Fila: tipo + subtipo */}
      <div className="field-row">
        <F label="Tipo">
          <select
            value={ab.tipo || 'puerta'}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              onChange({ ...ab, tipo: e.target.value as Abertura['tipo'], subtipo: undefined })
            }
          >
            <option value="puerta">Puerta</option>
            <option value="ventana">Ventana</option>
            <option value="vano">Vano</option>
          </select>
        </F>
        {ab.tipo === 'puerta' && (
          <F label="Subtipo">
            <select
              value={ab.subtipo || 'batiente'}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                onChange({ ...ab, subtipo: e.target.value as SubtipoPuerta })
              }
            >
              {SUBTIPO_PUERTA.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </F>
        )}
        {ab.tipo === 'ventana' && (
          <F label="Subtipo">
            <select
              value={ab.subtipo || 'abatible'}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                onChange({ ...ab, subtipo: e.target.value as SubtipoVentana })
              }
            >
              {SUBTIPO_VENTANA.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </F>
        )}
        <F label="Pared #">
          <NumInput
            value={ab.pared || 0}
            onChange={(v: number) => onChange({ ...ab, pared: Math.max(0, Math.min(wallCount - 1, Math.round(v))) })}
          />
        </F>
      </div>

      {/* Fila: posición + ancho */}
      <div className="field-row">
        <F label="Posición (m)">
          <NumInput value={ab.posicion || 0} onChange={(v: number) => onChange({ ...ab, posicion: v })} />
        </F>
        <F label="Ancho (m)">
          <NumInput value={ab.ancho || 0.9} onChange={(v: number) => onChange({ ...ab, ancho: v })} />
        </F>
      </div>

      {/* Propiedades de puerta batiente / pivotante / vaivén */}
      {ab.tipo === 'puerta' && (!ab.subtipo || ab.subtipo === 'batiente' || ab.subtipo === 'pivotante' || ab.subtipo === 'vaiven') && (
        <div className="field-row">
          <F label="Hojas">
            <select
              value={ab.hojas || 1}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange({ ...ab, hojas: parseInt(e.target.value) })}
            >
              <option value={1}>Simple</option>
              <option value={2}>Doble</option>
            </select>
          </F>
          <F label="Abre hacia">
            <select
              value={ab.lado || 'interior'}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange({ ...ab, lado: e.target.value })}
            >
              <option value="interior">Interior</option>
              <option value="exterior">Exterior</option>
            </select>
          </F>
          <F label="Sentido">
            <select
              value={ab.sentido || 'derecha'}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange({ ...ab, sentido: e.target.value })}
            >
              <option value="derecha">Derecha</option>
              <option value="izquierda">Izquierda</option>
            </select>
          </F>
        </div>
      )}

      {/* Hoja vecina (para puertas entre hojas) */}
      {otrosAmbientes.length > 0 && (
        <div style={{ borderTop: '1px solid var(--border-dim)', marginTop: '12px', paddingTop: '12px' }}>
          {ab.ambienteVecinoId ? (
            <div className="status-tag ok" style={{ fontSize: '11px', display: 'inline-block' }}>
              🔗 Vinculada a: {ambientes.find(a => a.id === ab.ambienteVecinoId)?.nombre || '?'}
              <button 
                className="btn btn-danger btn-sm" 
                style={{ marginLeft: '8px', padding: '0 4px' }}
                onClick={() => onChange({ ...ab, ambienteVecinoId: undefined, aberturaVecinaId: undefined, esPrincipal: undefined })}
              >✕</button>
            </div>
          ) : (
            <F label="Vincular a abertura existente en otra hoja">
              <select
                value=""
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) return;
                  const [ambId, opId] = val.split('|');
                  onLinkOpening?.(ambId, opId, ab.id);
                }}
              >
                <option value="">— Seleccionar abertura para vincular —</option>
                {otrosAmbientes.map(amb => {
                  const available = (amb.aberturas || []).filter(o => !o.ambienteVecinoId);
                  if (available.length === 0) return null;
                  return (
                    <optgroup key={amb.id} label={amb.nombre}>
                      {available.map(o => (
                        <option key={o.id} value={`${amb.id}|${o.id}`}>
                          {o.tipo} ({o.ancho}m) en Pared {o.pared}
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
            </F>
          )}
        </div>
      )}
    </Card>
  );
}