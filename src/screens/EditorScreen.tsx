import { Card } from "../components/Card";
import { F } from "../components/Field";
import { NumInput } from "../components/NumImput";
import { WallCard } from "../components/WallCard";
import { OpeningCard } from "../components/OpeningCard";
import { ElectricalCard } from "../components/ElectricalCard";
import { createPared, createAbertura, createElemento, createTexto } from '../lib/storage';

// Tipos
import type { Project, Ambiente, Pared, Abertura, ElementoElectrico } from "../types";
import type { SymbolDialogData, EditorTab } from "../App";

/**
 * Propiedades del componente EditorScreen.
 * El tab activo y su setter vienen de App para compartirse con Preview.
 */
interface EditorScreenProps {
  project: Project;
  activeAmbiente: Ambiente;
  activeAmbienteId: string;
  activeTab: EditorTab;
  undoAmbiente: () => void;
  canUndo: boolean;
  symbolsLib: import('../lib/symbols').DefinicionSimbolo[];
  onTabChange: (tab: EditorTab) => void;
  onUpdateMeta: (meta: Project['meta']) => void;
  onUpdateAmbiente: (updateFn: (amb: Ambiente) => Ambiente) => void;
  onAddAmbiente: () => void;
  onDeleteAmbiente: (id: string) => void;
  onSelectAmbiente: (id: string) => void;
  onSymbolDialog: (data: SymbolDialogData) => void;
}

export function EditorScreen({
  project,
  activeAmbiente,
  activeAmbienteId,
  activeTab,
  undoAmbiente,
  canUndo,
  symbolsLib,
  onTabChange,
  onUpdateMeta,
  onUpdateAmbiente,
  onAddAmbiente,
  onDeleteAmbiente,
  onSelectAmbiente,
  onSymbolDialog,
}: EditorScreenProps) {

  // Guardas de seguridad
  if (!project || !activeAmbiente) return <div className="empty">Sin proyecto seleccionado</div>;

  // --- Helpers de actualización semántica ---

  const updateWalls = (fn: (paredes: Pared[]) => Pared[]) =>
    onUpdateAmbiente(a => ({ ...a, paredes: fn(a.paredes || []) }));

  const updateOpenings = (fn: (aberturas: Abertura[]) => Abertura[]) =>
    onUpdateAmbiente(a => ({ ...a, aberturas: fn(a.aberturas || []) }));

  const updateElectrical = (fn: (elementos: ElementoElectrico[]) => ElementoElectrico[]) =>
    onUpdateAmbiente(a => ({ ...a, elementos: fn(a.elementos || []) }));

  // Etiquetas de tabs
  const tabLabels: Record<EditorTab, string> = {
    proyecto: 'Proyecto', paredes: 'Paredes', aberturas: 'Abert.', electrico: 'Eléct.'
  };

  return (
    <>
      {/* Selector de ambientes */}
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

      {/* Tabs de categoría */}
      <div className="panel-tabs">
        {(['proyecto', 'paredes', 'aberturas', 'electrico'] as const).map((k) => (
          <button
            key={k}
            className={`panel-tab ${activeTab === k ? 'active' : ''}`}
            onClick={() => onTabChange(k)}
          >
            {tabLabels[k]}
          </button>
        ))}
        
        {/* Botón de Deshacer */}
        <button 
          className="panel-tab" 
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); undoAmbiente(); }} 
          disabled={!canUndo}
          style={{ 
            marginLeft: 'auto', 
            flex: 'none', 
            padding: '0 15px', 
            fontSize: '14px',
            opacity: canUndo ? 1 : 0.4,
            cursor: canUndo ? 'pointer' : 'default',
            color: 'var(--acc)'
          }}
          title="Deshacer último cambio"
        >
          ↶
        </button>
      </div>

      {/* Feed de tarjetas */}
      <div className="panel-feed">
        <div className="panel-feed-inner">

          {/* TAB: DATOS GENERALES */}
          {activeTab === 'proyecto' && (
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

              {/* SECCIÓN DE TEXTOS LIBRES */}
              <Card idx="T" title="Anotaciones en el plano" onRemove={() => { }} defaultOpen={true}>
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
          )}

          {/* TAB: PAREDES */}
          {activeTab === 'paredes' && (
            activeAmbiente.paredes.map((w, i) => (
              <WallCard
                key={w.id}
                pared={w}
                index={i}
                isLast={i === activeAmbiente.paredes.length - 1}
                onChange={(nw) => updateWalls(ps => ps.map((x, j) => j === i ? nw : x))}
                onRemove={() => updateWalls(ps => ps.filter((_, j) => j !== i))}
              />
            ))
          )}

          {/* TAB: ABERTURAS */}
          {activeTab === 'aberturas' && (
            <>
              {/* Indicador contextual del modo de inserción */}
              <div className="info-helper">
                🖱 Tocá una pared en el plano para agregar abertura.<br />
                O usá el botón "+" para ingresarla a mano.
              </div>
              {activeAmbiente.aberturas.map((ab, i) => (
                <OpeningCard
                  key={ab.id}
                  ab={ab}
                  index={i}
                  wallCount={activeAmbiente.paredes.length}
                  onChange={(nab) => updateOpenings(ps => ps.map((x, j) => j === i ? nab : x))}
                  onRemove={() => updateOpenings(ps => ps.filter((_, j) => j !== i))}
                />
              ))}
            </>
          )}

          {/* TAB: ELÉCTRICO */}
          {activeTab === 'electrico' && (
            <>
              <div className="info-helper">
                🖱 Tocá el plano para insertar un símbolo.<br />
                Los símbolos de pared hacen snap automáticamente.
              </div>
              {activeAmbiente.elementos.map((el, i) => (
                <ElectricalCard
                  key={el.id}
                  el={el}
                  escala={project.meta.escala}
                  index={i}
                  wallCount={activeAmbiente.paredes.length}
                  symbolsLib={symbolsLib}
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
          {activeTab === 'paredes' && (
            <button className="btn btn-ghost btn-full" onClick={() => updateWalls(ps => [...ps, createPared()])}>
              + Agregar pared
            </button>
          )}
          {activeTab === 'aberturas' && (
            <button className="btn btn-ghost btn-full" onClick={() => updateOpenings(ps => {
              const lastAb = ps.length > 0 ? ps[ps.length - 1] : null;
              return [...ps, createAbertura(lastAb ? { 
                tipo: lastAb.tipo, ancho: lastAb.ancho, 
                hojas: lastAb.hojas, lado: lastAb.lado, sentido: lastAb.sentido 
              } : {})];
            })}>
              + Agregar abertura a mano
            </button>
          )}
          {activeTab === 'electrico' && (
            <button className="btn btn-ghost btn-full" onClick={() => updateElectrical(ps => [...ps, createElemento('sym-boca-techo')])}>
              + Agregar elemento libre
            </button>
          )}
        </div>
      </div>
    </>
  );
}