// ═══════════════════════════════════════════════════════════════════════════
// MODULE: screens/ProfileScreen.tsx
// Edición completa del perfil del electricista profesional:
// datos personales, matrículas e instrumentos con calibración.
// Sincroniza con Firebase vía ProfileContext.
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../core/ProfileContext';
import type { Matricula, Instrumento } from '../types/index';
import { F } from '../components/Field';
import './ProfileScreen.css';

export function ProfileScreen() {
  const navigate = useNavigate();
  const { profile, updateProfileData } = useProfile();

  const [isSaving, setIsSaving] = useState(false);

  // ── Form state ──
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [cuit, setCuit] = useState(profile?.cuit || '');
  const [telefono, setTelefono] = useState(profile?.telefono || '');
  const [domicilioProfesional, setDomicilioProfesional] = useState(profile?.domicilioProfesional || '');
  const [matriculas, setMatriculas] = useState<Matricula[]>(profile?.matriculas || []);
  const [instrumentos, setInstrumentos] = useState<Instrumento[]>(profile?.instrumentos || []);

  // ── Matrículas ──
  const addMatricula = () => {
    setMatriculas([...matriculas, { numero: '', colegio: '', jurisdiccion: '' }]);
  };
  const updateMatricula = (i: number, field: keyof Matricula, value: string) => {
    const next = [...matriculas];
    next[i] = { ...next[i], [field]: value };
    setMatriculas(next);
  };
  const removeMatricula = (i: number) => {
    setMatriculas(matriculas.filter((_, idx) => idx !== i));
  };

  // ── Instrumentos ──
  const addInstrumento = () => {
    setInstrumentos([...instrumentos, {
      id: `inst-${Date.now()}`,
      tipo: '', marca: '', modelo: '', nroSerie: ''
    }]);
  };
  const updateInstrumento = (i: number, field: keyof Instrumento, value: string) => {
    const next = [...instrumentos];
    next[i] = { ...next[i], [field]: value };
    setInstrumentos(next);
  };
  const updateInstrumentoCalibracion = (i: number, field: string, value: string | number) => {
    const next = [...instrumentos];
    const inst = next[i];
    next[i] = {
      ...inst,
      calibracion: {
        ...inst.calibracion,
        certificadoNro: inst.calibracion?.certificadoNro || '',
        fechaEmision: inst.calibracion?.fechaEmision || 0,
        fechaVencimiento: inst.calibracion?.fechaVencimiento || 0,
        laboratorio: inst.calibracion?.laboratorio || '',
        alcance: inst.calibracion?.alcance || '',
        adjuntoPath: inst.calibracion?.adjuntoPath || '',
        [field]: value,
      }
    };
    setInstrumentos(next);
  };
  const removeInstrumento = (i: number) => {
    setInstrumentos(instrumentos.filter((_, idx) => idx !== i));
  };

  // ── Guardar ──
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await updateProfileData({
        displayName,
        cuit,
        telefono,
        domicilioProfesional,
        matriculas,
        instrumentos,
      });
      alert('Perfil guardado correctamente');
    } catch (e: any) {
      alert('Error guardando perfil: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  }, [updateProfileData, displayName, cuit, telefono, domicilioProfesional, matriculas, instrumentos]);

  return (
    <div className="screen-profile">
      {/* Header */}
      <div className="screen-profile__header">
        <div className="screen-profile__header-left">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/')}>
            ← Volver
          </button>
          <h1 className="screen-profile__title">Perfil Profesional</h1>
          <span className="screen-profile__subtitle">
            Datos que figuran en los informes y certificados
          </span>
        </div>
        <button className="btn btn-acc" onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>

      {/* Datos personales */}
      <section className="screen-profile__section">
        <h2 className="screen-profile__section-title">📋 Datos personales</h2>
        <div className="screen-profile__grid">
          <F label="Nombre completo">
            <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Juan Pérez" />
          </F>
          <F label="CUIT / CUIL">
            <input value={cuit} onChange={e => setCuit(e.target.value)} placeholder="20-12345678-9" />
          </F>
          <F label="Teléfono">
            <input value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="+54 11 1234-5678" />
          </F>
          <F label="Domicilio profesional">
            <input value={domicilioProfesional} onChange={e => setDomicilioProfesional(e.target.value)} placeholder="Av. Siempreviva 742, Springfield" />
          </F>
        </div>
      </section>

      {/* Matrículas */}
      <section className="screen-profile__section">
        <h2 className="screen-profile__section-title">🎓 Matrículas profesionales</h2>
        {matriculas.length === 0 && (
          <p className="screen-profile__hint">No hay matrículas cargadas.</p>
        )}
        <div className="screen-profile__list">
          {matriculas.map((m, i) => (
            <div key={i} className="screen-profile__row">
              <F label="Número">
                <input value={m.numero} onChange={e => updateMatricula(i, 'numero', e.target.value)} />
              </F>
              <F label="Colegio / Consejo">
                <input value={m.colegio} onChange={e => updateMatricula(i, 'colegio', e.target.value)} placeholder="Colegio de Ingenieros…" />
              </F>
              <F label="Jurisdicción">
                <input value={m.jurisdiccion} onChange={e => updateMatricula(i, 'jurisdiccion', e.target.value)} placeholder="CABA / Provincia de Buenos Aires" />
              </F>
              <button className="btn btn-danger btn-sm" onClick={() => removeMatricula(i)} title="Eliminar">
                ✕
              </button>
            </div>
          ))}
        </div>
        <button className="btn btn-ghost btn-sm" onClick={addMatricula}>
          + Agregar matrícula
        </button>
      </section>

      {/* Instrumentos */}
      <section className="screen-profile__section">
        <h2 className="screen-profile__section-title">🔧 Instrumentos de medición</h2>
        {instrumentos.length === 0 && (
          <p className="screen-profile__hint">No hay instrumentos cargados. Agregá los equipos que usás en campo.</p>
        )}
        <div className="screen-profile__instruments">
          {instrumentos.map((inst, i) => (
            <div key={inst.id} className="instrument-card">
              <div className="instrument-card__header">
                <strong>Instrumento {i + 1}</strong>
                <button className="btn btn-danger btn-xs" onClick={() => removeInstrumento(i)}>✕</button>
              </div>
              <div className="screen-profile__row">
                <F label="Tipo">
                  <input value={inst.tipo} onChange={e => updateInstrumento(i, 'tipo', e.target.value)} placeholder="Megóhmetro / Pinza amperimétrica…" />
                </F>
                <F label="Marca">
                  <input value={inst.marca} onChange={e => updateInstrumento(i, 'marca', e.target.value)} />
                </F>
                <F label="Modelo">
                  <input value={inst.modelo} onChange={e => updateInstrumento(i, 'modelo', e.target.value)} />
                </F>
                <F label="N° de serie">
                  <input value={inst.nroSerie} onChange={e => updateInstrumento(i, 'nroSerie', e.target.value)} />
                </F>
              </div>

              {/* Calibración */}
              <div className="instrument-card__calibracion">
                <div className="sec-hdr">📜 Certificado de calibración</div>
                <div className="screen-profile__row">
                  <F label="N° certificado">
                    <input
                      value={inst.calibracion?.certificadoNro || ''}
                      onChange={e => updateInstrumentoCalibracion(i, 'certificadoNro', e.target.value)}
                    />
                  </F>
                  <F label="Laboratorio">
                    <input
                      value={inst.calibracion?.laboratorio || ''}
                      onChange={e => updateInstrumentoCalibracion(i, 'laboratorio', e.target.value)}
                    />
                  </F>
                  <F label="Alcance">
                    <input
                      value={inst.calibracion?.alcance || ''}
                      onChange={e => updateInstrumentoCalibracion(i, 'alcance', e.target.value)}
                      placeholder="Ej: 0-1000 V, ±0.5%"
                    />
                  </F>
                </div>
                <div className="screen-profile__row">
                  <F label="Fecha de emisión">
                    <input
                      type="date"
                      value={inst.calibracion?.fechaEmision ? new Date(inst.calibracion.fechaEmision).toISOString().split('T')[0] : ''}
                      onChange={e => updateInstrumentoCalibracion(i, 'fechaEmision', e.target.valueAsDate?.getTime() || 0)}
                    />
                  </F>
                  <F label="Fecha de vencimiento">
                    <input
                      type="date"
                      value={inst.calibracion?.fechaVencimiento ? new Date(inst.calibracion.fechaVencimiento).toISOString().split('T')[0] : ''}
                      onChange={e => updateInstrumentoCalibracion(i, 'fechaVencimiento', e.target.valueAsDate?.getTime() || 0)}
                    />
                  </F>
                </div>
              </div>
            </div>
          ))}
        </div>
        <button className="btn btn-ghost btn-sm" onClick={addInstrumento}>
          + Agregar instrumento
        </button>
      </section>
    </div>
  );
}
