// ═══════════════════════════════════════════════════════════════════════════
// MODULE: features/measurements/components/fields/ContinuidadFields.tsx
// ═══════════════════════════════════════════════════════════════════════════

import React from 'react';
import { F } from '../../../../ui/Field';

interface Props {
  defaults?: Record<string, any>;
}

export const ContinuidadFields: React.FC<Props> = ({ defaults = {} }) => (
  <>
    <F label="Resistencia (Ω)">
      <input type="number" inputMode="decimal" step="0.001" name="resistenciaOhm" defaultValue={defaults.resistenciaOhm ?? ''} required />
    </F>
    <F label="Corriente de prueba (A)">
      <input type="number" inputMode="decimal" name="corrientePruebaA" defaultValue={defaults.corrientePruebaA ?? 25} />
    </F>
    <F label="Referencia esperada (Ω)">
      <input type="number" inputMode="decimal" step="0.001" name="referenciaOhm" defaultValue={defaults.referenciaOhm ?? ''} />
    </F>
  </>
);
