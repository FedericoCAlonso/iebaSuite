// ═══════════════════════════════════════════════════════════════════════════
// MODULE: App.jsx  (root component)
// En React: src/App.tsx
// ═══════════════════════════════════════════════════════════════════════════



import React, { useCallback, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { useProjects } from './hooks/useProjects';
import { useToast } from './hooks/useToast';
import { ProjectsScreen } from './screens/ProjectScreen';
import { STORAGE } from './lib/storage';
import {EditorScreen }from './screens/EditorScreen';
import {Preview} from './componets/Preview';
import {SymbolDialog} from './componets/SymbolDialog';
import {ExportDialog} from './componets/ExportDialog';
import type { Project, ElementoElectrico } from './types';
import '../style.css';

/*
 Agregado 1
defino tipos para los datos que se pasan al SymbolDialog, para evitar confusiones entre modo creación y edición.
*/
type SymbolDialogData = 
  | { mode: 'create'; x: number; y: number; snapSegIdx?: number; snapPos?: number }
  | { mode: 'edit'; existing: ElementoElectrico };


export function App() {
  const {
    projects, activeProject, activeAmbiente,
    activeProjectId, activeAmbienteId,
    setActiveAmbienteId, selectProject,
    createProject, deleteProject,
    addAmbiente, deleteAmbiente,
    updateProject, updateAmbiente,
    addProject,
  } = useProjects();

  const [screen,     setScreen]     = React.useState('projects');
  // const [symDialog,  setSymDialog]  = React.useState<{existing?: ElementoElectrico} | null>(null);
  /* Agregado 2 Para manejar los datos del diálogo de símbolos */
  const [symDialog, setSymDialog] = useState<SymbolDialogData | null>(null);
  const [showExport, setShowExport] = React.useState(false);
  const { toast, show: showToast }  = useToast();


  const handleSelectProject = (id: string) => { selectProject(id); setScreen('editor'); };
  const handleCreateProject = ()  => { createProject();    setScreen('editor'); };

  /* Agregado 3: función para importar proyectos, con migración de formato viejo (sin ambientes) */
  const handleSymbolDialog = useCallback((data: SymbolDialogData) => {
  setSymDialog(data);
}, []);

  const handleSymConfirm = useCallback((updatedElement: ElementoElectrico | null) => {
    if (!activeAmbiente) return;
  
    updateAmbiente(amb => {
      let nuevosElementos: ElementoElectrico[];
      if (updatedElement === null && symDialog?.mode === 'edit') {
        // eliminar
        nuevosElementos = amb.elementos.filter(e => e.id !== symDialog.existing.id);
      } else if (updatedElement && symDialog?.mode === 'edit') {
        // actualizar
        nuevosElementos = amb.elementos.map(e => e.id === updatedElement.id ? updatedElement : e);
      } else if (updatedElement && symDialog?.mode === 'create') {
        // agregar nuevo
        nuevosElementos = [...amb.elementos, updatedElement];
      } else {
        return amb; // sin cambios
      }
      return { ...amb, elementos: nuevosElementos };
    });
    setSymDialog(null);
  }, [activeAmbiente, symDialog, updateAmbiente]);

  const handleImportProject = (data: any) => {
  const newProject = {
    ...STORAGE.newProject(),
    ...data,
    id: Date.now().toString(),
    updatedAt: Date.now(),
    ambientes: data.ambientes || [{ ...STORAGE.newAmbiente(), paredes: data.paredes || [], aberturas: data.aberturas || [], elementos: data.elementos || [] }]
  };
  // limpiar propiedades antiguas
  delete newProject.paredes; delete newProject.aberturas; delete newProject.elementos;
  addProject(newProject);
  selectProject(newProject.id);
  setScreen('editor');
  showToast('Proyecto importado');
  };

  /*const handleImportProject = (data: any) => {
    // migrar proyectos viejos (sin ambientes)
    let p : any = { ...STORAGE.newProject(), ...data, id:Date.now().toString(), updatedAt:Date.now() };
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
    setTimeout(()=>{ },0);
  }; 
  */
/*
  const handleSymbolDialog = React.useCallback((clickData: any) => {
    setSymDialog(clickData);
  },[]);
*/
 /* const handleSymConfirm = React.useCallback((data: any) => {
    if (!activeAmbiente) return;
    updateAmbiente((a: Ambiente) => {
      const elems = a.elementos||[];
      const existingId = symDialog?.existing?.id;
      if (!data) {
        // eliminar
        return { ...a, elementos: elems.filter((e: ElementoElectrico)=>e.id!==existingId) };
      }
      if (existingId) {
        return { ...a, elementos: elems.map((e: ElementoElectrico)=>e.id===data.id?data:e) };
      }
      return { ...a, elementos: [...elems, data] };
    });
    setSymDialog(null);
  },[activeAmbiente, symDialog, updateAmbiente]);
*/
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
            onUpdateMeta={(meta: any) =>updateProject(activeProjectId,(p: Project)=>({...p,meta}))}
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
ReactDOM.createRoot(document.getElementById('root')!).render(<App/>);