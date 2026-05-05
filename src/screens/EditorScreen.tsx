// ═══════════════════════════════════════════════════════════════════════════
// MODULE: screens/EditorScreen.jsx
// En React: src/screens/EditorScreen.tsx
// ═══════════════════════════════════════════════════════════════════════════
import React from "react";
import { Card } from "../componets/Card";
import { F } from "../componets/Field";
import { NumInput } from "../componets/NumImput";
import { WallCard } from "../componets/WallCard";
import { OpeningCard } from "../componets/OpeningCard";
import { ElectricalCard } from "../componets/ElectricalCard";
import { STORAGE } from "../lib/storage";


export function EditorScreen({ project, activeAmbiente, activeAmbienteId, onUpdateMeta, onUpdateAmbiente,
                        onAddAmbiente, onDeleteAmbiente, onSelectAmbiente, onSymbolDialog }) {
  const [tab, setTab] = React.useState('proyecto');
  const amb = activeAmbiente;

  if (!project || !amb) return <div className="empty">Sin proyecto seleccionado</div>;

  const pw = (fn: (paredes: any[]) => any) => onUpdateAmbiente((a: any) => ({ ...a, paredes: fn(a.paredes || []) }));
  const ua = (fn: (aberturas: any[]) => any) => onUpdateAmbiente((a: any) => ({ ...a, aberturas: fn(a.aberturas || []) }));
  const ue = (fn: (elementos: any[]) => any) => onUpdateAmbiente((a: any) => ({ ...a, elementos: fn(a.elementos || []) }));

  return (
    <div className="panel-left">
      {/* Selector de ambientes */}
      <div className="amb-bar">
        {(project.ambientes||[]).map((a: any)=>(
          <button key={a.id} className={`amb-tab ${a.id===activeAmbienteId?'active':''}`} onClick={()=>onSelectAmbiente(a.id)}>
            {a.nombre}
          </button>
        ))}
        <button className="amb-tab-add" onClick={onAddAmbiente} title="Nuevo ambiente">＋</button>
      </div>

      {/* Tabs de edición */}
      <div className="panel-tabs">
        {[['proyecto','Proyecto'],['paredes','Paredes'],['aberturas','Abert.'],['electrico','Eléct.']].map(([k,l])=>(
          <button key={k} className={`panel-tab ${tab===k?'active':''}`} onClick={()=>setTab(k)}>{l}</button>
        ))}
      </div>

      {/* Feed de contenido */}
      <div className="panel-feed">
        <div className="panel-feed-inner">

          {tab==='proyecto' && (
            <>
              <Card idx="📋" title="Datos del proyecto" badge="" onRemove={()=>{}} defaultOpen={true}>
                <F label="Nombre del proyecto">
                  <input value={project.meta.nombre||''} onChange={e=>onUpdateMeta({...project.meta,nombre:e.target.value})}/>
                </F>
                <div className="field-row">
                  <F label="Escala 1:">
                    <NumInput value={project.meta.escala||50} onChange={v=>onUpdateMeta({...project.meta,escala:Math.round(v)||50})}/>
                  </F>
                  <F label="Grosor pared (m)">
                    <NumInput value={project.meta.grosor_pared_default||0.15} onChange={(v: number )=>onUpdateMeta({...project.meta,grosor_pared_default:v})} />
                  </F>
                </div>
              </Card>
              <Card idx="🏠" title={`Ambiente: ${amb.nombre}`} badge="" onRemove={()=>{}} defaultOpen={true}>
                <F label="Nombre del ambiente">
                  <input value={amb.nombre||''} onChange={e=>onUpdateAmbiente((a: any)=>({...a,nombre:e.target.value}))}/>
                </F>
                <div className="field-row">
                  <F label="Sentido de recorrido">
                    <select value={amb.sentido||'horario'} onChange={e=>onUpdateAmbiente((a: any)=>({...a,sentido:e.target.value}))}>
                      <option value="horario">Horario</option>
                      <option value="antihorario">Antihorario</option>
                    </select>
                  </F>
                  <F label="Mostrar cotas">
                    <select value={amb.mostrar_cotas!==false?'si':'no'} onChange={e=>onUpdateAmbiente((a: any) =>({...a,mostrar_cotas:e.target.value==='si'}))}>
                      <option value="si">Sí</option>
                      <option value="no">No</option>
                    </select>
                  </F>
                </div>
                {(project.ambientes||[]).length>1 && (
                  <button className="btn btn-danger btn-sm" onClick={()=>onDeleteAmbiente(amb.id)}>Eliminar este ambiente</button>
                )}
              </Card>
            </>
          )}

          {tab==='paredes' && (
            <>
              {(amb.paredes||[]).map((w: any,i: number)=>(
                <WallCard key={w.id||i} pared={w} index={i}
                  onChange={(nw: any) => pw(ps => ps.map((x: any, j: number) => j === i ? nw : x))}
                  onRemove={() => pw(ps => ps.filter((_: any, j: number) => j !== i))}
                />
              ))}
            </>
          )}

          {tab==='aberturas' && (
            <>
              {(amb.aberturas||[]).map((ab: any,i: number)=>(
                <OpeningCard key={ab.id||i} ab={ab} index={i} wallCount={amb.paredes?.length||0}
                  onChange={(nab: any) => ua(ps => ps.map((x: any, j: number) => j === i ? nab : x))}
                  onRemove={() => ua(ps => ps.filter((_: any, j: number) => j !== i))}
                />
              ))}
            </>
          )}

          {tab==='electrico' && (
            <>
              <div style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--text3)',padding:'4px 0',lineHeight:1.6}}>
                Click en el plano para insertar.<br/>
                Símbolos de pared hacen snap a la pared más cercana.
              </div>
              {(amb.elementos||[]).map((el: any,i: number)=>(
                <ElectricalCard key={el.id||i} el={{...el,_escala:project.meta?.escala||50}} index={i}
                  wallCount={amb.paredes?.length||0}
                  onChange={(nel: any) => ue(ps => ps.map((x: any, j: number) => j === i ? nel : x))}
                  onRemove={() => ue(ps => ps.filter((_: any, j: number) => j !== i))}
                />
              ))}
            </>
          )}
        </div>

        {/* Botón agregar al pie del feed */}
        {tab==='paredes' && (
          <div className="add-row">
            <button className="btn btn-ghost btn-full" onClick={()=>pw(ps=>[...ps,STORAGE.newPared()])}>+ Agregar pared</button>
          </div>
        )}
        {tab==='aberturas' && (
          <div className="add-row">
            <button className="btn btn-ghost btn-full" onClick={()=>ua(ps=>[...ps,STORAGE.newAbertura()])}>+ Agregar abertura</button>
          </div>
        )}
        {tab==='electrico' && (
          <div className="add-row">
            <button className="btn btn-ghost btn-full" onClick={()=>ue(ps=>[...ps,STORAGE.newElemento('sym-boca-techo',100,100)])}>+ Agregar elemento</button>
          </div>
        )}
      </div>
    </div>
  );
}
