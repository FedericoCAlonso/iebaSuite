// ═══════════════════════════════════════════════════════════════════════════
// MODULE: App.jsx  (root component)
// En React: src/App.tsx
// ═══════════════════════════════════════════════════════════════════════════
import React from 'react';
import ReactDOM from 'react-dom/client';
import { useProjects } from './hooks/useProjects';
import { useToast } from './hooks/useToast';
import { ProjectsScreen } from './screens/ProjectScreen';
import { STORAGE } from './lib/storage';
import {EditorScreen }from './screens/EditorScreen';
import {Preview} from './componets/Preview';
import {SymbolDialog} from './componets/SymbolDialog';
import {ExportDialog} from './componets/ExportDialog';
import '../style.css';


export function App() {
  const {
    projects, activeProject, activeAmbiente,
    activeProjectId, activeAmbienteId,
    setActiveAmbienteId, selectProject,
    createProject, deleteProject,
    addAmbiente, deleteAmbiente,
    updateProject, updateAmbiente,
  } = useProjects();

  const [screen,     setScreen]     = React.useState('projects');
  const [symDialog,  setSymDialog]  = React.useState(null);
  const [showExport, setShowExport] = React.useState(false);
  const { toast, show: showToast }  = useToast();

  const handleSelectProject = (id) => { selectProject(id); setScreen('editor'); };
  const handleCreateProject = ()  => { createProject();    setScreen('editor'); };

  const handleImportProject = (data) => {
    // migrar proyectos viejos (sin ambientes)
    let p = { ...STORAGE.newProject(), ...data, id:Date.now().toString(), updatedAt:Date.now() };
    if (!p.ambientes) {
      p.ambientes = [{ ...STORAGE.newAmbiente(), paredes:p.paredes||[], aberturas:p.aberturas||[], elementos:p.elementos||[] }];
      delete p.paredes; delete p.aberturas; delete p.elementos;
    }
    updateProject(p.id, ()=>p); // no existe aún
    // simplest: agregar directo
    selectProject(p.id);
    setScreen('editor');
    showToast('Proyecto importado');
    // usamos setProjects indirectamente
    setTimeout(()=>{ /* ya está en storage */ },0);
  };

  const handleSymbolDialog = React.useCallback((clickData) => {
    setSymDialog(clickData);
  },[]);

  const handleSymConfirm = React.useCallback((data) => {
    if (!activeAmbiente) return;
    updateAmbiente(a => {
      const elems = a.elementos||[];
      if (!data) {
        // eliminar
        return { ...a, elementos: elems.filter(e=>e.id!==symDialog?.existing?.id) };
      }
      if (symDialog?.existing) {
        return { ...a, elementos: elems.map(e=>e.id===data.id?data:e) };
      }
      return { ...a, elementos: [...elems, data] };
    });
    setSymDialog(null);
  },[activeAmbiente, symDialog, updateAmbiente]);

  return (
    <div className="app">
      {/* ── Topbar ── */}
      <div className="topbar">
        <span className="topbar-logo">ieBA</span>
        {screen==='editor' && <>
          <span className="topbar-crumb">▸ <span>{activeProject?.meta?.nombre||'—'}</span></span>
          <button className="btn btn-ghost btn-sm" onClick={()=>setScreen('projects')}>Proyectos</button>
        </>}
        <span className="topbar-sep"/>
        {screen==='editor' && activeProject && (
          <div className="topbar-status">
            <span>{activeAmbiente?.paredes?.length||0}p · {activeAmbiente?.aberturas?.length||0}a · {activeAmbiente?.elementos?.length||0}e</span>
            <button className="btn btn-ghost btn-sm" onClick={()=>setShowExport(true)}>Exportar</button>
          </div>
        )}
        {screen==='projects' && (
          <span style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--text3)'}}>Planta eléctrica v0.7</span>
        )}
      </div>

      {/* ── Contenido principal ── */}
      {screen==='projects' ? (
        <ProjectsScreen
          projects={projects}
          activeId={activeProjectId}
          onSelect={handleSelectProject}
          onCreate={handleCreateProject}
          onDelete={deleteProject}
          onImport={handleImportProject}
        />
      ) : (
        <div className="workspace">
          <EditorScreen
            project={activeProject}
            activeAmbiente={activeAmbiente}
            activeAmbienteId={activeAmbienteId}
            onUpdateMeta={meta=>updateProject(activeProjectId,p=>({...p,meta}))}
            onUpdateAmbiente={updateAmbiente}
            onAddAmbiente={addAmbiente}
            onDeleteAmbiente={deleteAmbiente}
            onSelectAmbiente={setActiveAmbienteId}
            onSymbolDialog={handleSymbolDialog}
          />
          <Preview
            ambiente={activeAmbiente}
            meta={activeProject?.meta}
            onInsertElemento={handleSymbolDialog}
          />
        </div>
      )}

      {/* ── Dialogs ── */}
      {symDialog && (
        <SymbolDialog
          clickData={symDialog}
          onConfirm={handleSymConfirm}
          onCancel={()=>setSymDialog(null)}
        />
      )}
      {showExport && activeProject && (
        <ExportDialog
          project={activeProject}
          onClose={()=>setShowExport(false)}
          onToast={showToast}
        />
      )}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

// ── Bootstrap ──
ReactDOM.createRoot(document.getElementById('root')).render(<App/>);