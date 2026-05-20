import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCurrentProject } from '../../core/ProjectContext'
import { useSymbols } from '../../core/SymbolsContext'
import { EditorTabProvider } from '../../core/EditorTabContext'
import { AppHeader } from '../../components/AppHeader'
import { EditorScreen } from './EditorScreen'
import { Preview } from './components/Preview'
import { MasterView } from './components/MasterView'
import type { Project, EditorTab } from '../../types/index'

const PLANTA_TABS = ['resumen', 'general', 'hoja', 'paredes', 'aberturas', 'maestro', 'cobertura'] as const
const ELECTRICO_TABS = ['resumen', 'electrico', 'circuitos', 'conexiones'] as const

export function RelevadorTool() {
  const navigate = useNavigate()
  const [editorMode, setEditorMode] = useState<'planta' | 'electrico'>('planta')
  const { symbolsLib } = useSymbols()
  const { 
    activeProject,
    activeAmbiente,
    activeAmbienteId,
    setActiveAmbienteId,
    updateProject,
    updateAmbiente,
    addAmbiente,
    deleteAmbiente,
    undoAmbiente,
    canUndo,
    ui,
    actions
  } = useCurrentProject()

  const handleModeChange = (next: 'planta' | 'electrico') => {
    setEditorMode(next)
    const valid = next === 'planta' ? PLANTA_TABS : ELECTRICO_TABS
    if (!(valid as readonly string[]).includes(ui.activeTab)) {
      ui.setActiveTab(valid[0] as EditorTab)
    }
  }

  const isPlanta = editorMode === 'planta'
  const showMasterView = isPlanta && ui.activeTab === 'maestro'

  const modeSelector = (
    <select
      value={editorMode}
      onChange={e => handleModeChange(e.target.value as 'planta' | 'electrico')}
      style={{ fontSize: 12, padding: '1px 4px', marginLeft: 6 }}
    >
      <option value="planta">🏗️ Planta</option>
      <option value="electrico">⚡ Eléctrico</option>
    </select>
  )

  return (
    <div className="app tool-relevador">
      <AppHeader
        screen="editor"
        activeProject={activeProject}
        activeAmbienteName={activeAmbiente?.nombre}
        canUndo={canUndo}
        modeSelector={modeSelector}
        onGoHome={() => navigate('/')}
        onUndo={undoAmbiente}
        onShowExport={() => ui.modals.setShowExport(true)}
      />

      <main className="main-content">
        <div className="workspace">
          {!activeAmbiente || !activeAmbienteId ? (
            <div className="empty" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              Cargando ambiente...
            </div>
          ) : (
            <EditorTabProvider activeTab={ui.activeTab} setActiveTab={ui.setActiveTab}>
              {showMasterView ? (
                <MasterView
                  project={activeProject}
                  symbolsLib={symbolsLib}
                  onUpdateAmbiente={(id, fn) => updateProject(
                    activeProject.id,
                    p => ({ ...p, ambientes: p.ambientes.map(a => a.id === id ? fn(a) : a) })
                  )}
                  onUpdateProject={(fn) => updateProject(activeProject.id, fn)}
                  onSelectAmbiente={setActiveAmbienteId}
                />
              ) : (
                <>
                  <div className={`panel-left ${ui.mobileEditorVisible ? 'mobile-visible' : ''}`}>
                    <EditorScreen
                      mode={editorMode}
                      project={activeProject}
                      activeAmbiente={activeAmbiente}
                      activeAmbienteId={activeAmbienteId}
                      symbolsLib={symbolsLib}
                      onUpdateMeta={(meta: Project['meta']) => updateProject(
                        activeProject.id, (p: Project) => ({ ...p, meta })
                      )}
                      onUpdateAmbiente={updateAmbiente}
                      onUpdateProject={(fn: (p: Project) => Project) => updateProject(activeProject.id, fn)}
                      onAddAmbiente={addAmbiente}
                      onDeleteAmbiente={deleteAmbiente}
                      onSelectAmbiente={setActiveAmbienteId}
                      onSymbolDialog={ui.modals.setSymDialog}
                      onShowNetlist={() => ui.modals.setShowNetlist(true)}
                    />
                  </div>
                  <div className="panel-right">
                    <Preview
                      project={activeProject}
                      ambiente={activeAmbiente}
                      meta={activeProject.meta}
                      symbolsLib={symbolsLib}
                      onCanvasClick={actions.handleCanvasClick}
                    />
                  </div>
                </>
              )}
            </EditorTabProvider>
          )}
        </div>
      </main>

      <button
        className="mobile-view-toggle"
        onClick={ui.toggleMobileEditor}
        title={ui.mobileEditorVisible ? 'Ver plano' : 'Editar datos'}
      >
        {ui.mobileEditorVisible ? '🗺️' : '✏️'}
      </button>
    </div>
  )
}
