// ═══════════════════════════════════════════════════════════════════════════
// MODULE: features/measurements/components/fields/LazoFields.tsx
// ═══════════════════════════════════════════════════════════════════════════

import React from 'react';
import { F } from '../../../../ui/Field';

interface Props {
  defaults?: Record<string, any>;
}

export const LazoFields: React.FC<Props> = ({ defaults = {} }) => (
  <>
    <F label="Impedancia Zloop (Ω)">
      <input type="number" inputMode="decimal" step="0.01" name="impedanciaOhm" defaultValue={defaults.impedanciaOhm ?? ''} required />
    </F>
    <F label="Corriente prospectiva (A)">
      <input type="number" inputMode="decimal" name="corrienteProspectivaA" defaultValue={defaults.corrienteProspectivaA ?? ''} />
    </F>
    <F label="Tensión de red (V)">
      <input type="number" inputMode="decimal" name="tensionRedV" defaultValue={defaults.tensionRedV ?? 230} />
    </F>
  </>
);
