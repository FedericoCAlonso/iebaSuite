import { F } from '../../Field';
import { NumInput } from '../../NumImput';
import type { Project } from '../../../types/index';

interface GeneralTabProps {
  project: Project;
  onUpdateProject: (fn: (p: Project) => Project) => void;
}

const ESTADO_OPTIONS: { value: Project['estado']; label: string }[] = [
  { value: 'relevamiento', label: 'Relevamiento' },
  { value: 'presupuesto', label: 'Presupuesto' },
  { value: 'en_ejecucion', label: 'En ejecución' },
  { value: 'ejecutado', label: 'Ejecutado' },
  { value: 'certificado', label: 'Certificado' },
];

export function GeneralTab({ project, onUpdateProject }: GeneralTabProps) {
  const update = (patch: Partial<Project>) => {
    onUpdateProject(p => ({ ...p, ...patch, updatedAt: Date.now() }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="info-helper">
        Configuración general del proyecto. Estos datos aparecen en los informes y exportaciones.
      </div>

      <div className="card">
        <div className="card-hdr">
          <span className="card-idx">📋</span>
          <span className="card-title">Datos del proyecto</span>
        </div>
        <div className="card-body">
          <F label="Nombre del proyecto">
            <input
              value={project.nombre}
              onChange={e => update({ nombre: e.target.value })}
            />
          </F>

          <div className="field-row">
            <F label="Estado">
              <select
                value={project.estado}
                onChange={e => update({ estado: e.target.value as Project['estado'] })}
              >
                {ESTADO_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </F>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-hdr">
          <span className="card-idx">🏠</span>
          <span className="card-title">Inmueble</span>
        </div>
        <div className="card-body">
          <F label="Dirección">
            <input
              value={project.inmueble.direccion}
              onChange={e => update({ inmueble: { ...project.inmueble, direccion: e.target.value } })}
              placeholder="Calle y número"
            />
          </F>

          <div className="field-row">
            <F label="Partido / Localidad">
              <input
                value={project.inmueble.partido}
                onChange={e => update({ inmueble: { ...project.inmueble, partido: e.target.value } })}
              />
            </F>
            <F label="Provincia">
              <input
                value={project.inmueble.provincia}
                onChange={e => update({ inmueble: { ...project.inmueble, provincia: e.target.value } })}
              />
            </F>
          </div>

          <F label="Uso del inmueble">
            <select
              value={project.inmueble.uso}
              onChange={e => update({ inmueble: { ...project.inmueble, uso: e.target.value as Project['inmueble']['uso'] } })}
            >
              <option value="residencial">Residencial</option>
              <option value="comercial">Comercial</option>
              <option value="industrial">Industrial</option>
            </select>
          </F>
        </div>
      </div>

      <div className="card">
        <div className="card-hdr">
          <span className="card-idx">⚡</span>
          <span className="card-title">Suministro eléctrico</span>
        </div>
        <div className="card-body">
          <div className="field-row">
            <F label="Tensión (V)">
              <NumInput
                value={project.suministro.tension}
                onChange={v => update({ suministro: { ...project.suministro, tension: Math.round(v) } })}
              />
            </F>
            <F label="Fases">
              <select
                value={project.suministro.fases}
                onChange={e => update({ suministro: { ...project.suministro, fases: Number(e.target.value) as 1 | 2 | 3 } })}
              >
                <option value={1}>Monofásico (1F + N)</option>
                <option value={2}>Bifásico (2F + N)</option>
                <option value={3}>Trifásico (3F + N)</option>
              </select>
            </F>
          </div>

          <div className="field-row">
            <F label="Potencia contratada (kW)">
              <NumInput
                value={project.suministro.potenciaContratada ?? 0}
                onChange={v => update({ suministro: { ...project.suministro, potenciaContratada: v } })}
              />
            </F>
            <F label="Categoría tarifa">
              <input
                value={project.suministro.categoriaTarifa || ''}
                onChange={e => update({ suministro: { ...project.suministro, categoriaTarifa: e.target.value } })}
                placeholder="Ej: T1, T2, T3"
              />
            </F>
          </div>

          <F label="Número de medidor">
            <input
              value={project.suministro.medidorId || ''}
              onChange={e => update({ suministro: { ...project.suministro, medidorId: e.target.value } })}
            />
          </F>
        </div>
      </div>
    </div>
  );
}
