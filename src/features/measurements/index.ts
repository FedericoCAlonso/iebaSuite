// ═══════════════════════════════════════════════════════════════════════════
// MODULE: features/measurements/index.ts
// Barrel export del feature de mediciones.
// ═══════════════════════════════════════════════════════════════════════════

export { MeasurementTabs } from './components/MeasurementTabs';
export { MeasurementList } from './components/MeasurementList';
export { MeasurementCard } from './components/MeasurementCard';
export { MeasurementForm } from './components/MeasurementForm';
export { useMeasurementForm } from './hooks/useMeasurementForm';
export { useEntityOptions } from './hooks/useEntityOptions';
export { MEDICION_CONFIG, RESULTADO_COLORS, RESULTADO_LABELS, TIPOS_MEDICION, CARD_FIELD_EXTRACTORS } from './constants';
export type { TipoMedicionConfig } from './constants';
