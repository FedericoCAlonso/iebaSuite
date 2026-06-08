// ═══════════════════════════════════════════════════════════════════════════
// MODULE: features/measurements/constants.ts
// Constantes y configuración declarativa por tipo de medición.
// Fuente única de verdad para etiquetas, colores, campos de formulario y
// entidades vinculables de cada módulo de medición eléctrica.
// ═══════════════════════════════════════════════════════════════════════════

import type {
  Measurement,
  MeasurementTierra,
  MeasurementDiferencial,
  MeasurementContinuidad,
  MeasurementLazo,
  MeasurementCortocircuito,
  MeasurementAislacion,
  MeasurementCalidadPotencia,
  ResultadoMedicion,
  ModuleType,
} from '../../types/index';

// ─── COLORES Y ETIQUETAS DE RESULTADO ───

/**
 * Color de fondo o badge asociado a cada resultado de medición.
 * Los valores son colores HEX compatibles con Tailwind y SVG.
 */
export const RESULTADO_COLORS: Record<ResultadoMedicion, string> = {
  aprobado: '#10b981',
  observado: '#f59e0b',
  rechazado: '#ef4444',
  no_aplica: '#6b7280',
};

/**
 * Etiquetas legibles en español para cada resultado de medición.
 * Usadas en selectores de formulario y badges de tarjeta.
 */
export const RESULTADO_LABELS: Record<ResultadoMedicion, string> = {
  aprobado: 'Aprobado',
  observado: 'Observado',
  rechazado: 'Rechazado',
  no_aplica: 'No aplica',
};

// ─── CONFIGURACIÓN POR TIPO DE MEDICIÓN ───

/**
 * Configuración declarativa de un tipo de módulo de medición.
 */
export interface TipoMedicionConfig {
  /** Nombre legible del tipo de medición */
  label: string;
  /** Emoji o ícono representativo */
  icon: string;
  /** Unidad de medida principal mostrada en la tarjeta resumen */
  unidadDefault: string;
  /** Nombres de los campos que el formulario debe renderizar para este tipo */
  campos: string[];
  /** Entidades del proyecto a las que puede vincularse esta medición */
  entityKind: 'elemento' | 'circuito' | 'diferencial' | 'tablero' | 'none';
  /** Filtro de tipo de elemento por regex (solo si entityKind === 'elemento') */
  elementoFilter?: RegExp;
}

/**
 * Configuración completa de todos los módulos de medición disponibles.
 * Cada entrada define cómo se presenta y vincula ese tipo de medición
 * dentro del proyecto.
 */
export const MEDICION_CONFIG: Record<ModuleType, TipoMedicionConfig> = {
  puesta_tierra: {
    label: 'Puesta a tierra',
    icon: '⚡',
    unidadDefault: 'Ω',
    campos: ['Categoría', 'Resistencia (Ω)', 'Método', 'Interconexión'],
    // No se vincula a una entidad específica; es una medición de instalación global
    entityKind: 'none',
  },
  diferencial: {
    label: 'Diferencial',
    icon: '⏱',
    unidadDefault: 'ms',
    campos: ['Tiempo disparo (ms)', 'Corriente disparo (mA)', 'Sensibilidad (mA)', 'Tensión prueba (V)'],
    entityKind: 'diferencial',
  },
  continuidad_masas: {
    label: 'Continuidad de masas',
    icon: '🔗',
    unidadDefault: 'Ω',
    campos: ['Resistencia (Ω)', 'Corriente prueba (A)', 'Referencia (Ω)'],
    entityKind: 'elemento',
    // Solo aplica a bocas, tomas, interruptores y luminarias (masas de elementos)
    elementoFilter: /boca|toma|interruptor|luminaria/i,
  },
  resistencia_lazo: {
    label: 'Resistencia de lazo',
    icon: '➰',
    unidadDefault: 'Ω',
    campos: ['Impedancia (Ω)', 'Corriente prospectiva (A)', 'Tensión red (V)'],
    entityKind: 'elemento',
    elementoFilter: /boca|toma|interruptor|luminaria/i,
  },
  corriente_cortocircuito: {
    label: 'Corriente de cortocircuito',
    icon: '💥',
    unidadDefault: 'A',
    campos: ['Icc (A)', 'Impedancia Z1 (Ω)', 'Impedancia Zref (Ω)', 'Método'],
    entityKind: 'elemento',
    // Incluye tableros además de los elementos comunes de boca/toma
    elementoFilter: /boca|toma|interruptor|luminaria|tablero/i,
  },
  resistencia_aislacion: {
    label: 'Resistencia de aislación',
    icon: '🛡️',
    unidadDefault: 'MΩ',
    campos: ['Resistencia (MΩ)', 'Tensión prueba (V)', 'Temp. ambiente (°C)', 'Humedad relativa (%)'],
    // Se vincula a un circuito completo, no a un elemento puntual
    entityKind: 'circuito',
  },

  calidad_potencia: {
    label: 'Calidad de potencia',
    icon: '📊',
    unidadDefault: '%',
    campos: ['P (W)', 'Q (VAr)', 'S (VA)', 'THD V (%)', 'THD I (%)', 'Factor de potencia'],
    entityKind: 'circuito',
  },
};

/** Lista ordenada de todos los tipos de módulo disponibles */
export const TIPOS_MEDICION = Object.keys(MEDICION_CONFIG) as ModuleType[];

// ─── EXTRACTORES DE CAMPOS PARA TARJETAS RESUMEN ───

/**
 * Define qué campos mostrar en la tarjeta resumen de cada tipo de medición,
 * con su etiqueta y una función de extracción tipada sobre el objeto `Measurement`.
 * Esto permite que el componente de tarjeta sea genérico y no sepa nada
 * de la estructura interna de cada subtipo.
 */
export const CARD_FIELD_EXTRACTORS: Record<
  ModuleType,
  { label: string; get: (m: Measurement) => string | number | undefined }[]
> = {
  puesta_tierra: [
    { label: 'Categoría', get: m => (m as MeasurementTierra).categoria },
    { label: 'Resistencia', get: m => (m as MeasurementTierra).resistenciaOhm + ' Ω' },
    { label: 'Método',      get: m => (m as MeasurementTierra).metodo },
  ],
  diferencial: [
    { label: 'Tiempo disparo',    get: m => (m as MeasurementDiferencial).tiempoDisparoms + ' ms' },
    { label: 'Corriente disparo', get: m => (m as MeasurementDiferencial).corrienteDisparomA + ' mA' },
  ],
  continuidad_masas: [
    { label: 'Resistencia',      get: m => (m as MeasurementContinuidad).resistenciaOhm + ' Ω' },
    { label: 'Corriente prueba', get: m => (m as MeasurementContinuidad).corrientePruebaA + ' A' },
  ],
  resistencia_lazo: [
    { label: 'Impedancia',    get: m => (m as MeasurementLazo).impedanciaOhm + ' Ω' },
    { label: 'I prospectiva', get: m => (m as MeasurementLazo).corrienteProspectivaA + ' A' },
  ],
  corriente_cortocircuito: [
    { label: 'Icc',    get: m => (m as MeasurementCortocircuito).corrienteIccA + ' A' },
    { label: 'Método', get: m => (m as MeasurementCortocircuito).metodo },
  ],
  resistencia_aislacion: [
    { label: 'R aislamiento',  get: m => (m as MeasurementAislacion).resistenciaMOhm + ' MΩ' },
    { label: 'Tensión prueba', get: m => (m as MeasurementAislacion).tensionPruebaV + ' V' },
  ],

  calidad_potencia: [
    { label: 'THD V', get: m => {
      const v = (m as MeasurementCalidadPotencia).thdVPercent;
      return v != null ? v + ' %' : undefined;
    }},
    { label: 'Factor potencia', get: m => (m as MeasurementCalidadPotencia).factorPotencia },
  ],
};
