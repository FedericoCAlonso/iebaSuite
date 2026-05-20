// ═══════════════════════════════════════════════════════════════════════════
// MODULE: features/measurements/components/fields/CalidadPotenciaFields.tsx
// ═══════════════════════════════════════════════════════════════════════════

import React from 'react';
import { F } from '../../../../ui/Field';

interface Props {
  defaults?: Record<string, any>;
}

export const CalidadPotenciaFields: React.FC<Props> = ({ defaults = {} }) => (
  <>
    <F label="THD V (%)">
      <input type="number" inputMode="decimal" step="0.01" name="thdVPercent" defaultValue={defaults.thdVPercent ?? ''} />
    </F>
    <F label="THD I (%)">
      <input type="number" inputMode="decimal" step="0.01" name="thdIPercent" defaultValue={defaults.thdIPercent ?? ''} />
    </F>
    <F label="Factor de potencia">
      <input type="number" inputMode="decimal" step="0.001" min={-1} max={1} name="factorPotencia" defaultValue={defaults.factorPotencia ?? ''} />
    </F>
    <F label="Tensión (V)">
      <input type="number" inputMode="decimal" name="tensionVN" defaultValue={defaults.tensionVN ?? ''} />
    </F>
    <F label="Corriente (A)">
      <input type="number" inputMode="decimal" name="corrienteAN" defaultValue={defaults.corrienteAN ?? ''} />
    </F>
    <F label="P. Activa (W)">
      <input type="number" inputMode="decimal" name="potenciaActivaW" defaultValue={defaults.potenciaActivaW ?? ''} />
    </F>
    <F label="P. Reactiva (VAr)">
      <input type="number" inputMode="decimal" name="potenciaReactivaVAr" defaultValue={defaults.potenciaReactivaVAr ?? ''} />
    </F>
    <F label="P. Aparente (VA)">
      <input type="number" inputMode="decimal" name="potenciaAparenteVA" defaultValue={defaults.potenciaAparenteVA ?? ''} />
    </F>
  </>
);
