// ═══════════════════════════════════════════════════════════════════════════
// MODULE: features/measurements/components/fields/AislacionFields.tsx
// ═══════════════════════════════════════════════════════════════════════════

import React from 'react';
import { F } from '../../../../ui/Field';

interface Props {
  defaults?: Record<string, any>;
}

export const AislacionFields: React.FC<Props> = ({ defaults = {} }) => (
  <>
    <F label="Tensión de prueba (V)">
      <select name="tensionPruebaV" defaultValue={defaults.tensionPruebaV ?? 500}>
        <option value={500}>500 V</option>
        <option value={1000}>1000 V</option>
        <option value={2500}>2500 V</option>
      </select>
    </F>
    <F label="Resistencia (MΩ)">
      <input type="number" inputMode="decimal" step="0.01" name="resistenciaMOhm" defaultValue={defaults.resistenciaMOhm ?? ''} required />
    </F>
    <F label="Temp. ambiente (°C)">
      <input type="number" inputMode="decimal" name="temperaturaAmbiente" defaultValue={defaults.temperaturaAmbiente ?? ''} />
    </F>
    <F label="Humedad relativa (%)">
      <input type="number" inputMode="decimal" name="humedadRelativa" defaultValue={defaults.humedadRelativa ?? ''} />
    </F>
  </>
);
