import { Card } from "../components/Card";
import { F } from "../components/Field";
import { NumInput } from "../components/NumImput";
import { WallCard } from "../components/WallCard";
import { OpeningCard } from "../components/OpeningCard";
import { ElectricalCard } from "../components/ElectricalCard";
import { CircuitoCard } from "../components/CircuitoCard";
import { ConexionCard } from "../components/ConexionCard";
import { createPared, createAbertura, createElemento, createTexto, createCircuito, createConexion } from '../lib/storage';

// Tipos
import {
  type Project, type Ambiente, type ElementoElectrico, type SymbolDialogData,
  type EditorTab, type Pared, type Abertura, type Circuito, type Conexion
} from '../types';

/**
 * Propiedades del componente EditorScreen.
 */
interface EditorScreenProps {
  project: Project;
  activeAmbiente: Ambiente;
  activeAmbienteId: string;
  activeTab: EditorTab;
  symbolsLib: import('../lib/symbols').DefinicionSimbolo[];
  onTabChange: (tab: EditorTab) => void;
  onUpdateMeta: (meta: Project['meta']) => void;
  onUpdateAmbiente: (updateFn: (amb: Ambiente) => Ambiente) => void;
  onUpdateProject: (fn: (p: Project) => Project) => void;
  onAddAmbiente: () => void;
  onDeleteAmbiente: (id: string) => void;
  onSelectAmbiente: (id: string) => void;
  onSymbolDialog: (data: SymbolDialogData) => void;
  onShowNetlist: () => void;
}



export function EditorScreen({
  project,
  activeAmbiente,
  activeAmbienteId,
  activeTab,
  symbolsLib,
  onTabChange,
  onUpdateMeta,
  onUpdateAmbiente,
  onUpdateProject,
  onAddAmbiente,
  onDeleteAmbiente,
  onSelectAmbiente,
  onSymbolDialog,
  onShowNetlist
}: EditorScreenProps) {

  if (!project || !activeAmbiente) return <div className="empty">Sin proyecto seleccionado</div>;

  // --- Helpers de actualización semántica ---

  const updateWalls = (fn: (paredes: Pared[]) => Pared[]) =>
    onUpdateAmbiente(a => ({ ...a, paredes: fn(a.paredes || []) }));

  const updateOpenings = (fn: (aberturas: Abertura[]) => Abertura[]) =>
    onUpdateAmbiente(a => ({ ...a, aberturas: fn(a.aberturas || []) }));

  const updateElectrical = (fn: (elementos: ElementoElectrico[]) => ElementoElectrico[]) =>
    onUpdateAmbiente(a => ({ ...a, elementos: fn(a.elementos || []) }));

  const updateCircuitos = (fn: (circuitos: Circuito[]) => Circuito[]) =>
    onUpdateProject(p => ({ ...p, circuitos: fn(p.circuitos || []) }));

  const updateConexiones = (fn: (conexiones: Conexion[]) => Conexion[]) =>
    onUpdateProject(p => ({ ...p, conexiones: fn(p.conexiones || []) }));

  const circuitos = project.circuitos || [];
  const conexiones = project.conexiones || [];

  // Etiquetas e iconos de tabs
  const tabConfig: Record<EditorTab, { label: string, icon: string }> = {
    proyecto:   { label: 'Proy.', icon: '📋' },
    paredes:    { label: 'Paredes', icon: '🧱' },
    aberturas:  { label: 'Abert.', icon: '🚪' },
    electrico:  { label: 'Bocas', icon: '⚡' },
    circuitos:  { label: 'Circuit.', icon: '🔌' },
    conexiones: { label: 'Conex.', icon: '🔗' },
    maestro:    { label: 'Maestro', icon: '🗺️' }
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
            {a.tipoAmbiente && a.tipoAmbiente !== 'interior' && (
              <span style={{ marginLeft: 4, fontSize: 10, opacity: 0.7 }}>
                {a.tipoAmbiente === 'exterior' ? '☀' : '⛅'}
              </span>
            )}
          </button>
        ))}
        <button className="amb-tab-add" onClick={onAddAmbiente} title="Nuevo ambiente">＋</button>
      </div>

      {/* Tabs de categoría */}
      <div className="panel-tabs">
        {(['proyecto', 'paredes', 'aberturas', 'electrico', 'circuitos', 'conexiones', 'maestro'] as const).map((k) => (
          <button
            key={k}
            className={`panel-tab ${activeTab === k ? 'active' : ''}`}
            onClick={() => onTabChange(k)}
          >
            <span style={{ fontSize: 16 }}>{tabConfig[k].icon}</span>
            <span>{tabConfig[k].label}</span>
          </button>
        ))}
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
                  <F label="Altura techo def. (m)">
                    <NumInput
                      value={project.meta.alturaDefault ?? 2.6}
                      onChange={v => onUpdateMeta({ ...project.meta, alturaDefault: v })}
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
                  <F label="Tipo de ambiente">
                    <select
                      value={activeAmbiente.tipoAmbiente || 'interior'}
                      onChange={e => onUpdateAmbiente(a => ({ ...a, tipoAmbiente: e.target.value as Ambiente['tipoAmbiente'] }))}
                    >
                      <option value="interior">🏠 Interior</option>
                      <option value="semi_cubierto">⛅ Semi-cubierto</option>
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
                    Eliminar este ambiente
                  </button>
                )}
              </Card>

              <Card idx="📄" title="Configuración de Hoja" defaultOpen={false}>
                <div className="field-row">
                  <F label="Formato">
                    <select
                      value={activeAmbiente.configHoja?.formato || 'A4'}
                      onChange={e => onUpdateAmbiente(a => ({
                        ...a,
                        configHoja: { ...(a.configHoja || { formato: 'A4', orientacion: 'horizontal' }), formato: e.target.value as 'A4' | 'A3' }
                      }))}
                    >
                      <option value="A4">A4 (210x297mm)</option>
                      <option value="A3">A3 (297x420mm)</option>
                    </select>
                  </F>
                  <F label="Orientación">
                    <select
                      value={activeAmbiente.configHoja?.orientacion || 'horizontal'}
                      onChange={e => onUpdateAmbiente(a => ({
                        ...a,
                        configHoja: { ...(a.configHoja || { formato: 'A4', orientacion: 'horizontal' }), orientacion: e.target.value as 'vertical' | 'horizontal' }
                      }))}
                    >
                      <option value="vertical">Vertical</option>
                      <option value="horizontal">Horizontal</option>
                    </select>
                  </F>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '8px' }}>
                  * El margen técnico se ajusta a 1cm (10mm).
                </div>
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
                  ambientes={project.ambientes}
                  activeAmbienteId={activeAmbienteId}
                  onChange={(nab) => updateOpenings(ps => ps.map((x, j) => j === i ? nab : x))}
                  onRemove={() => updateOpenings(ps => ps.filter((_, j) => j !== i))}
                />
              ))}
            </>
          )}

          {/* TAB: CIRCUITOS */}
          {activeTab === 'circuitos' && (
            <>
              <div className="info-helper">
                ⚡ Definí los circuitos del proyecto. Luego asigná cada boca a un circuito.<br />
                Nomenclatura AEA: <strong>TS1.C1</strong> = Circuito C1 del Tablero Seccional 1.
              </div>
              {circuitos.map((c, i) => (
                <CircuitoCard
                  key={c.id}
                  circuito={c}
                  index={i}
                  onChange={(nc) => updateCircuitos(cs => cs.map((x, j) => j === i ? nc : x))}
                  onRemove={() => updateCircuitos(cs => cs.filter((_, j) => j !== i))}
                />
              ))}
              {circuitos.length === 0 && (
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>
                  No hay circuitos definidos. Agregá el primero.
                </div>
              )}
            </>
          )}

          {/* TAB: CONEXIONES */}
          {activeTab === 'conexiones' && (
            <>
              <div className="info-helper">
                🔗 Creá el netlist vinculando bocas entre sí. Estas líneas punteadas se verán en el plano.
              </div>
              {conexiones.map((c, i) => (
                <ConexionCard
                  key={c.id}
                  conexion={c}
                  index={i}
                  ambientes={project.ambientes}
                  circuitos={circuitos}
                  onChange={nc => onUpdateProject(p => ({
                    ...p,
                    conexiones: (p.conexiones || []).map(cx => cx.id === nc.id ? nc : cx)
                  }))}
                  onRemove={() => onUpdateProject(p => ({
                    ...p,
                    conexiones: (p.conexiones || []).filter(cx => cx.id !== c.id)
                  }))}
                />
              ))}
              {conexiones.length === 0 && (
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>
                  No hay conexiones en el netlist. Agregá una para unir dos bocas.
                </div>
              )}
            </>
          )}

          {/* TAB: ELÉCTRICO */}
          {activeTab === 'electrico' && (
            <>
              <div className="info-helper">
                🖱 Tocá el plano para insertar un símbolo.<br />
                Los símbolos de pared hacen snap automáticamente.
              </div>
              <div style={{ padding: '0 8px 8px' }}>
                <button className="btn btn-acc btn-full" onClick={onShowNetlist}>
                  📄 Ver Listado de Materiales (Netlist)
                </button>
              </div>
              {activeAmbiente.elementos.map((el, i) => (
                <ElectricalCard
                  key={el.id}
                  el={el}
                  index={i}
                  wallCount={activeAmbiente.paredes.length}
                  symbolsLib={symbolsLib}
                  circuitos={circuitos}
                  onChange={(nel) => updateElectrical(ps => ps.map((x, j) => j === i ? nel : x))}
                  onRemove={() => updateElectrical(ps => ps.filter((_, j) => j !== i))}
                  onEdit={() => onSymbolDialog({ mode: 'edit', existing: el })}
                />
              ))}
            </>
          )}

          {/* TAB: MAESTRO */}
          {activeTab === 'maestro' && (
            <>
              <Card idx="📐" title="Configuración de Hoja Maestro" defaultOpen={true}>
                <F label="Formato">
                  <select
                    value={activeAmbiente.configHoja?.formato || 'A4'}
                    onChange={e => onUpdateAmbiente(a => ({ ...a, configHoja: { ...(a.configHoja || { formato: 'A4', orientacion: 'horizontal' }), formato: e.target.value as any } }))}
                  >
                    <option value="A4">A4 (210x297mm)</option>
                    <option value="A3">A3 (297x420mm)</option>
                  </select>
                </F>
                <F label="Orientación">
                  <select
                    value={activeAmbiente.configHoja?.orientacion || 'horizontal'}
                    onChange={e => onUpdateAmbiente(a => ({ ...a, configHoja: { ...(a.configHoja || { formato: 'A4', orientacion: 'horizontal' }), orientacion: e.target.value as any } }))}
                  >
                    <option value="horizontal">Horizontal</option>
                    <option value="vertical">Vertical</option>
                  </select>
                </F>
              </Card>

              <Card idx="🏗️" title="Integración en Proyecto" defaultOpen={true}>
                <div className="info-helper">Posicioná este ambiente en el plano maestro (en metros).</div>
                <div className="field-row">
                  <F label="Posición X (m)">
                    <NumInput
                      value={activeAmbiente.posX || 0}
                      onChange={v => onUpdateAmbiente(a => ({ ...a, posX: v }))}
                    />
                  </F>
                  <F label="Posición Y (m)">
                    <NumInput
                      value={activeAmbiente.posY || 0}
                      onChange={v => onUpdateAmbiente(a => ({ ...a, posY: v }))}
                    />
                  </F>
                </div>
              </Card>
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
          {activeTab === 'circuitos' && (
            <button className="btn btn-ghost btn-full" onClick={() => updateCircuitos(cs => [...cs, createCircuito()])}>
              + Agregar circuito
            </button>
          )}
          {activeTab === 'conexiones' && (
            <button className="btn btn-ghost btn-full" onClick={() => updateConexiones(cs => [...cs, createConexion({ ambienteId: activeAmbienteId, elementoId: '' }, { ambienteId: activeAmbienteId, elementoId: '' })])}>
              + Agregar conexión
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