// ═══════════════════════════════════════════════════════════════════════════
// MODULE: features/measurements/hooks/useMeasurementForm.ts
// Lógica de estado y construcción de payload del formulario de mediciones.
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useCallback } from 'react';
import type { Measurement, MeasurementBase, ResultadoMedicion, ModuleType, TipoDiferencial } from '../../../types/index';


interface UseMeasurementFormOptions {
  projectId: string;
  operador: string;
  onAdd: (m: Omit<MeasurementBase, 'id' | 'timestamp'> & Partial<Measurement>) => Promise<Measurement | void>;
  onUpdate: (id: string, updates: Partial<Measurement>) => Promise<void>;
}

interface UseMeasurementFormReturn {
  editingId: string | null;
  editingMeasurement: Measurement | null;
  startNew: (type: ModuleType) => void;
  startEdit: (m: Measurement) => void;
  cancel: () => void;
  submit: (type: ModuleType, formElement: HTMLFormElement) => Promise<void>;
  isSubmitting: boolean;
}

function parseNum(v: FormDataEntryValue | null, fallback = 0): number {
  const n = parseFloat(String(v || ''));
  return Number.isFinite(n) ? n : fallback;
}

function parseOptNum(v: FormDataEntryValue | null): number | undefined {
  const s = String(v || '').trim();
  if (!s) return undefined;
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : undefined;
}

function parseBool(v: FormDataEntryValue | null): boolean {
  return v === 'on' || v === 'true';
}

function parseString(v: FormDataEntryValue | null): string {
  return String(v || '');
}

/** Builders declarativos: cada tipo sabe cómo armar su payload parcial */
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

export function useMeasurementForm({ projectId, operador, onAdd, onUpdate }: UseMeasurementFormOptions): UseMeasurementFormReturn {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const startNew = useCallback((_type: ModuleType) => {
    setEditingId(null);
  }, []);

  const startEdit = useCallback((m: Measurement) => {
    setEditingId(m.id);
  }, []);

  const cancel = useCallback(() => {
    setEditingId(null);
  }, []);

  const submit = useCallback(
    async (activeType: ModuleType, formElement: HTMLFormElement) => {
      const fd = new FormData(formElement);

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
