import { useState } from "react";
import { Card } from "../components/Card";
import { F } from "../components/Field";
import { NumInput } from "../components/NumImput";
import { WallCard } from "../components/WallCard";
import { OpeningCard } from "../components/OpeningCard";
import { ElectricalCard } from "../components/ElectricalCard";
import { createPared, createAbertura, createElemento } from '../lib/storage';

// Tipos
import type { Project, Ambiente, Pared, Abertura, ElementoElectrico } from "../types";
import type { SymbolDialogData } from "../App";

/**
 * Propiedades del componente EditorScreen.
 * Sincronizado con la implementación en App.tsx
 */
interface EditorScreenProps {
  project: Project;
  activeAmbiente: Ambiente;
  activeAmbienteId: string;
  onUpdateMeta: (meta: Project['meta']) => void;
  onUpdateAmbiente: (updateFn: (amb: Ambiente) => Ambiente) => void;
  onAddAmbiente: () => void;
  onDeleteAmbiente: (id: string) => void;
  onSelectAmbiente: (id: string) => void;
  onSymbolDialog: (data: SymbolDialogData) => void;
}

/** Tipo para las pestañas de navegación interna */
type TabId = 'proyecto' | 'paredes' | 'aberturas' | 'electrico';

export function EditorScreen({
  project,
  activeAmbiente,
  activeAmbienteId,
  onUpdateMeta,
  onUpdateAmbiente,
  onAddAmbiente,
  onDeleteAmbiente,
  onSelectAmbiente,
  onSymbolDialog
}: EditorScreenProps) {

  const [tab, setTab] = useState<TabId>('proyecto');

  // Guardas de seguridad (aunque App.tsx ya las maneja, aquí actúan como guardas de tipo)
  if (!project || !activeAmbiente) return <div className="empty">Sin proyecto seleccionado</div>;

  // --- Helpers de actualización semántica ---

  /** Actualiza la lista de paredes */
  const updateWalls = (fn: (paredes: Pared[]) => Pared[]) =>
    onUpdateAmbiente(a => ({ ...a, paredes: fn(a.paredes || []) }));

  /** Actualiza la lista de aberturas */
  const updateOpenings = (fn: (aberturas: Abertura[]) => Abertura[]) =>
    onUpdateAmbiente(a => ({ ...a, aberturas: fn(a.aberturas || []) }));

  /** Actualiza la lista de elementos eléctricos */
  const updateElectrical = (fn: (elementos: ElementoElectrico[]) => ElementoElectrico[]) =>
    onUpdateAmbiente(a => ({ ...a, elementos: fn(a.elementos || []) }));

  return (
    <div className="panel-left">
      {/* Selector de ambientes (Tabs superiores) */}
      <div className="amb-bar">
        {(project.ambientes || []).map((a) => (
          <button
            key={a.id}
            className={`amb-tab ${a.id === activeAmbienteId ? 'active' : ''}`}
            onClick={() => onSelectAmbiente(a.id)}
          >
            {a.nombre}
          </button>
        ))}
        <button className="amb-tab-add" onClick={onAddAmbiente} title="Nuevo ambiente">＋</button>
      </div>

      {/* Navegación por categorías */}
      <div className="panel-tabs">
        {(['proyecto', 'paredes', 'aberturas', 'electrico'] as const).map((k) => {
          const labels: Record<TabId, string> = {
            proyecto: 'Proyecto', paredes: 'Paredes', aberturas: 'Abert.', electrico: 'Eléct.'
          };
          return (
            <button
              key={k}
              className={`panel-tab ${tab === k ? 'active' : ''}`}
              onClick={() => setTab(k)}
            >
              {labels[k]}
            </button>
          );
        })}
      </div>

      {/* Contenido dinámico según Tab */}
      <div className="panel-feed">
        <div className="panel-feed-inner">

          {/* TAB: DATOS GENERALES */}
          {tab === 'proyecto' && (
            <>
              <Card idx="📋" title="Datos del proyecto" onRemove={() => { }} defaultOpen={true}>
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
                </div>
              </Card>

              <Card idx="🏠" title={`Ambiente: ${activeAmbiente.nombre}`} onRemove={() => { }} defaultOpen={true}>
                <F label="Nombre del ambiente">
                  <input
                    value={activeAmbiente.nombre}
                    onChange={e => onUpdateAmbiente(a => ({ ...a, nombre: e.target.value }))}
                  />
                </F>
                <div className="field-row">
                  <F label="Sentido de recorrido">
                    <select
                      value={activeAmbiente.sentido}
                      onChange={e => onUpdateAmbiente(a => ({ ...a, sentido: e.target.value as Ambiente['sentido'] }))}
                    >
                      <option value="horario">Horario</option>
                      <option value="antihorario">Antihorario</option>
                    </select>
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
                </div>
                {project.ambientes.length > 1 && (
                  <button className="btn btn-danger btn-sm" onClick={() => onDeleteAmbiente(activeAmbiente.id)}>
                    Eliminar este ambiente
                  </button>
                )}
              </Card>
            </>
          )}

          {/* TAB: PAREDES */}
          {tab === 'paredes' && (
            activeAmbiente.paredes.map((w, i) => (
              <WallCard
                key={w.id}
                pared={w}
                index={i}
                onChange={(nw) => updateWalls(ps => ps.map((x, j) => j === i ? nw : x))}
                onRemove={() => updateWalls(ps => ps.filter((_, j) => j !== i))}
              />
            ))
          )}

          {/* TAB: ABERTURAS */}
          {tab === 'aberturas' && (
            activeAmbiente.aberturas.map((ab, i) => (
              <OpeningCard
                key={ab.id}
                ab={ab}
                index={i}
                wallCount={activeAmbiente.paredes.length}
                onChange={(nab) => updateOpenings(ps => ps.map((x, j) => j === i ? nab : x))}
                onRemove={() => updateOpenings(ps => ps.filter((_, j) => j !== i))}
              />
            ))
          )}


          {/* TAB: ELÉCTRICO */}
          {tab === 'electrico' && (
            <>
              <div className="info-helper">
                Click en el plano para insertar.<br />
                Símbolos de pared hacen snap automáticamente.
              </div>
              {activeAmbiente.elementos.map((el, i) => (
                <ElectricalCard
                  key={el.id}
                  el={el} // Pasamos el elemento puro
                  escala={project.meta.escala} // Pasamos la escala como prop aparte
                  index={i}
                  wallCount={activeAmbiente.paredes.length}
                  onChange={(nel) => updateElectrical(ps => ps.map((x, j) => j === i ? nel : x))}
                  onRemove={() => updateElectrical(ps => ps.filter((_, j) => j !== i))}
                  onEdit={() => onSymbolDialog({ mode: 'edit', existing: el })}
                />
              ))}
            </>
          )}
        </div>

        {/* Botones de acción al pie */}
        <div className="add-row">
          {tab === 'paredes' && (
            <button className="btn btn-ghost btn-full" onClick={() => updateWalls(ps => [...ps, createPared()])}>
              + Agregar pared
            </button>
          )}
          {tab === 'aberturas' && (
            <button className="btn btn-ghost btn-full" onClick={() => updateOpenings(ps => [...ps, createAbertura()])}>
              + Agregar abertura
            </button>
          )}
          {tab === 'electrico' && (
            <button className="btn btn-ghost btn-full" onClick={() => updateElectrical(ps => [...ps, createElemento('sym-boca-techo')])}>
              + Agregar elemento libre
            </button>
          )}
        </div>
      </div>
    </div>
  );
}