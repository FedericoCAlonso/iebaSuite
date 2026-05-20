// ═══════════════════════════════════════════════════════════════════════════
// MODULE: features/measurements/components/MeasurementForm.tsx
// Formulario inline de medición con flujo rápido "Guardar y siguiente".
// ═══════════════════════════════════════════════════════════════════════════

import React, { useRef, useCallback } from 'react';
import type { Measurement, ModuleType } from '../../../types/index';
import type { EntityOptions } from '../hooks/useEntityOptions';
import { MEDICION_CONFIG } from '../constants';
import { CommonFields } from './fields/CommonFields';
import { TYPE_FIELDS } from './fields';

interface Props {
  type: ModuleType;
  editingMeasurement: Measurement | null;
  instrumentos?: { id: string; marca: string; modelo: string; nroSerie: string }[];
  entityOptions: EntityOptions | null;
  isSubmitting: boolean;
  onSubmit: (form: HTMLFormElement) => Promise<void> | void;
  onCancel: () => void;
}

function getEntityMeta(type: ModuleType) {
  const cfg = MEDICION_CONFIG[type];
  switch (cfg.entityKind) {
    case 'elemento':
      return { name: 'elementoId', label: 'Elemento (boca, toma, etc.)' };
    case 'circuito':
      return { name: 'circuitoId', label: 'Circuito' };
    case 'diferencial':
      return { name: 'diferencialId', label: 'Diferencial' };
    case 'tablero':
      return { name: 'tableroId', label: 'Tablero' };
    default:
      return null;
  }
}

export const MeasurementForm: React.FC<Props> = ({
  type,
  editingMeasurement,
  instrumentos,
  entityOptions,
  isSubmitting,
  onSubmit,
  onCancel,
}) => {
  const formRef = useRef<HTMLFormElement>(null);
  const SpecificFields = TYPE_FIELDS[type];
  const entityMeta = getEntityMeta(type);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (formRef.current) await onSubmit(formRef.current);
    },
    [onSubmit]
  );

  const handleSaveAndNext = useCallback(async () => {
    if (!formRef.current) return;
    await onSubmit(formRef.current);
    if (editingMeasurement) return;

    const form = formRef.current;
    const keep = new Set(['resultado', 'instrumentoId']);
    Array.from(form.elements).forEach((el) => {
      const name = (el as HTMLInputElement).name;
      if (name && !keep.has(name)) {
        if (el instanceof HTMLInputElement && el.type !== 'checkbox' && el.type !== 'hidden') {
          el.value = '';
        }
        if (el instanceof HTMLTextAreaElement) {
          el.value = '';
        }
        if (el instanceof HTMLSelectElement && name !== 'resultado' && name !== 'instrumentoId') {
          el.selectedIndex = 0;
        }
      }
    });
  }, [onSubmit, editingMeasurement]);

  const defaults = editingMeasurement
    ? { ...editingMeasurement } as Record<string, unknown>
    : {};

  return (
    <div className="measurement-form-wrapper">
      <form ref={formRef} onSubmit={handleSubmit}>
        <div className="measurement-form__grid">
          <CommonFields
            editingMeasurement={editingMeasurement}
            instrumentos={instrumentos}
            showEntitySelect={!!entityMeta}
            entityLabel={entityMeta?.label}
            entityName={entityMeta?.name}
            entityOptions={
              entityMeta && entityOptions
                ? entityMeta.name === 'elementoId'
                  ? entityOptions.elementos
                  : entityMeta.name === 'circuitoId'
                  ? entityOptions.circuitos
                  : entityMeta.name === 'diferencialId'
                  ? entityOptions.diferenciales
                  : entityMeta.name === 'tableroId'
                  ? entityOptions.tableros
                  : []
                : []
            }
          />
          <SpecificFields defaults={defaults} />
        </div>

        <div className="dialog-actions" style={{ marginTop: 20 }}>
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            {editingMeasurement ? 'Cancelar edición' : 'Cerrar formulario'}
          </button>
          {!editingMeasurement && (
            <button type="button" className="btn btn-ghost" onClick={handleSaveAndNext} disabled={isSubmitting}>
              Guardar y siguiente →
            </button>
          )}
          <button type="submit" className="btn btn-acc" disabled={isSubmitting}>
            {editingMeasurement ? 'Guardar cambios' : 'Registrar medición'}
          </button>
        </div>
      </form>
    </div>
  );
};
