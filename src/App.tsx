import { useCallback, useState } from 'react';
import ReactDOM from 'react-dom/client';

// Hooks
import { useProjects } from './hooks/useProjects';
import { useToast } from './hooks/useToast';

// Componentes
import { ProjectsScreen } from './screens/ProjectScreen';
import { EditorScreen } from './screens/EditorScreen';
import { Preview } from './components/Preview';
import { SymbolDialog } from './components/SymbolDialog';
import { ExportDialog } from './components/ExportDialog';

// Motores de lógica (Refactorizados a exportación nominal)
import * as STORAGE from './lib/storage';
import type { Project, ElementoElectrico, Ambiente } from './types';
import '../style.css';

// Tipado para el flujo de símbolos
export type SymbolDialogData = 
  | { mode: 'create'; x: number; y: number; snapSegIdx?: number; snapPos?: number }
  | { mode: 'edit'; existing: ElementoElectrico };

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
  const [symDialog, setSymDialog] = useState<SymbolDialogData | null>(null);
  const [showExport, setShowExport] = useState(false);
  const { toast, show: showToast } = useToast();

  // --- Handlers de Navegación ---
  const handleSelectProject = (id: string) => { 
    selectProject(id); 
    setScreen('editor'); 
  };

  const handleCreateProject = () => { 
    createProject(); 
    setScreen('editor'); 
  };

  const handleSymbolDialog = useCallback((data: SymbolDialogData) => {
    setSymDialog(data);
  }, []);

  /**
   * Procesa la confirmación del SymbolDialog.
   * Maneja inserción, edición y borrado físico de elementos.
   */
  const handleSymConfirm = useCallback((updatedElement: ElementoElectrico | null) => {
    if (!activeAmbiente) return;

    updateAmbiente((amb: Ambiente) => {
      let nuevosElementos: ElementoElectrico[];
      
      // Caso 1: Borrado (el diálogo devuelve null y veníamos de edición)
      if (updatedElement === null && symDialog?.mode === 'edit') {
        nuevosElementos = amb.elementos.filter(e => e.id !== symDialog.existing.id);
      } 
      // Caso 2: Actualización de existente
      else if (updatedElement && symDialog?.mode === 'edit') {
        nuevosElementos = amb.elementos.map(e => e.id === updatedElement.id ? updatedElement : e);
      } 
      // Caso 3: Inserción de nuevo
      else if (updatedElement && symDialog?.mode === 'create') {
        nuevosElementos = [...amb.elementos, updatedElement];
      } 
      else return amb; // Si no hay match, no tocamos nada
      
      return { ...amb, elementos: nuevosElementos };
    });
    
    setSymDialog(null);
  }, [activeAmbiente, symDialog, updateAmbiente]);

  /**
   * Importación con Normalización:
   * Convierte proyectos de versiones anteriores o planos sueltos al esquema de Ambientes.
   */
  const handleImportProject = (data: any) => {
    // Creamos una base limpia con la factory de storage
    const newProject: Project = {
      ...STORAGE.createProject(),
      ...data,
      id: Date.now().toString(), // Generamos ID único para la instancia local
      updatedAt: Date.now(),
      // Si el JSON no tiene ambientes, movemos los datos de la raíz al primer ambiente
      ambientes: data.ambientes || [{ 
        ...STORAGE.createAmbiente('Ambiente Importado'), 
        paredes: data.paredes || [], 
        aberturas: data.aberturas || [], 
        elementos: data.elementos || [] 
      }]
    };

    // Limpiamos propiedades residuales que podrían venir en la raíz del JSON
    delete (newProject as any).paredes;
    delete (newProject as any).aberturas;
    delete (newProject as any).elementos;

    addProject(newProject);
    selectProject(newProject.id);
    setScreen('editor');
    showToast('Proyecto importado correctamente');
  };

  return (
    <div className="app">
      {/* ── Topbar: Navegación y Breadcrumbs ── */}
      <header className="topbar">
        <span className="topbar-logo" onClick={() => setScreen('projects')}>ieBA</span>
        {screen === 'editor' && activeProject && (
          <span className="topbar-crumb">▸ <span>{activeProject.meta.nombre}</span></span>
        )}
        <div className="topbar-sep"/>
        {screen === 'editor' && (
          <div className="topbar-actions">
             <button className="btn btn-ghost btn-sm" onClick={() => setShowExport(true)}>Exportar</button>
             <button className="btn btn-ghost btn-sm" onClick={() => setScreen('projects')}>Proyectos</button>
          </div>
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
          /* WORKSPACE: Solo se monta si tenemos un proyecto y ambiente cargado */
          activeProject && activeAmbiente && activeAmbienteId ? (
            <div className="workspace">
              <EditorScreen
                project={activeProject}
                activeAmbiente={activeAmbiente}
                activeAmbienteId={activeAmbienteId}
                onUpdateMeta={(meta: any) => {
                  if (activeProjectId) updateProject(activeProjectId, (p: Project) => ({ ...p, meta }));
                }}
                onUpdateAmbiente={updateAmbiente}
                onAddAmbiente={addAmbiente}
                onDeleteAmbiente={deleteAmbiente}
                onSelectAmbiente={setActiveAmbienteId}
                onSymbolDialog={handleSymbolDialog}
              />
              <Preview
                ambiente={activeAmbiente}
                meta={activeProject.meta}
                onInsertElemento={handleSymbolDialog}
              />
            </div>
          ) : (
            <div className="empty-state">
              <p>No se pudo cargar el ambiente. Seleccione un proyecto válido.</p>
              <button className="btn btn-acc" onClick={() => setScreen('projects')}>Volver a Proyectos</button>
            </div>
          )
        )}
      </main>

      {/* ── Modales y Notificaciones ── */}
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

// Inicialización del DOM
const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(<App />);
}