// ═══════════════════════════════════════════════════════════════════════════
// MODULE: features/measurements/hooks/useMeasurementForm.ts
// Lógica de estado y construcción de payload del formulario de mediciones.
// Centraliza el parseo de FormData y la selección del builder correcto
// para cada tipo de módulo, manteniendo los componentes UI sin lógica
// de dominio.
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useCallback } from 'react';
import type { Measurement, MeasurementBase, ResultadoMedicion, ModuleType, TipoDiferencial } from '../../../types/index';

/**
 * Opciones de configuración que recibe el hook al inicializarse.
 */
interface UseMeasurementFormOptions {
  /** ID del proyecto al que pertenecerán las mediciones creadas o editadas. */
  projectId: string;
  /** Nombre o ID del técnico que realiza la medición (se incluye en el payload). */
  operador: string;
  /** Callback invocado al confirmar una nueva medición. */
  onAdd: (m: Omit<MeasurementBase, 'id' | 'timestamp'> & Partial<Measurement>) => Promise<Measurement | void>;
  /** Callback invocado al confirmar la edición de una medición existente. */
  onUpdate: (id: string, updates: Partial<Measurement>) => Promise<void>;
}

/**
 * Interfaz del objeto retornado por el hook.
 */
interface UseMeasurementFormReturn {
  /** ID de la medición en edición, o `null` si se está creando una nueva. */
  editingId: string | null;
  /** Objeto completo de la medición en edición (resuelto externamente si se necesita). */
  editingMeasurement: Measurement | null;
  /** Prepara el formulario para ingresar una nueva medición del tipo indicado. */
  startNew: (type: ModuleType) => void;
  /** Carga una medición existente en el formulario para editarla. */
  startEdit: (m: Measurement) => void;
  /** Cancela la operación en curso y limpia el estado. */
  cancel: () => void;
  /** Lee el `HTMLFormElement`, construye el payload y llama a `onAdd` u `onUpdate`. */
  submit: (type: ModuleType, formElement: HTMLFormElement) => Promise<void>;
  /** `true` mientras se ejecuta la operación de guardado asíncrono. */
  isSubmitting: boolean;
}

// ─── HELPERS DE PARSEO DE FORMDATA ───

/**
 * Parsea un valor de `FormData` como número.
 * @param v Valor raw del campo.
 * @param fallback Valor por defecto si el parseo falla (default: 0).
 */
function parseNum(v: FormDataEntryValue | null, fallback = 0): number {
  const n = parseFloat(String(v || ''));
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Parsea un valor de `FormData` como número opcional.
 * Retorna `undefined` si el campo está vacío o no es un número válido.
 * @param v Valor raw del campo.
 */
function parseOptNum(v: FormDataEntryValue | null): number | undefined {
  const s = String(v || '').trim();
  if (!s) return undefined;
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Parsea un valor de `FormData` como booleano.
 * Retorna `true` si el valor es `'on'` (checkbox marcado) o `'true'`.
 * @param v Valor raw del campo.
 */
function parseBool(v: FormDataEntryValue | null): boolean {
  return v === 'on' || v === 'true';
}

/**
 * Parsea un valor de `FormData` como string.
 * Nunca retorna `null`; usa cadena vacía como fallback.
 * @param v Valor raw del campo.
 */
function parseString(v: FormDataEntryValue | null): string {
  return String(v || '');
}

// ─── BUILDERS POR TIPO DE MÓDULO ───

/**
 * Builders declarativos: cada clave sabe cómo armar el payload parcial
 * específico de su tipo de medición a partir del `FormData` y la base común.
 * Permite que `submit` sea agnóstico al tipo de módulo activo.
 */
const BUILDERS: Record<
  ModuleType,
  (fd: FormData, base: Partial<MeasurementBase>) => Partial<Measurement>
> = {
  puesta_tierra: (fd, base) => ({
    ...base,
    moduleType: 'puesta_tierra',
    metodo: parseString(fd.get('metodo')) as 'caida_de_tension' | 'dos_puntas',
    categoria: parseString(fd.get('categoria')) as 'principal' | 'funcional_independiente',
    interconexionHacia: parseString(fd.get('interconexionHacia')) || undefined,
    resistenciaOhm: parseNum(fd.get('resistenciaOhm')),
    resistenciaSueloOhm: parseOptNum(fd.get('resistenciaSueloOhm')),
    humedadSuelo: parseOptNum(fd.get('humedadSuelo')),
  }),

  diferencial: (fd, base) => ({
    ...base,
    moduleType: 'diferencial',
    tipo: parseString(fd.get('tipo')) as TipoDiferencial,
    sensibilidadNominalmA: parseNum(fd.get('sensibilidadNominalmA'), 30),
    tiempoDisparoms: parseNum(fd.get('tiempoDisparoms')),
    corrienteDisparomA: parseNum(fd.get('corrienteDisparomA')),
    tensionPruebaV: parseNum(fd.get('tensionPruebaV'), 230),
    funcionaManual: parseBool(fd.get('funcionaManual')),
  }),

  continuidad_masas: (fd, base) => ({
    ...base,
    moduleType: 'continuidad_masas',
    resistenciaOhm: parseNum(fd.get('resistenciaOhm')),
    corrientePruebaA: parseNum(fd.get('corrientePruebaA'), 25),
    referenciaOhm: parseOptNum(fd.get('referenciaOhm')),
  }),

  resistencia_lazo: (fd, base) => ({
    ...base,
    moduleType: 'resistencia_lazo',
    impedanciaOhm: parseNum(fd.get('impedanciaOhm')),
    corrienteProspectivaA: parseNum(fd.get('corrienteProspectivaA')),
    tensionRedV: parseNum(fd.get('tensionRedV'), 230),
  }),

  corriente_cortocircuito: (fd, base) => ({
    ...base,
    moduleType: 'corriente_cortocircuito',
    metodo: parseString(fd.get('metodo')) as 'impedancia' | 'directa',
    corrienteIccA: parseNum(fd.get('corrienteIccA')),
    impedanciaZ1Ohm: parseOptNum(fd.get('impedanciaZ1Ohm')),
    impedanciaZrefOhm: parseOptNum(fd.get('impedanciaZrefOhm')),
  }),

  resistencia_aislacion: (fd, base) => ({
    ...base,
    moduleType: 'resistencia_aislacion',
    tensionPruebaV: parseNum(fd.get('tensionPruebaV'), 500),
    resistenciaMOhm: parseNum(fd.get('resistenciaMOhm')),
    temperaturaAmbiente: parseOptNum(fd.get('temperaturaAmbiente')),
    humedadRelativa: parseOptNum(fd.get('humedadRelativa')),
  }),



  calidad_potencia: (fd, base) => ({
    ...base,
    moduleType: 'calidad_potencia',
    potenciaActivaW: parseOptNum(fd.get('potenciaActivaW')),
    potenciaReactivaVAr: parseOptNum(fd.get('potenciaReactivaVAr')),
    potenciaAparenteVA: parseOptNum(fd.get('potenciaAparenteVA')),
    thdVPercent: parseOptNum(fd.get('thdVPercent')),
    thdIPercent: parseOptNum(fd.get('thdIPercent')),
    factorPotencia: parseOptNum(fd.get('factorPotencia')),
    tensionVN: parseOptNum(fd.get('tensionVN')),
    corrienteAN: parseOptNum(fd.get('corrienteAN')),
  }),
};

// ─── HOOK PRINCIPAL ───

/**
 * Hook de gestión del formulario de mediciones eléctricas.
 *
 * Centraliza:
 * - El modo del formulario (crear vs. editar).
 * - El parseo de `FormData` hacia el payload tipado correcto.
 * - La llamada a `onAdd` u `onUpdate` según el modo activo.
 * - La bandera `isSubmitting` para deshabilitar el botón de envío.
 *
 * @param options Configuración del formulario (proyecto, operador y callbacks).
 * @returns Estado del formulario y funciones de control.
 */
export function useMeasurementForm({ projectId, operador, onAdd, onUpdate }: UseMeasurementFormOptions): UseMeasurementFormReturn {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /** Prepara el formulario para una nueva medición (limpia cualquier edición activa). */
  const startNew = useCallback((_type: ModuleType) => {
    setEditingId(null);
  }, []);

  /** Carga una medición existente en el formulario para edición. */
  const startEdit = useCallback((m: Measurement) => {
    setEditingId(m.id);
  }, []);

  /** Cancela la operación en curso y restablece el formulario. */
  const cancel = useCallback(() => {
    setEditingId(null);
  }, []);

  /**
   * Procesa el envío del formulario:
   * 1. Extrae los datos del `HTMLFormElement` como `FormData`.
   * 2. Construye la base común de la medición.
   * 3. Delega al builder del tipo activo para agregar los campos específicos.
   * 4. Llama a `onUpdate` o `onAdd` según haya una edición activa o no.
   *
   * @param activeType Tipo de módulo activo en el formulario.
   * @param formElement Referencia al elemento `<form>` del DOM.
   */
  const submit = useCallback(
    async (activeType: ModuleType, formElement: HTMLFormElement) => {
      const fd = new FormData(formElement);

      // Campos comunes a todos los tipos de medición
      const base: Partial<MeasurementBase> = {
        moduleType: activeType,
        projectId,
        ubicacion: parseString(fd.get('ubicacion')),
        observaciones: parseString(fd.get('observaciones')) || undefined,
        resultado: parseString(fd.get('resultado')) as ResultadoMedicion,
        errorMedicion: parseString(fd.get('errorMedicion')) || undefined,
        operador,
        instrumentoId: parseString(fd.get('instrumentoId')) || undefined,
        fecha: fd.get('fechaISO') ? new Date(fd.get('fechaISO') as string).getTime() : Date.now(),
        elementoId: parseString(fd.get('elementoId')) || undefined,
        circuitoId: parseString(fd.get('circuitoId')) || undefined,
        diferencialId: parseString(fd.get('diferencialId')) || undefined,
        tableroId: parseString(fd.get('tableroId')) || undefined,
        lineaId: parseString(fd.get('lineaId')) || undefined,
        ambienteId: parseString(fd.get('ambienteId')) || undefined,
      };

      const builder = BUILDERS[activeType];
      const payload = builder(fd, base);

      setIsSubmitting(true);
      try {
        if (editingId) {
          await onUpdate(editingId, payload);
          setEditingId(null);
        } else {
          await onAdd(payload as Omit<MeasurementBase, 'id' | 'timestamp'> & Partial<Measurement>);
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [projectId, operador, editingId, onAdd, onUpdate]
  );

  return {
    editingId,
    editingMeasurement: null, // Se resuelve fuera si hace falta
    startNew,
    startEdit,
    cancel,
    submit,
    isSubmitting,
  };
}
