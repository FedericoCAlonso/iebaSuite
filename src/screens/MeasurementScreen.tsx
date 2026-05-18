// ═══════════════════════════════════════════════════════════════════════════
// MODULE: screens/MeasurementScreen.tsx
// Herramienta consolidada de mediciones eléctricas del Hub.
// Soporta: puesta a tierra, diferenciales, continuidad, lazo, cortocircuito,
// aislación, termografía y calidad de potencia.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useProjects } from '../hooks/useProjects';
import { useMeasurements, MEDICION_LABELS } from '../hooks/useMeasurements';
import { useProfile } from '../core/ProfileContext';
import type { Measurement, ResultadoMedicion } from '../types/index';
import { F } from '../components/Field';
import './MeasurementScreen.css';
import './MeasurementScreen.css';

const RESULTADO_COLORS: Record<ResultadoMedicion, string> = {
  aprobado: '#10b981',
  observado: '#f59e0b',
  rechazado: '#ef4444',
  no_aplica: '#6b7280',
};

const RESULTADO_LABELS: Record<ResultadoMedicion, string> = {
  aprobado: 'Aprobado',
  observado: 'Observado',
  rechazado: 'Rechazado',
  no_aplica: 'No aplica',
};

const TIPOS_MEDICION = Object.keys(MEDICION_LABELS) as Measurement['moduleType'][];

export function MeasurementScreen() {
  const navigate = useNavigate();
  const params = useParams<{ projectId?: string }>();
  const { projects } = useProjects();
  const { profile } = useProfile();

  const [selectedProjectId, setSelectedProjectId] = useState(params.projectId || '');
  const [activeType, setActiveType] = useState<Measurement['moduleType']>('puesta_tierra');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const measurementState = useMeasurements(selectedProjectId);
  const { measurements, addMeasurement, updateMeasurement, deleteMeasurement, isLoading } = measurementState;

  const operador = profile?.displayName || profile?.email || 'Sin operador';

  const filtered = useMemo(() =>
    measurements.filter(m => m.moduleType === activeType),
    [measurements, activeType]
  );

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const base = {
      moduleType: activeType,
      projectId: selectedProjectId,
      ubicacion: String(formData.get('ubicacion') || ''),
      observaciones: String(formData.get('observaciones') || ''),
      resultado: String(formData.get('resultado') || 'aprobado') as ResultadoMedicion,
      operador,
      instrumentoId: String(formData.get('instrumentoId') || ''),
    };

    let payload: Partial<Measurement> = base;

    switch (activeType) {
      case 'puesta_tierra':
        payload = {
          ...payload,
          metodo: String(formData.get('metodo') || 'falla_de_potencial') as any,
          resistenciaOhm: parseFloat(String(formData.get('resistenciaOhm'))) || 0,
          distanciaJabalina: parseFloat(String(formData.get('distanciaJabalina'))) || undefined,
          humedadSuelo: parseFloat(String(formData.get('humedadSuelo'))) || undefined,
        };
        break;
      case 'diferencial':
        payload = {
          ...payload,
          tipo: String(formData.get('tipo') || 'ac') as any,
          sensibilidadNominalmA: parseFloat(String(formData.get('sensibilidadNominalmA'))) || 30,
          tiempoDisparoms: parseFloat(String(formData.get('tiempoDisparoms'))) || 0,
          corrienteDisparomA: parseFloat(String(formData.get('corrienteDisparomA'))) || 0,
          tensionPruebaV: parseFloat(String(formData.get('tensionPruebaV'))) || 230,
          funcionaManual: formData.get('funcionaManual') === 'on',
        };
        break;
      case 'continuidad_masas':
        payload = {
          ...payload,
          resistenciaOhm: parseFloat(String(formData.get('resistenciaOhm'))) || 0,
          corrientePruebaA: parseFloat(String(formData.get('corrientePruebaA'))) || 25,
          referenciaOhm: parseFloat(String(formData.get('referenciaOhm'))) || undefined,
        };
        break;
      case 'resistencia_lazo':
        payload = {
          ...payload,
          impedanciaOhm: parseFloat(String(formData.get('impedanciaOhm'))) || 0,
          corrienteProspectivaA: parseFloat(String(formData.get('corrienteProspectivaA'))) || 0,
          tensionRedV: parseFloat(String(formData.get('tensionRedV'))) || 230,
        };
        break;
      case 'corriente_cortocircuito':
        payload = {
          ...payload,
          corrienteIccA: parseFloat(String(formData.get('corrienteIccA'))) || 0,
          impedanciaZ1Ohm: parseFloat(String(formData.get('impedanciaZ1Ohm'))) || undefined,
          impedanciaZrefOhm: parseFloat(String(formData.get('impedanciaZrefOhm'))) || undefined,
          metodo: String(formData.get('metodo') || 'impedancia') as any,
        };
        break;
      case 'resistencia_aislacion':
        payload = {
          ...payload,
          resistenciaMOhm: parseFloat(String(formData.get('resistenciaMOhm'))) || 0,
          tensionPruebaV: parseFloat(String(formData.get('tensionPruebaV'))) || 500,
          temperaturaAmbiente: parseFloat(String(formData.get('temperaturaAmbiente'))) || undefined,
          humedadRelativa: parseFloat(String(formData.get('humedadRelativa'))) || undefined,
        };
        break;
      case 'termografia':
        payload = {
          ...payload,
          temperaturaC: parseFloat(String(formData.get('temperaturaC'))) || 0,
          diferenciaC: parseFloat(String(formData.get('diferenciaC'))) || undefined,
          emisividad: parseFloat(String(formData.get('emisividad'))) || undefined,
        };
        break;
      case 'calidad_potencia':
        payload = {
          ...payload,
          thdVPercent: parseFloat(String(formData.get('thdVPercent'))) || undefined,
          thdIPercent: parseFloat(String(formData.get('thdIPercent'))) || undefined,
          factorPotencia: parseFloat(String(formData.get('factorPotencia'))) || undefined,
          tensionVN: parseFloat(String(formData.get('tensionVN'))) || undefined,
          corrienteAN: parseFloat(String(formData.get('corrienteAN'))) || undefined,
        };
        break;
    }

    if (editingId) {
      await updateMeasurement(editingId, payload);
      setEditingId(null);
    } else {
      await addMeasurement(payload as any);
    }
    setIsFormOpen(false);
    form.reset();
  }, [activeType, selectedProjectId, operador, editingId, addMeasurement, updateMeasurement]);

  const handleEdit = (m: Measurement) => {
    setEditingId(m.id);
    setActiveType(m.moduleType);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Eliminar esta medición?')) await deleteMeasurement(id);
  };

  const editingMeasurement = editingId ? measurements.find(m => m.id === editingId) || null : null;

  return (
    <div className="screen-measurements">
      {/* Header */}
      <div className="screen-measurements__header">
        <div className="screen-measurements__header-left">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/')}>
            ← Volver
          </button>
          <h1 className="screen-measurements__title">Mediciones Eléctricas</h1>
          <span className="screen-measurements__subtitle">
            {measurements.length} registros · Operador: {operador}
          </span>
        </div>
        <div className="screen-measurements__header-right">
          <select
            className="screen-measurements__project-select"
            value={selectedProjectId}
            onChange={e => setSelectedProjectId(e.target.value)}
          >
            <option value="">Seleccionar proyecto…</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.nombre || p.meta?.nombre || 'Sin nombre'}</option>
            ))}
          </select>
          <button
            className="btn btn-acc"
            disabled={!selectedProjectId}
            onClick={() => { setEditingId(null); setIsFormOpen(true); }}
          >
            + Nueva medición
          </button>
        </div>
      </div>

      {!selectedProjectId ? (
        <div className="screen-measurements__empty">
          <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
          <strong>Seleccioná un proyecto</strong>
          <p style={{ color: 'var(--text3)', marginTop: 4 }}>
            Para ver o cargar mediciones, primero elegí un proyecto del listado.
          </p>
        </div>
      ) : (
        <>
          {/* Tabs de tipo */}
          <div className="screen-measurements__tabs">
            {TIPOS_MEDICION.map(t => {
              const cfg = MEDICION_LABELS[t];
              const count = measurements.filter(m => m.moduleType === t).length;
              return (
                <button
                  key={t}
                  className={`screen-measurements__tab ${activeType === t ? 'active' : ''}`}
                  onClick={() => setActiveType(t)}
                >
                  <span>{cfg.icon}</span>
                  <span>{cfg.label}</span>
                  {count > 0 && <span className="screen-measurements__tab-badge">{count}</span>}
                </button>
              );
            })}
          </div>

          {/* Listado */}
          {isLoading ? (
            <div className="screen-measurements__empty">Cargando…</div>
          ) : filtered.length === 0 ? (
            <div className="screen-measurements__empty">
              <div style={{ fontSize: 40, marginBottom: 12 }}>📏</div>
              <strong>Sin mediciones de {MEDICION_LABELS[activeType].label}</strong>
              <p style={{ color: 'var(--text3)', marginTop: 4 }}>
                Agregá la primera medición con el botón "+ Nueva medición".
              </p>
            </div>
          ) : (
            <div className="measurement-list">
              {filtered.map(m => (
                <div key={m.id} className="measurement-card">
                  <div className="measurement-card__header">
                    <div className="measurement-card__type">
                      {MEDICION_LABELS[m.moduleType].icon} {MEDICION_LABELS[m.moduleType].label}
                    </div>
                    <div
                      className="measurement-card__result"
                      style={{ background: `${RESULTADO_COLORS[m.resultado]}20`, color: RESULTADO_COLORS[m.resultado], border: `1px solid ${RESULTADO_COLORS[m.resultado]}40` }}
                    >
                      {RESULTADO_LABELS[m.resultado]}
                    </div>
                  </div>
                  <div className="measurement-card__body">
                    <div className="measurement-card__field">
                      <span className="measurement-card__label">Ubicación</span>
                      <span className="measurement-card__value">{m.ubicacion || '—'}</span>
                    </div>
                    {'resistenciaOhm' in m && (
                      <div className="measurement-card__field">
                        <span className="measurement-card__label">Resistencia</span>
                        <span className="measurement-card__value">{(m as any).resistenciaOhm} Ω</span>
                      </div>
                    )}
                    {'tiempoDisparoms' in m && (
                      <div className="measurement-card__field">
                        <span className="measurement-card__label">Tiempo disparo</span>
                        <span className="measurement-card__value">{(m as any).tiempoDisparoms} ms</span>
                      </div>
                    )}
                    {'corrienteIccA' in m && (
                      <div className="measurement-card__field">
                        <span className="measurement-card__label">Icc</span>
                        <span className="measurement-card__value">{(m as any).corrienteIccA} A</span>
                      </div>
                    )}
                    {'resistenciaMOhm' in m && (
                      <div className="measurement-card__field">
                        <span className="measurement-card__label">R aislamiento</span>
                        <span className="measurement-card__value">{(m as any).resistenciaMOhm} MΩ</span>
                      </div>
                    )}
                    {'temperaturaC' in m && (
                      <div className="measurement-card__field">
                        <span className="measurement-card__label">Temp.</span>
                        <span className="measurement-card__value">{(m as any).temperaturaC} °C</span>
                      </div>
                    )}
                    <div className="measurement-card__field">
                      <span className="measurement-card__label">Fecha</span>
                      <span className="measurement-card__value">
                        {new Date(m.timestamp).toLocaleString('es-AR')}
                      </span>
                    </div>
                  </div>
                  <div className="measurement-card__actions">
                    <button className="btn btn-ghost btn-xs" onClick={() => handleEdit(m)}>✏️</button>
                    <button className="btn btn-danger btn-xs" onClick={() => handleDelete(m.id)}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal de formulario */}
      {isFormOpen && selectedProjectId && (
        <div className="overlay" onClick={() => setIsFormOpen(false)}>
          <div className="dialog dialog--wide" onClick={e => e.stopPropagation()}>
            <div className="dialog-title">
              {editingId ? 'Editar' : 'Nueva'} medición — {MEDICION_LABELS[activeType].label}
            </div>

            <form onSubmit={handleSubmit}>
              <div className="measurement-form__grid">
                <F label="Ubicación / Punto de medición">
                  <input name="ubicacion" defaultValue={editingMeasurement?.ubicacion || ''} required />
                </F>

                <F label="Resultado">
                  <select name="resultado" defaultValue={editingMeasurement?.resultado || 'aprobado'}>
                    <option value="aprobado">Aprobado</option>
                    <option value="observado">Observado</option>
                    <option value="rechazado">Rechazado</option>
                    <option value="no_aplica">No aplica</option>
                  </select>
                </F>

                <F label="Instrumento usado">
                  <select name="instrumentoId" defaultValue={editingMeasurement?.instrumentoId || ''}>
                    <option value="">Sin instrumento registrado</option>
                    {profile?.instrumentos?.map(inst => (
                      <option key={inst.id} value={inst.id}>{inst.marca} {inst.modelo} — S/N {inst.nroSerie}</option>
                    ))}
                  </select>
                </F>

                {/* Campos específicos por tipo */}
                {activeType === 'puesta_tierra' && (
                  <>
                    <F label="Método">
                      <select name="metodo" defaultValue={(editingMeasurement as any)?.metodo || 'falla_de_potencial'}>
                        <option value="falla_de_potencial">Falla de potencial</option>
                        <option value="telecom">Telécom</option>
                        <option value="pinza">Pinza amperimétrica</option>
                        <option value="62%">62% (Wenner)</option>
                      </select>
                    </F>
                    <F label="Resistencia (Ω)">
                      <input type="number" step="0.01" name="resistenciaOhm" defaultValue={(editingMeasurement as any)?.resistenciaOhm || ''} required />
                    </F>
                    <F label="Distancia jabalina (m)">
                      <input type="number" step="0.1" name="distanciaJabalina" defaultValue={(editingMeasurement as any)?.distanciaJabalina || ''} />
                    </F>
                    <F label="Humedad suelo (%)">
                      <input type="number" name="humedadSuelo" defaultValue={(editingMeasurement as any)?.humedadSuelo || ''} />
                    </F>
                  </>
                )}

                {activeType === 'diferencial' && (
                  <>
                    <F label="Tipo">
                      <select name="tipo" defaultValue={(editingMeasurement as any)?.tipo || 'ac'}>
                        <option value="ac">AC</option>
                        <option value="a">A</option>
                        <option value="f">F</option>
                        <option value="b">B</option>
                      </select>
                    </F>
                    <F label="Sensibilidad nominal (mA)">
                      <input type="number" name="sensibilidadNominalmA" defaultValue={(editingMeasurement as any)?.sensibilidadNominalmA || 30} />
                    </F>
                    <F label="Tiempo de disparo (ms)">
                      <input type="number" step="0.1" name="tiempoDisparoms" defaultValue={(editingMeasurement as any)?.tiempoDisparoms || ''} required />
                    </F>
                    <F label="Corriente de disparo (mA)">
                      <input type="number" step="0.1" name="corrienteDisparomA" defaultValue={(editingMeasurement as any)?.corrienteDisparomA || ''} />
                    </F>
                    <F label="Tensión de prueba (V)">
                      <input type="number" name="tensionPruebaV" defaultValue={(editingMeasurement as any)?.tensionPruebaV || 230} />
                    </F>
                    <F label="Funciona manualmente">
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                        <input type="checkbox" name="funcionaManual" defaultChecked={(editingMeasurement as any)?.funcionaManual ?? true} />
                        Sí, el botón de test acciona correctamente
                      </label>
                    </F>
                  </>
                )}

                {activeType === 'continuidad_masas' && (
                  <>
                    <F label="Resistencia (Ω)">
                      <input type="number" step="0.001" name="resistenciaOhm" defaultValue={(editingMeasurement as any)?.resistenciaOhm || ''} required />
                    </F>
                    <F label="Corriente de prueba (A)">
                      <input type="number" name="corrientePruebaA" defaultValue={(editingMeasurement as any)?.corrientePruebaA || 25} />
                    </F>
                    <F label="Referencia esperada (Ω)">
                      <input type="number" step="0.001" name="referenciaOhm" defaultValue={(editingMeasurement as any)?.referenciaOhm || ''} />
                    </F>
                  </>
                )}

                {activeType === 'resistencia_lazo' && (
                  <>
                    <F label="Impedancia Zloop (Ω)">
                      <input type="number" step="0.01" name="impedanciaOhm" defaultValue={(editingMeasurement as any)?.impedanciaOhm || ''} required />
                    </F>
                    <F label="Corriente prospectiva (A)">
                      <input type="number" name="corrienteProspectivaA" defaultValue={(editingMeasurement as any)?.corrienteProspectivaA || ''} />
                    </F>
                    <F label="Tensión de red (V)">
                      <input type="number" name="tensionRedV" defaultValue={(editingMeasurement as any)?.tensionRedV || 230} />
                    </F>
                  </>
                )}

                {activeType === 'corriente_cortocircuito' && (
                  <>
                    <F label="Método">
                      <select name="metodo" defaultValue={(editingMeasurement as any)?.metodo || 'impedancia'}>
                        <option value="impedancia">Por impedancia</option>
                        <option value="directa">Directa</option>
                      </select>
                    </F>
                    <F label="Icc (A)">
                      <input type="number" name="corrienteIccA" defaultValue={(editingMeasurement as any)?.corrienteIccA || ''} required />
                    </F>
                    <F label="Z₁ (Ω)">
                      <input type="number" step="0.01" name="impedanciaZ1Ohm" defaultValue={(editingMeasurement as any)?.impedanciaZ1Ohm || ''} />
                    </F>
                    <F label="Zref (Ω)">
                      <input type="number" step="0.01" name="impedanciaZrefOhm" defaultValue={(editingMeasurement as any)?.impedanciaZrefOhm || ''} />
                    </F>
                  </>
                )}

                {activeType === 'resistencia_aislacion' && (
                  <>
                    <F label="Tensión de prueba (V)">
                      <select name="tensionPruebaV" defaultValue={(editingMeasurement as any)?.tensionPruebaV || 500}>
                        <option value={500}>500 V</option>
                        <option value={1000}>1000 V</option>
                        <option value={2500}>2500 V</option>
                      </select>
                    </F>
                    <F label="Resistencia (MΩ)">
                      <input type="number" step="0.01" name="resistenciaMOhm" defaultValue={(editingMeasurement as any)?.resistenciaMOhm || ''} required />
                    </F>
                    <F label="Temp. ambiente (°C)">
                      <input type="number" name="temperaturaAmbiente" defaultValue={(editingMeasurement as any)?.temperaturaAmbiente || ''} />
                    </F>
                    <F label="Humedad relativa (%)">
                      <input type="number" name="humedadRelativa" defaultValue={(editingMeasurement as any)?.humedadRelativa || ''} />
                    </F>
                  </>
                )}

                {activeType === 'termografia' && (
                  <>
                    <F label="Temperatura (°C)">
                      <input type="number" step="0.1" name="temperaturaC" defaultValue={(editingMeasurement as any)?.temperaturaC || ''} required />
                    </F>
                    <F label="ΔT vs ambiente (°C)">
                      <input type="number" step="0.1" name="diferenciaC" defaultValue={(editingMeasurement as any)?.diferenciaC || ''} />
                    </F>
                    <F label="Emisividad">
                      <input type="number" step="0.01" min={0} max={1} name="emisividad" defaultValue={(editingMeasurement as any)?.emisividad || ''} />
                    </F>
                  </>
                )}

                {activeType === 'calidad_potencia' && (
                  <>
                    <F label="THD V (%)">
                      <input type="number" step="0.01" name="thdVPercent" defaultValue={(editingMeasurement as any)?.thdVPercent || ''} />
                    </F>
                    <F label="THD I (%)">
                      <input type="number" step="0.01" name="thdIPercent" defaultValue={(editingMeasurement as any)?.thdIPercent || ''} />
                    </F>
                    <F label="Factor de potencia">
                      <input type="number" step="0.001" min={-1} max={1} name="factorPotencia" defaultValue={(editingMeasurement as any)?.factorPotencia || ''} />
                    </F>
                    <F label="Tensión (V)">
                      <input type="number" name="tensionVN" defaultValue={(editingMeasurement as any)?.tensionVN || ''} />
                    </F>
                    <F label="Corriente (A)">
                      <input type="number" name="corrienteAN" defaultValue={(editingMeasurement as any)?.corrienteAN || ''} />
                    </F>
                  </>
                )}

                <F label="Observaciones">
                  <textarea
                    name="observaciones"
                    rows={3}
                    style={{ width: '100%' }}
                    defaultValue={editingMeasurement?.observaciones || ''}
                    placeholder="Notas adicionales, condiciones ambientales, etc."
                  />
                </F>
              </div>

              <div className="dialog-actions" style={{ marginTop: 20 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setIsFormOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-acc">
                  {editingId ? 'Guardar cambios' : 'Registrar medición'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
