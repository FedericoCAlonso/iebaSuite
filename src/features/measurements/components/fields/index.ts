// ═══════════════════════════════════════════════════════════════════════════
// MODULE: features/measurements/components/fields/index.ts
// Registro de componentes de campos específicos por tipo de medición.
// ═══════════════════════════════════════════════════════════════════════════

import React from 'react';
import type { ModuleType } from '../../../../types/index';
import { PuestaTierraFields } from './PuestaTierraFields';
import { DiferencialFields } from './DiferencialFields';
import { ContinuidadFields } from './ContinuidadFields';
import { LazoFields } from './LazoFields';
import { CortocircuitoFields } from './CortocircuitoFields';
import { AislacionFields } from './AislacionFields';
import { CalidadPotenciaFields } from './CalidadPotenciaFields';

export const TYPE_FIELDS: Record<ModuleType, React.FC<{ defaults?: Record<string, any> }>> = {
  puesta_tierra: PuestaTierraFields,
  diferencial: DiferencialFields,
  continuidad_masas: ContinuidadFields,
  resistencia_lazo: LazoFields,
  corriente_cortocircuito: CortocircuitoFields,
  resistencia_aislacion: AislacionFields,
  calidad_potencia: CalidadPotenciaFields,
};
