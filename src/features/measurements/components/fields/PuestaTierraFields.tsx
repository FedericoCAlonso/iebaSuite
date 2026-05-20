// ═══════════════════════════════════════════════════════════════════════════
// MODULE: features/measurements/components/fields/PuestaTierraFields.tsx
// ═══════════════════════════════════════════════════════════════════════════

import React from 'react';
import { F } from '../../../../ui/Field';

interface Props {
  defaults?: Record<string, any>;
}

export const PuestaTierraFields: React.FC<Props> = ({ defaults = {} }) => (
  <>
    <F label="Categoría de Puesta a Tierra">
      <select name="categoria" defaultValue={defaults.categoria || 'seguridad'}>
        <option value="principal">Principal / Equipotencial (Seguridad, Descargas, Medicinal)</option>
        <option value="funcional_independiente">Funcional / Servicio (Independiente)</option>
      </select>
    </F>
    <F label="Método de Medición">
      <select name="metodo" defaultValue={defaults.metodo || 'caida_de_tension'}>
        <option value="caida_de_tension">Caída de Tensión</option>
        <option value="dos_puntas">Dos Puntas (cota superior)</option>
      </select>
    </F>
    <F label="Resistencia (Ω)">
      <input type="number" inputMode="decimal" step="0.01" name="resistenciaOhm" defaultValue={defaults.resistenciaOhm ?? ''} required />
    </F>
    <F label="Interconexión Hacia">
      <input name="interconexionHacia" defaultValue={defaults.interconexionHacia || ''} placeholder="Ej: Anillo con jabalina frente, Estrella barra ppal" />
    </F>
    <F label="Humedad suelo (%)">
      <input type="number" inputMode="decimal" name="humedadSuelo" defaultValue={defaults.humedadSuelo ?? ''} />
    </F>
  </>
);
