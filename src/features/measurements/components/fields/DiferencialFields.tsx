// ═══════════════════════════════════════════════════════════════════════════
// MODULE: features/measurements/components/fields/DiferencialFields.tsx
// ═══════════════════════════════════════════════════════════════════════════

import React from 'react';
import { F } from '../../../../ui/Field';

interface Props {
  defaults?: Record<string, any>;
}

export const DiferencialFields: React.FC<Props> = ({ defaults = {} }) => (
  <>
    <F label="Tipo">
      <select name="tipo" defaultValue={defaults.tipo || 'ac'}>
        <option value="ac">AC</option>
        <option value="a">A</option>
        <option value="f">F</option>
        <option value="b">B</option>
      </select>
    </F>
    <F label="Sensibilidad nominal (mA)">
      <input type="number" inputMode="decimal" name="sensibilidadNominalmA" defaultValue={defaults.sensibilidadNominalmA ?? 30} />
    </F>
    <F label="Tiempo de disparo (ms)">
      <input type="number" inputMode="decimal" step="0.1" name="tiempoDisparoms" defaultValue={defaults.tiempoDisparoms ?? ''} required />
    </F>
    <F label="Corriente de disparo (mA)">
      <input type="number" inputMode="decimal" step="0.1" name="corrienteDisparomA" defaultValue={defaults.corrienteDisparomA ?? ''} />
    </F>
    <F label="Tensión de prueba (V)">
      <input type="number" inputMode="decimal" name="tensionPruebaV" defaultValue={defaults.tensionPruebaV ?? 230} />
    </F>
    <F label="Funciona manualmente">
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
        <input type="checkbox" name="funcionaManual" defaultChecked={defaults.funcionaManual ?? true} />
        Sí, el botón de test acciona correctamente
      </label>
    </F>
  </>
);
