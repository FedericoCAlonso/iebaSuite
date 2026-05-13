import React from 'react';
import { Card } from '../../Card';
import { F } from '../../Field';
import { NumInput } from '../../NumImput';
import { createTexto } from '../../../lib/storage';
import { type Project, type Ambiente } from '../../../types/index';

interface ProjectTabProps {
  project: Project;
  activeAmbiente: Ambiente;
  onUpdateMeta: (meta: Project['meta']) => void;
  onUpdateAmbiente: (fn: (a: Ambiente) => Ambiente) => void;
  onDeleteAmbiente: (id: string) => void;
}

/**
 * Pestaña de configuración general del proyecto y la hoja activa.
 */
export const ProjectTab: React.FC<ProjectTabProps> = ({ 
  project, 
  activeAmbiente, 
  onUpdateMeta, 
  onUpdateAmbiente, 
  onDeleteAmbiente 
}) => {
  return (
    <>
      <Card idx="📋" title="Datos del proyecto" defaultOpen={true}>
        <F label="Nombre del proyecto">
          <input
            value={project.meta.nombre}
            onChange={e => onUpdateMeta({ ...project.meta, nombre: e.target.value })}
          />
        </F>
        <div className="field-row">
          <F label="Escala 1:">
            <NumInput
              value={project.meta.escala}
              onChange={v => onUpdateMeta({ ...project.meta, escala: Math.round(v) || 50 })}
            />
          </F>
          <F label="Grosor pared (m)">
            <NumInput
              value={project.meta.grosor_pared_default}
              onChange={v => onUpdateMeta({ ...project.meta, grosor_pared_default: v })}
            />
          </F>
          <F label="Altura techo def. (m)">
            <NumInput
              value={project.meta.alturaDefault ?? 2.6}
              onChange={v => onUpdateMeta({ ...project.meta, alturaDefault: v })}
            />
          </F>
        </div>
      </Card>

      <Card idx="🏠" title={`Hoja de relevamiento: ${activeAmbiente.nombre}`} defaultOpen={true}>
        <F label="Nombre de la hoja">
          <input
            value={activeAmbiente.nombre}
            onChange={e => onUpdateAmbiente(a => ({ ...a, nombre: e.target.value }))}
          />
        </F>
        <div className="field-row">
          <F label="Tipo de hoja">
            <select
              value={activeAmbiente.tipoAmbiente || 'interior'}
              onChange={e => onUpdateAmbiente(a => ({ ...a, tipoAmbiente: e.target.value as Ambiente['tipoAmbiente'] }))}
            >
              <option value="interior">🏠 Interior</option>
              <option value="semi_cubierto">⛅ Semi-cubierta</option>
              <option value="exterior">☀ Exterior</option>
            </select>
          </F>
          <F label="Sentido de recorrido">
            <select
              value={activeAmbiente.sentido}
              onChange={e => onUpdateAmbiente(a => ({ ...a, sentido: e.target.value as Ambiente['sentido'] }))}
            >
              <option value="horario">Horario</option>
              <option value="antihorario">Antihorario</option>
            </select>
          </F>
        </div>
        <div className="field-row">
          <F label="Altura de techo (m)">
            <NumInput
              value={activeAmbiente.alturaLocal ?? (project.meta.alturaDefault ?? 2.6)}
              onChange={v => onUpdateAmbiente(a => ({ ...a, alturaLocal: v }))}
            />
          </F>
          <F label="Mostrar cotas">
            <select
              value={activeAmbiente.mostrar_cotas ? 'si' : 'no'}
              onChange={e => onUpdateAmbiente(a => ({ ...a, mostrar_cotas: e.target.value === 'si' }))}
            >
              <option value="si">Sí</option>
              <option value="no">No</option>
            </select>
          </F>
          <F label="Tamaño cotas (mm)">
            <NumInput
              value={activeAmbiente.cotaSize || 2.5}
              onChange={v => onUpdateAmbiente(a => ({ ...a, cotaSize: v }))}
            />
          </F>
        </div>
        {project.ambientes.length > 1 && (
          <button className="btn btn-danger btn-sm" onClick={() => onDeleteAmbiente(activeAmbiente.id)}>
            Eliminar esta hoja de relevamiento
          </button>
        )}
      </Card>

      <Card idx="T" title="Anotaciones en el plano" defaultOpen={true}>
        <div className="info-helper">Agregá textos libres en el plano (ej: "Cocina", "Pasillo").</div>
        {(activeAmbiente.textos || []).map((t) => (
          <div key={t.id} className="field-row" style={{ alignItems: 'flex-end', marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
            <div style={{ flex: 2 }}>
              <F label="Texto">
                <input
                  value={t.texto}
                  onChange={e => onUpdateAmbiente(a => ({
                    ...a, textos: (a.textos || []).map(xt => xt.id === t.id ? { ...xt, texto: e.target.value } : xt)
                  }))}
                />
              </F>
            </div>
            <div style={{ flex: 1 }}>
              <F label="X">
                <NumInput value={Math.round(t.x)} onChange={v => onUpdateAmbiente(a => ({
                  ...a, textos: (a.textos || []).map(xt => xt.id === t.id ? { ...xt, x: v } : xt)
                }))} />
              </F>
            </div>
            <div style={{ flex: 1 }}>
              <F label="Y">
                <NumInput value={Math.round(t.y)} onChange={v => onUpdateAmbiente(a => ({
                  ...a, textos: (a.textos || []).map(xt => xt.id === t.id ? { ...xt, y: v } : xt)
                }))} />
              </F>
            </div>
            <button className="btn btn-danger btn-sm" onClick={() => onUpdateAmbiente(a => ({
              ...a, textos: (a.textos || []).filter(xt => xt.id !== t.id)
            }))}>✕</button>
          </div>
        ))}
        <button className="btn btn-ghost btn-sm btn-full" onClick={() => onUpdateAmbiente(a => ({
          ...a, textos: [...(a.textos || []), createTexto()]
        }))}>
          + Agregar texto
        </button>
      </Card>
    </>
  );
};
