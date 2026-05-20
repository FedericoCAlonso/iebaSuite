// ═══════════════════════════════════════════════════════════════════════════
// MODULE: features/measurements/components/fields/CortocircuitoFields.tsx
// ═══════════════════════════════════════════════════════════════════════════

import React from 'react';
import { F } from '../../../../ui/Field';

interface Props {
  defaults?: Record<string, any>;
}

export const CortocircuitoFields: React.FC<Props> = ({ defaults = {} }) => (
  <>
    <F label="Método">
      <select name="metodo" defaultValue={defaults.metodo || 'impedancia'}>
        <option value="impedancia">Por impedancia</option>
        <option value="directa">Directa</option>
      </select>
    </F>
    <F label="Icc (A)">
      <input type="number" inputMode="decimal" name="corrienteIccA" defaultValue={defaults.corrienteIccA ?? ''} required />
    </F>
    <F label="Z₁ (Ω)">
      <input type="number" inputMode="decimal" step="0.01" name="impedanciaZ1Ohm" defaultValue={defaults.impedanciaZ1Ohm ?? ''} />
    </F>
    <F label="Zref (Ω)">
      <input type="number" inputMode="decimal" step="0.01" name="impedanciaZrefOhm" defaultValue={defaults.impedanciaZrefOhm ?? ''} />
    </F>
  </>
);
