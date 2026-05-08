import { useCallback, useState } from 'react';

// Hooks
import { useProjects } from './hooks/useProjects';
import { useToast } from './hooks/useToast';

// Componentes
import { ProjectsScreen } from './screens/ProjectScreen';
import { EditorScreen } from './screens/EditorScreen';
import { Preview } from './components/Preview';
import { SymbolDialog } from './components/SymbolDialog';
import { ExportDialog } from './components/ExportDialog';

// Libs y Tipos
import * as STORAGE from './lib/storage';
import * as GEO from './lib/geometry';
import { RENDERER } from './lib/renderer';
import type { Project, Abertura, ElementoElectrico, Ambiente } from './types';

export type SymbolDialogData = 
  | { mode: 'create'; x: number; y: number; snapSegIdx?: number; snapPos?: number }
  | { mode: 'edit'; existing: ElementoElectrico };

/** Tabs del editor — exportado para que Preview pueda tiparlo */
export type EditorTab = 'proyecto' | 'paredes' | 'aberturas' | 'electrico';

type ScreenView = 'projects' | 'editor';

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

  const [screen, setScreen] = useState<ScreenView>('projects');
  const [mobileEditorVisible, setMobileEditorVisible] = useState(true);
  const [symDialog, setSymDialog] = useState<SymbolDialogData | null>(null);
  const [showExport, setShowExport] = useState(false);
  const { toast, show: showToast } = useToast();

  // Tab del editor levantado a App para que Preview pueda reaccionar
  const [activeTab, setActiveTab] = useState<EditorTab>('proyecto');

  // --- Handlers de Proyecto ---

  const handleSelectProject = (id: string) => { 
    selectProject(id); 
    setScreen('editor'); 
    setMobileEditorVisible(true); 
  };

  const handleCreateProject = () => { 
    createProject(); 
    setScreen('editor'); 
    setMobileEditorVisible(true); 
  };

  // --- Handlers de Elementos Eléctricos ---

  const handleSymbolDialog = useCallback((data: SymbolDialogData) => {
    setSymDialog(data);
  }, []);

  const handleSymConfirm = useCallback((updatedElement: ElementoElectrico | null) => {
    if (!activeAmbiente) return;

    updateAmbiente((amb: Ambiente) => {
      let nuevosElementos: ElementoElectrico[];
      if (updatedElement === null && symDialog?.mode === 'edit') {
        nuevosElementos = amb.elementos.filter(e => e.id !== symDialog.existing.id);
      } else if (updatedElement && symDialog?.mode === 'edit') {
        nuevosElementos = amb.elementos.map(e => e.id === updatedElement.id ? updatedElement : e);
      } else if (updatedElement && symDialog?.mode === 'create') {
        nuevosElementos = [...amb.elementos, updatedElement];
      } else return amb;
      
      return { ...amb, elementos: nuevosElementos };
    });
    setSymDialog(null);
  }, [activeAmbiente, symDialog, updateAmbiente]);

  // --- Handler click en el plano según tab activa ---

  /**
   * Manejador unificado de clicks en el plano.
   * Delega a eléctrico o aberturas según la tab activa.
   */
  const handleCanvasClick = useCallback((
    rawX: number,
    rawY: number,
    snapSegIdx: number | undefined,
    snapPos: number | undefined,
    clickedElecId: string | undefined
  ) => {
    if (!activeAmbiente || !activeProject) return;

    // Click en símbolo eléctrico existente → siempre abre edición (cualquier tab)
    if (clickedElecId) {
      const el = activeAmbiente.elementos?.find(x => x.id === clickedElecId);
      if (el) {
        handleSymbolDialog({ mode: 'edit', existing: el });
        return;
      }
    }

    if (activeTab === 'electrico') {
      // Insertar elemento eléctrico (flujo existente)
      handleSymbolDialog({ 
        mode: 'create', 
        x: rawX, 
        y: rawY, 
        snapSegIdx, 
        snapPos 
      });
      return;
    }

    if (activeTab === 'aberturas' && snapSegIdx !== undefined) {
      // Snap a pared: convertir posición px → metros y crear abertura
      const segs = RENDERER.buildSegs(activeAmbiente, activeProject.meta);
      const seg = segs[snapSegIdx];
      if (!seg) return;

      const snapPosPx = snapPos ?? 0;
      const posM = parseFloat(GEO.pxToM(snapPosPx, activeProject.meta.escala).toFixed(2));

      const nuevaAbertura: Abertura = STORAGE.createAbertura({
        pared: snapSegIdx,
        posicion: posM,
      });

      updateAmbiente((amb: Ambiente) => ({
        ...amb,
        aberturas: [...(amb.aberturas || []), nuevaAbertura],
      }));

      showToast(`Abertura en Pared ${snapSegIdx} — ${posM}m`);

      // En mobile: volver al panel editor para ver la abertura recién creada
      setMobileEditorVisible(true);
    }
  }, [activeAmbiente, activeProject, activeTab, handleSymbolDialog, updateAmbiente, showToast]);

  // --- Handler de importación ---

  const handleImportProject = (data: any) => {
    const newProject: Project = {
      ...STORAGE.createProject(),
      ...data,
      id: Date.now().toString(),
      updatedAt: Date.now(),
      ambientes: data.ambientes || [{ 
        ...STORAGE.createAmbiente(), 
        paredes: data.paredes || [], 
        aberturas: data.aberturas || [], 
        elementos: data.elementos || [] 
      }]
    };
    delete (newProject as any).paredes;
    delete (newProject as any).aberturas;
    delete (newProject as any).elementos;

    addProject(newProject);
    selectProject(newProject.id);
    setScreen('editor');
    showToast('Proyecto importado');
  };

  return (
    <div className="app">
      {/* ── Topbar ── */}
      <header className="topbar">
        <span className="topbar-logo" onClick={() => setScreen('projects')}>ieBA</span>
        {screen === 'editor' && activeProject && (
          <span className="topbar-crumb">▸ <span>{activeProject.meta.nombre}</span></span>
        )}
        <span className="topbar-sep"/>
        {screen === 'editor' && (
          <button className="btn btn-ghost btn-sm" onClick={() => setScreen('projects')}>Proyectos</button>
        )}
      </header>

      {/* ── Contenido Principal ── */}
      <main className="main-content">
        {screen === 'projects' ? (
          <ProjectsScreen
            projects={projects}
            activeId={activeProjectId}
            onSelect={handleSelectProject}
            onCreate={handleCreateProject}
            onDelete={deleteProject}
            onImport={handleImportProject}
          />
        ) : (
          activeProject && activeAmbiente && activeAmbienteId ? (
            <div className="workspace">
              {/* Panel Izquierdo: Editor */}
              <div className={`panel-left ${mobileEditorVisible ? 'mobile-visible' : ''}`}>
                <EditorScreen
                  project={activeProject}
                  activeAmbiente={activeAmbiente}
                  activeAmbienteId={activeAmbienteId}
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  onUpdateMeta={(meta: any) => {
                    if (activeProjectId) updateProject(activeProjectId, (p: Project) => ({ ...p, meta }));
                  }}
                  onUpdateAmbiente={updateAmbiente}
                  onAddAmbiente={addAmbiente}
                  onDeleteAmbiente={deleteAmbiente}
                  onSelectAmbiente={setActiveAmbienteId}
                  onSymbolDialog={handleSymbolDialog}
                />
              </div>

              {/* Panel Derecho: Preview */}
              <div className="panel-right">
                <Preview
                  ambiente={activeAmbiente}
                  meta={activeProject.meta}
                  activeTab={activeTab}
                  onCanvasClick={handleCanvasClick}
                />
              </div>

              {/* Botón de cambio de modo (solo visible en Mobile vía CSS) */}
              <button 
                className="mobile-view-toggle"
                onClick={() => setMobileEditorVisible(!mobileEditorVisible)}
              >
                {mobileEditorVisible ? '📐' : '📝'}
              </button>
            </div>
          ) : (
            <div className="empty-state">
              <p>No se pudo cargar el ambiente.</p>
              <button className="btn btn-acc" onClick={() => setScreen('projects')}>Volver</button>
            </div>
          )
        )}
      </main>

      {/* ── Modales ── */}
      {symDialog && (
        <SymbolDialog
          clickData={symDialog}
          onConfirm={handleSymConfirm}
          onCancel={() => setSymDialog(null)}
          escala={activeProject?.meta.escala}
        />
      )}

      {showExport && activeProject && (
        <ExportDialog
          project={activeProject}
          onClose={() => setShowExport(false)}
          onToast={showToast}
        />
      )}

      {toast && <div className="toast animate-in">{toast}</div>}
    </div>
  );
}