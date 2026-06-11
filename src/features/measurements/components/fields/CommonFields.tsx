// ═══════════════════════════════════════════════════════════════════════════
// MODULE: features/measurements/components/fields/CommonFields.tsx
// Campos comunes a todos los tipos de medición + selector de entidad.
// ORDEN MOBILE-FIRST: Resultado → Ubicación/Entidad → Campos admin
// ═══════════════════════════════════════════════════════════════════════════

import React from 'react';
import { F } from '../../../../ui/Field';
import type { Measurement, ResultadoMedicion } from '../../../../types/index';
import type { EntityOption } from '../../hooks/useEntityOptions';

interface ResultLocationFieldsProps {
  editingMeasurement: Measurement | null;
  initialData?: Partial<Measurement>;
  entityOptions?: EntityOption[];
  entityLabel?: string;
  showEntitySelect?: boolean;
  entityName?: string;
}

interface AdminFieldsProps {
  editingMeasurement: Measurement | null;
  initialData?: Partial<Measurement>;
  instrumentos?: { id: string; marca: string; modelo: string; nroSerie: string }[];
}

const RESULTADO_OPTIONS: { value: ResultadoMedicion; label: string; emoji: string }[] = [
  { value: 'aprobado',  label: 'Aprobado',  emoji: '✓' },
  { value: 'observado', label: 'Observado', emoji: '!' },
  { value: 'rechazado', label: 'Rechazado', emoji: '✕' },
  { value: 'no_aplica', label: 'N/A',       emoji: '—' },
];

export const ResultLocationFields: React.FC<ResultLocationFieldsProps> = ({
  editingMeasurement,
  initialData,
  entityOptions = [],
  entityLabel = 'Entidad vinculada',
  showEntitySelect = false,
  entityName = 'elementoId',
}) => {
  const defaultResultado = editingMeasurement?.resultado || initialData?.resultado || 'aprobado';
  const defaultUbicacion = editingMeasurement?.ubicacion || initialData?.ubicacion || '';
  const defaultEntity = editingMeasurement?.elementoId
    || editingMeasurement?.circuitoId
    || editingMeasurement?.diferencialId
    || editingMeasurement?.tableroId
    || initialData?.elementoId
    || initialData?.circuitoId
    || initialData?.diferencialId
    || initialData?.tableroId
    || '';

  return (
    <>
      {/* ── 1. RESULTADO: primero y prominente ── */}
      <div className="measurement-card__field mf-span-full">
        <div className="measurement-card__label" style={{ marginBottom: 6 }}>Resultado *</div>
        <div className="semaphore-group">
          {RESULTADO_OPTIONS.map(r => (
            <label key={r.value} className="semaphore-label">
              <input type="radio" name="resultado" value={r.value} defaultChecked={defaultResultado === r.value} />
              <div className="semaphore-btn" data-val={r.value}>
                <span className="semaphore-emoji">{r.emoji}</span>
                <span>{r.label}</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* ── 2. UBICACIÓN ── */}
      <F label="Ubicación / Punto de medición *">
        <input name="ubicacion" defaultValue={defaultUbicacion} required placeholder="Ej: Jabalina patio trasero" />
      </F>

      {/* ── 3. ENTIDAD VINCULADA (si aplica) ── */}
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
    </>
  );
};

export const AdminFields: React.FC<AdminFieldsProps> = ({
  editingMeasurement,
  initialData,
  instrumentos = [],
}) => {
  const defaultObs = editingMeasurement?.observaciones || initialData?.observaciones || '';
  const defaultInst = editingMeasurement?.instrumentoId || initialData?.instrumentoId || '';
  const defaultError = editingMeasurement?.errorMedicion || initialData?.errorMedicion || '';

  // Convertir timestamp a YYYY-MM-DDThh:mm para el input datetime-local
  const defaultFechaISO = editingMeasurement?.fecha
    ? new Date(editingMeasurement.fecha - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
    : new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);

  return (
    <>
      {/* ── 4. FECHA Y HORA ── */}
      <F label="Fecha y Hora de Medición *">
        <input type="datetime-local" name="fechaISO" defaultValue={defaultFechaISO} required />
      </F>

      {/* ── 5. CAMPOS ADMIN (instrumento, error, observaciones) ── */}
      <F label="Instrumento usado">
        <select name="instrumentoId" defaultValue={defaultInst}>
          <option value="">Sin instrumento registrado</option>
          {instrumentos.map(inst => (
            <option key={inst.id} value={inst.id}>{inst.marca} {inst.modelo} — S/N {inst.nroSerie}</option>
          ))}
        </select>
      </F>

      <F label="Error de medición">
        <input name="errorMedicion" defaultValue={defaultError} placeholder="Ej: ± 2% + 3d (opcional)" />
      </F>

      <div style={{ gridColumn: '1 / -1' }}>
        <F label="Observaciones">
          <textarea
            name="observaciones"
            rows={2}
            style={{ width: '100%' }}
            defaultValue={defaultObs}
            placeholder="Notas adicionales, condiciones ambientales, etc."
          />
        </F>
      </div>
    </>
  );
};
