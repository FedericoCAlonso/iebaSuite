// ═══════════════════════════════════════════════════════════════════════════
// MODULE: features/measurements/components/MeasurementTabs.tsx
// Tabs de selección de tipo de medición con contadores.
// ═══════════════════════════════════════════════════════════════════════════

import React from 'react';
import type { Measurement, ModuleType } from '../../../types/index';
import { MEDICION_CONFIG, TIPOS_MEDICION } from '../constants';

interface Props {
  activeType: ModuleType;
  onChange: (type: ModuleType) => void;
  measurements: Measurement[];
}

export const MeasurementTabs: React.FC<Props> = ({ activeType, onChange, measurements }) => {
  return (
    <div className="screen-measurements__tabs">
      {TIPOS_MEDICION.map(t => {
        const cfg = MEDICION_CONFIG[t];
        const count = measurements.filter(m => m.moduleType === t).length;
        return (
          <button
            key={t}
            className={`screen-measurements__tab ${activeType === t ? 'active' : ''}`}
            onClick={() => onChange(t)}
            type="button"
          >
            <span>{cfg.icon}</span>
            <span>{cfg.label}</span>
            {count > 0 && <span className="screen-measurements__tab-badge">{count}</span>}
          </button>
        );
      })}
    </div>
  );
};
