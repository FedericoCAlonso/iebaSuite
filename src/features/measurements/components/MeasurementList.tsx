// ═══════════════════════════════════════════════════════════════════════════
// MODULE: features/measurements/components/MeasurementList.tsx
// ═══════════════════════════════════════════════════════════════════════════

import React from 'react';
import type { Measurement } from '../../../types/index';
import { MeasurementCard } from './MeasurementCard';

interface Props {
  measurements: Measurement[];
  activeTypeLabel: string;
  isLoading: boolean;
  onEdit: (m: Measurement) => void;
  onDelete: (id: string) => void;
}

export const MeasurementList: React.FC<Props> = ({
  measurements,
  activeTypeLabel,
  isLoading,
  onEdit,
  onDelete,
}) => {
  if (isLoading) {
    return <div className="screen-measurements__empty">Cargando…</div>;
  }

  if (measurements.length === 0) {
    return (
      <div className="screen-measurements__empty">
        <div style={{ fontSize: 40, marginBottom: 12 }}>📏</div>
        <strong>Sin mediciones de {activeTypeLabel}</strong>
        <p style={{ color: 'var(--text3)', marginTop: 4 }}>
          Agregá la primera medición con el botón "+ Nueva medición".
        </p>
      </div>
    );
  }

  return (
    <div className="measurement-list">
      {measurements.map(m => (
        <MeasurementCard key={m.id} measurement={m} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
};
