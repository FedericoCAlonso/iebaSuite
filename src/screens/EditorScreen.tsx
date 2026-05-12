

// Layout y Composición
import { EditorLayout } from '../components/editor/EditorLayout';
import { CreationFlowOverlay } from '../components/editor/CreationFlowOverlay';

// Pestañas (Subcomponentes especializados)
import { ProjectTab } from '../components/editor/tabs/ProjectTab';
import { WallsTab } from '../components/editor/tabs/WallsTab';
import { OpeningTab } from '../components/editor/tabs/OpeningTab';
import { ElectricalTab } from '../components/editor/tabs/ElectricalTab';
import { CircuitsTab } from '../components/editor/tabs/CircuitsTab';
import { ConnectionsTab } from '../components/editor/tabs/ConnectionsTab';
import { CoverageTab } from '../components/editor/tabs/CoverageTab';
import { MasterConfigTab } from '../components/editor/tabs/MasterConfigTab';

// Hooks y Lógica
import { useEditorState } from '../hooks/useEditorState';

// Tipos
import {
  type Project, type Ambiente, type SymbolDialogData,
  type EditorTab
} from '../types';

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

/**
 * Orquestador principal de la pantalla del editor.
 * Refactorizado para seguir Clean Architecture y SRP.
 * Delega la lógica de negocio al hook useEditorState y la UI a componentes especializados.
 */
export function EditorScreen(props: EditorScreenProps) {
  const { 
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
  } = props;

  // Extraemos toda la lógica de estado y cálculos pesados al Custom Hook
  const state = useEditorState(
    project, 
    activeAmbiente, 
    onUpdateAmbiente, 
    onUpdateProject
  );

  // Configuración visual de las pestañas
  const tabConfig: Record<EditorTab, { label: string, icon: string }> = {
    proyecto:   { label: 'Proy.', icon: '📋' },
    paredes:    { label: 'Paredes', icon: '🧱' },
    aberturas:  { label: 'Abert.', icon: '🚪' },
    electrico:  { label: 'Bocas', icon: '⚡' },
    circuitos:  { label: 'Circuit.', icon: '🔌' },
    conexiones: { label: 'Conex.', icon: '🔗' },
    maestro:    { label: 'Maestro', icon: '🗺️' },
    cobertura:  { label: 'Cobert.', icon: '☂️' }
  };

  if (!project || !activeAmbiente) {
    return <div className="empty">Sin proyecto seleccionado</div>;
  }

  return (
    <EditorLayout
      sheetBar={
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
          <button 
            className="amb-tab-add" 
            onClick={onAddAmbiente} 
            title="Nueva hoja de relevamiento"
          >＋</button>
        </div>
      }
      tabBar={
        <div className="panel-tabs">
          {(['proyecto', 'paredes', 'aberturas', 'electrico', 'circuitos', 'conexiones', 'maestro', 'cobertura'] as const).map((k) => (
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
      }
      footer={
        activeTab === 'paredes' && !state.creationFlow.active && (
          <button 
            className="btn btn-acc btn-full" 
            onClick={() => state.startCreation('tramo')}
          >
            + Nuevo Tramo
          </button>
        )
      }
    >
      {/* Overlay de Flujo de Creación (Independiente del tab actual si está activo) */}
      <CreationFlowOverlay 
        creationFlow={state.creationFlow}
        allVertices={state.allVertices}
        onCancel={state.cancelCreation}
        onStepChange={state.setCreationStep}
        onAnchorSelect={state.setCreationAnchor}
        onOffsetChange={state.setCreationOffset}
        onConfirm={state.confirmCreation}
      />

      {/* Renderizado Condicional de Pestañas */}
      {activeTab === 'proyecto' && (
        <ProjectTab 
          project={project}
          activeAmbiente={activeAmbiente}
          onUpdateMeta={onUpdateMeta}
          onUpdateAmbiente={onUpdateAmbiente}
          onDeleteAmbiente={onDeleteAmbiente}
        />
      )}

      {activeTab === 'paredes' && !state.creationFlow.active && (
        <WallsTab 
          activeAmbiente={activeAmbiente}
          activeTramoIdx={state.activeTramoIdx}
          setActiveTramoIdx={state.setActiveTramoIdx}
          onUpdateAmbiente={onUpdateAmbiente}
        />
      )}

      {activeTab === 'aberturas' && (
        <OpeningTab 
          project={project}
          activeAmbiente={activeAmbiente}
          activeAmbienteId={activeAmbienteId}
          updateOpenings={state.updateOpenings}
          onLinkOpening={state.linkOpening}
        />
      )}

      {activeTab === 'electrico' && (
        <ElectricalTab 
          project={project}
          activeAmbiente={activeAmbiente}
          symbolsLib={symbolsLib}
          circuitos={state.circuitos}
          updateElectrical={state.updateElectrical}
          updateStructural={state.updateStructural}
          onSymbolDialog={onSymbolDialog}
          onShowNetlist={onShowNetlist}
        />
      )}

      {activeTab === 'circuitos' && (
        <CircuitsTab 
          circuitos={state.circuitos}
          updateCircuitos={state.updateCircuitos}
        />
      )}

      {activeTab === 'conexiones' && (
        <ConnectionsTab 
          project={project}
          circuitos={state.circuitos}
          conexiones={state.conexiones}
          updateConexiones={state.updateConexiones}
        />
      )}

      {activeTab === 'cobertura' && !state.creationFlow.active && (
        <CoverageTab 
          activeAmbiente={activeAmbiente}
          onUpdateAmbiente={onUpdateAmbiente}
          onStartCreation={() => state.startCreation('cobertura')}
        />
      )}

      {activeTab === 'maestro' && (
        <MasterConfigTab 
          activeAmbiente={activeAmbiente}
          onUpdateAmbiente={onUpdateAmbiente}
        />
      )}
    </EditorLayout>
  );
}