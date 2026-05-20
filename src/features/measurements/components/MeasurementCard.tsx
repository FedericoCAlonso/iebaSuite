// ═══════════════════════════════════════════════════════════════════════════
// MODULE: features/measurements/components/MeasurementCard.tsx
// Tarjeta individual de medición con campos dinámicos según tipo.
// ═══════════════════════════════════════════════════════════════════════════

import React from 'react';
import type { Measurement } from '../../../types/index';
import { MEDICION_CONFIG, RESULTADO_COLORS, RESULTADO_LABELS, CARD_FIELD_EXTRACTORS } from '../constants';

interface Props {
  measurement: Measurement;
  onEdit: (m: Measurement) => void;
  onDelete: (id: string) => void;
}

export const MeasurementCard: React.FC<Props> = ({ measurement, onEdit, onDelete }) => {
  const cfg = MEDICION_CONFIG[measurement.moduleType];
  const fields = CARD_FIELD_EXTRACTORS[measurement.moduleType];
  const color = RESULTADO_COLORS[measurement.resultado];

  return (
    <div className="measurement-card">
      <div className="measurement-card__header">
        <div className="measurement-card__type">
          {cfg.icon} {cfg.label}
          {measurement.elementoId && <span style={{ color: 'var(--text3)', marginLeft: 6, fontSize: 11 }}>· vinculado</span>}
        </div>
        <div
          className="measurement-card__result"
          style={{
            background: `${color}20`,
            color: color,
            border: `1px solid ${color}40`,
          }}
        >
          {RESULTADO_LABELS[measurement.resultado]}
        </div>
      </div>

      <div className="measurement-card__body">
        <div className="measurement-card__field">
          <span className="measurement-card__label">Ubicación</span>
          <span className="measurement-card__value">{measurement.ubicacion || '—'}</span>
        </div>

        {fields.map(f => {
          const val = f.get(measurement);
          if (val == null || val === '') return null;
          return (
            <div className="measurement-card__field" key={f.label}>
              <span className="measurement-card__label">{f.label}</span>
              <span className="measurement-card__value">{val}</span>
            </div>
          );
        })}

        <div className="measurement-card__field">
          <span className="measurement-card__label">Fecha</span>
          <span className="measurement-card__value">
            {new Date(measurement.timestamp).toLocaleString('es-AR')}
          </span>
        </div>
      </div>

      <div className="measurement-card__actions">
        <button className="btn btn-ghost btn-xs" onClick={() => onEdit(measurement)} type="button">
          ✏️
        </button>
        <button className="btn btn-danger btn-xs" onClick={() => onDelete(measurement.id)} type="button">
          ✕
        </button>
      </div>
    </div>
  );
};
