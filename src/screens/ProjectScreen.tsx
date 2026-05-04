// ═══════════════════════════════════════════════════════════════════════════
// MODULE: screens/ProjectsScreen.jsx
// En React: src/screens/ProjectsScreen.tsx
// ═══════════════════════════════════════════════════════════════════════════
import React from 'react';


export function ProjectsScreen({ projects, activeId, onSelect, onCreate, onDelete, onImport }) {
  const fileRef = React.useRef(null);
  return (
    <div className="screen-projects">
      <div className="screen-header">
        <span className="screen-title">Proyectos</span>
        <button className="btn btn-ghost btn-sm" onClick={()=>fileRef.current.click()}>↑ Importar</button>
        <button className="btn btn-acc btn-sm" onClick={onCreate}>+ Nuevo</button>
        <input ref={fileRef} type="file" accept=".json" style={{display:'none'}} onChange={e=>{
          const f=e.target.files[0]; if (!f) return;
          const r=new FileReader(); r.onload=ev=>{try{onImport(JSON.parse(ev.target.result as string));}catch{}}; r.readAsText(f);
          e.target.value='';
        }}/>
      </div>
      <div className="project-list">
        {!projects.length && <div className="empty">Sin proyectos.<br/>Creá uno nuevo.</div>}
        {projects.map(p=>(
          <div key={p.id} className={`project-item ${p.id===activeId?'active':''}`} onClick={()=>onSelect(p.id)}>
            <div style={{flex:1}}>
              <div className="project-name">{p.meta.nombre}</div>
              <div className="project-meta">Escala 1:{p.meta.escala} · {p.ambientes?.length||0} ambientes</div>
              <div className="project-ambientes">{(p.ambientes||[]).map(a=>a.nombre).join(' · ')}</div>
            </div>
            <button className="btn btn-danger btn-sm" onClick={e=>{e.stopPropagation();onDelete(p.id);}}>✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}
