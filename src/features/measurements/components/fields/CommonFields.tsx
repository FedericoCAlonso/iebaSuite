// ═══════════════════════════════════════════════════════════════════════════
// MODULE: features/measurements/components/fields/CommonFields.tsx
// Campos comunes a todos los tipos de medición + selector de entidad.
// ═══════════════════════════════════════════════════════════════════════════

import React from 'react';
import { F } from '../../../../ui/Field';
import type { Measurement, ResultadoMedicion } from '../../../../types/index';
import type { EntityOption } from '../../hooks/useEntityOptions';

interface CommonFieldsProps {
  editingMeasurement: Measurement | null;
  initialData?: Partial<Measurement>;
  instrumentos?: { id: string; marca: string; modelo: string; nroSerie: string }[];
  entityOptions?: EntityOption[];
  entityLabel?: string;
  showEntitySelect?: boolean;
  /** name del input para la entidad vinculada (elementoId|circuitoId|diferencialId|tableroId) */
  entityName?: string;
}

const RESULTADO_OPTIONS: { value: ResultadoMedicion; label: string }[] = [
  { value: 'aprobado', label: 'Aprobado' },
  { value: 'observado', label: 'Observado' },
  { value: 'rechazado', label: 'Rechazado' },
  { value: 'no_aplica', label: 'No aplica' },
];

export const CommonFields: React.FC<CommonFieldsProps> = ({
  editingMeasurement,
  initialData,
  instrumentos = [],
  entityOptions = [],
  entityLabel = 'Entidad vinculada',
  showEntitySelect = false,
  entityName = 'elementoId',
}) => {
  const defaultResultado = editingMeasurement?.resultado || initialData?.resultado || 'aprobado';
  const defaultUbicacion = editingMeasurement?.ubicacion || initialData?.ubicacion || '';
  const defaultObs = editingMeasurement?.observaciones || initialData?.observaciones || '';
  const defaultInst = editingMeasurement?.instrumentoId || initialData?.instrumentoId || '';
  const defaultEntity = editingMeasurement?.elementoId
    || editingMeasurement?.circuitoId
    || editingMeasurement?.diferencialId
    || editingMeasurement?.tableroId
    || initialData?.elementoId
    || initialData?.circuitoId
    || initialData?.diferencialId
    || initialData?.tableroId
    || '';
  const defaultError = editingMeasurement?.errorMedicion || initialData?.errorMedicion || '';
  
  // Convertir timestamp a YYYY-MM-DDThh:mm para el input datetime-local
  const defaultFechaISO = editingMeasurement?.fecha 
    ? new Date(editingMeasurement.fecha - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
    : new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);

  return (
    <>
      {showEntitySelect && (
        <F label={entityLabel}>
          <select name={entityName} defaultValue={defaultEntity}>
            <option value="">Sin vincular (ubicación libre)</option>
            {entityOptions.map(opt => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </select>
        </F>
      )}

      <F label="Ubicación / Punto de medición">
        <input name="ubicacion" defaultValue={defaultUbicacion} required placeholder="Ej: Jabalina patio trasero" />
      </F>

      <F label="Fecha y Hora de Medición">
        <input type="datetime-local" name="fechaISO" defaultValue={defaultFechaISO} required />
      </F>

      <div className="measurement-card__field" style={{ gridColumn: '1 / -1' }}>
        <div className="measurement-card__label" style={{ marginBottom: 4 }}>Resultado</div>
        <div className="semaphore-group">
          {RESULTADO_OPTIONS.map(r => (
            <label key={r.value} className="semaphore-label">
              <input type="radio" name="resultado" value={r.value} defaultChecked={defaultResultado === r.value} />
              <div className="semaphore-btn" data-val={r.value}>{r.label}</div>
            </label>
          ))}
        </div>
      </div>

      <F label="Instrumento usado">
        <select name="instrumentoId" defaultValue={defaultInst}>
          <option value="">Sin instrumento registrado</option>
          {instrumentos.map(inst => (
            <option key={inst.id} value={inst.id}>{inst.marca} {inst.modelo} — S/N {inst.nroSerie}</option>
          ))}
        </select>
      </F>

      <F label="Error de medición">
        <input name="errorMedicion" defaultValue={defaultError} placeholder="Ej: ± 2% + 3d o ±0.5Ω (opcional)" />
      </F>

      <F label="Observaciones">
        <textarea
          name="observaciones"
          rows={2}
          style={{ width: '100%' }}
          defaultValue={defaultObs}
          placeholder="Notas adicionales, condiciones ambientales, etc."
        />
      </F>
    </>
  );
};
