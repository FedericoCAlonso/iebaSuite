import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCurrentProject } from '../../core/ProjectContext'
import { useSymbols } from '../../core/SymbolsContext'
import { EditorTabProvider } from '../../core/EditorTabContext'
import { AppHeader } from '../../components/AppHeader'
import { EditorScreen } from './EditorScreen'
import { Preview } from './components/Preview'
import { MasterView } from './components/MasterView'
import { useMeasurements } from '../../hooks/useMeasurements'
import { useProfile } from '../../core/ProfileContext'
import { useMeasurementForm } from '../measurements/hooks/useMeasurementForm'
import { useEntityOptions } from '../measurements/hooks/useEntityOptions'
import { MeasurementForm } from '../measurements/components/MeasurementForm'
import { MEDICION_CONFIG } from '../measurements/constants'
import type { Project, EditorTab, ModuleType, SelectedElement } from '../../types/index'

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

  const { profile } = useProfile()
  const operador = profile?.displayName || profile?.email || 'Sin operador'
  const { measurements, addMeasurement, updateMeasurement } = useMeasurements(activeProject?.id || '')
  
  const [measurementModal, setMeasurementModal] = useState<{ elementoId?: string; moduleType?: ModuleType } | null>(null)
  const [selectedElement, setSelectedElement] = useState<SelectedElement>(null)

  useEffect(() => {
    setSelectedElement(null)
  }, [activeAmbienteId])

  const entityOptions = useEntityOptions()
  const measurementForm = useMeasurementForm({
    projectId: activeProject?.id || '',
    operador,
    onAdd: addMeasurement,
    onUpdate: updateMeasurement,
  })

  const handleMeasurementSubmit = async (formElement: HTMLFormElement) => {
    if (!measurementModal || !measurementModal.moduleType) return
    await measurementForm.submit(measurementModal.moduleType, formElement)
    setMeasurementModal(null)
  }

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
    <div className="mode-segmented-control" style={{ display: 'flex', background: 'var(--bg)', borderRadius: '6px', padding: '2px', border: '1px solid var(--border)' }}>
      <button 
        onClick={() => handleModeChange('planta')}
        style={{ padding: '4px 8px', fontSize: 12, borderRadius: '4px', background: isPlanta ? 'var(--primary)' : 'transparent', color: isPlanta ? 'white' : 'var(--text)', border: 'none', cursor: 'pointer', fontWeight: isPlanta ? 600 : 400 }}
      >
        🏗️ Planta
      </button>
      <button 
        onClick={() => handleModeChange('electrico')}
        style={{ padding: '4px 8px', fontSize: 12, borderRadius: '4px', background: !isPlanta ? 'var(--primary)' : 'transparent', color: !isPlanta ? 'white' : 'var(--text)', border: 'none', cursor: 'pointer', fontWeight: !isPlanta ? 600 : 400 }}
      >
        ⚡ Eléctrico
      </button>
    </div>
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
                      onUpdateAmbiente={updateAmbiente}
                      onUpdateProject={(fn: (p: Project) => Project) => updateProject(activeProject.id, fn)}
                      onAddAmbiente={addAmbiente}
                      onDeleteAmbiente={deleteAmbiente}
                      onSelectAmbiente={setActiveAmbienteId}
                      onSymbolDialog={ui.modals.setSymDialog}
                      onShowNetlist={() => ui.modals.setShowNetlist(true)}
                      globalMeasurements={measurements}
                      onNewMeasurementModal={(elementoId, moduleType) => {
                        measurementForm.startNew(moduleType)
                        setMeasurementModal({ elementoId, moduleType })
                      }}
                      selectedElement={selectedElement}
                      onSelectElement={setSelectedElement}
                    />
                  </div>
                  <div className="panel-right">
                    <Preview
                      project={activeProject}
                      ambiente={activeAmbiente}
                      meta={activeProject}
                      symbolsLib={symbolsLib}
                      onCanvasClick={actions.handleCanvasClick}
                      selectedElement={selectedElement}
                      onSelectElement={setSelectedElement}
                    />
                  </div>
                </>
              )}
            </EditorTabProvider>
          )}
        </div>
      </main>

      {/* MODAL DE MEDICIÓN EN EL RELEVADOR */}
      {measurementModal?.moduleType && measurementModal?.elementoId && (
        <div className="measurement-form-modal-overlay" style={{ zIndex: 9999 }}>
          <div className="measurement-form-modal-header" style={{ background: 'var(--bg-elevated)', padding: '16px', borderRadius: '8px 8px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
            <h3 className="measurement-form-modal-title" style={{ margin: 0 }}>
              Nueva medición — {MEDICION_CONFIG[measurementModal.moduleType].label}
            </h3>
            <button className="btn btn-ghost btn-sm" onClick={() => setMeasurementModal(null)}>✕</button>
          </div>
          <div style={{ background: 'var(--bg)', padding: '16px', borderRadius: '0 0 8px 8px', overflowY: 'auto', maxHeight: '80vh' }}>
            <MeasurementForm
              type={measurementModal.moduleType}
              editingMeasurement={null}
              initialData={{ elementoId: measurementModal.elementoId }}
              instrumentos={profile?.instrumentos}
              entityOptions={entityOptions}
              isSubmitting={measurementForm.isSubmitting}
              onSubmit={handleMeasurementSubmit}
              onCancel={() => setMeasurementModal(null)}
            />
          </div>
        </div>
      )}

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
