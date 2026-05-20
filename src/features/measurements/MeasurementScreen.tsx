// ═══════════════════════════════════════════════════════════════════════════
// MODULE: screens/MeasurementScreen.tsx
// Orchestrator thin del feature de mediciones eléctricas.
// Delega toda la presentación y lógica a features/measurements/.
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentProject } from '../../core/ProjectContext';
import { useProfile } from '../../core/ProfileContext';
import { useMeasurements } from '../../hooks/useMeasurements';
import type { Measurement, ModuleType } from '../../types/index';
import { MeasurementTabs } from './components/MeasurementTabs';
import { MeasurementList } from './components/MeasurementList';
import { MeasurementForm } from './components/MeasurementForm';
import { useMeasurementForm } from './hooks/useMeasurementForm';
import { useEntityOptions } from './hooks/useEntityOptions';
import { MEDICION_CONFIG } from './constants';;
import './MeasurementScreen.css';

export function MeasurementScreen() {
  const navigate = useNavigate();
  const { activeProject } = useCurrentProject();
  const { profile } = useProfile();

  const projectId = activeProject.id;
  const operador = profile?.displayName || profile?.email || 'Sin operador';

  const measurementState = useMeasurements(projectId);
  const { measurements, addMeasurement, updateMeasurement, deleteMeasurement, isLoading } = measurementState;

  const [activeType, setActiveType] = useState<ModuleType>('puesta_tierra');
  const [showForm, setShowForm] = useState(false);

  const entityOptions = useEntityOptions();
  const form = useMeasurementForm({
    projectId,
    operador,
    onAdd: addMeasurement,
    onUpdate: updateMeasurement,
  });

  const filtered = useMemo(
    () => measurements.filter(m => m.moduleType === activeType),
    [measurements, activeType]
  );

  const editingMeasurement = useMemo(
    () => (form.editingId ? measurements.find(m => m.id === form.editingId) || null : null),
    [form.editingId, measurements]
  );

  const handleTypeChange = useCallback(
    (type: ModuleType) => {
      setActiveType(type);
      form.cancel();
      setShowForm(false);
    },
    [form]
  );

  const handleNew = useCallback(() => {
    form.startNew(activeType);
    setShowForm(true);
  }, [form, activeType]);

  const handleEdit = useCallback(
    (m: Measurement) => {
      form.startEdit(m);
      setActiveType(m.moduleType);
      setShowForm(true);
    },
    [form]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      if (confirm('¿Eliminar esta medición?')) await deleteMeasurement(id);
    },
    [deleteMeasurement]
  );

  const handleFormSubmit = useCallback(
    async (formElement: HTMLFormElement) => {
      await form.submit(activeType, formElement);
      if (form.editingId) {
        setShowForm(false);
      }
    },
    [form, activeType]
  );

  const handleCancel = useCallback(() => {
    form.cancel();
    setShowForm(false);
  }, [form]);

  const cfg = MEDICION_CONFIG[activeType];

  return (
    <div className="screen-measurements">
      <div className="screen-measurements__header">
        <div className="screen-measurements__header-left">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/')}>
            ← Volver
          </button>
          <h1 className="screen-measurements__title">Mediciones Eléctricas</h1>
          <span className="screen-measurements__subtitle">
            {measurements.length} registros · {activeProject.nombre} · Operador: {operador}
          </span>
        </div>
        <div className="screen-measurements__header-right">
          <button className="btn btn-acc" onClick={handleNew} disabled={showForm && !editingMeasurement}>
            + Nueva medición
          </button>
        </div>
      </div>

      <MeasurementTabs activeType={activeType} onChange={handleTypeChange} measurements={measurements} />

      {showForm && (
        <div className="measurement-form-modal-overlay">
          <div className="measurement-form-modal-header">
            <h3 className="measurement-form-modal-title">
              {editingMeasurement ? 'Editar' : 'Nueva'} medición — {cfg.label}
            </h3>
            <button className="btn btn-ghost btn-sm" onClick={handleCancel}>✕</button>
          </div>
          <MeasurementForm
            type={activeType}
            editingMeasurement={editingMeasurement}
            instrumentos={profile?.instrumentos}
            entityOptions={entityOptions}
            isSubmitting={form.isSubmitting}
            onSubmit={handleFormSubmit}
            onCancel={handleCancel}
          />
        </div>
      )}

      <button className="fab-new-measurement" onClick={handleNew} title="Nueva medición">
        +
      </button>

      <MeasurementList
        measurements={filtered}
        activeTypeLabel={cfg.label}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}
