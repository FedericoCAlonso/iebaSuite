import { SymbolDialog } from '../SymbolDialog';
import { ExportDialog } from '../ExportDialog';
import { SymbolManagerDialog } from '../SymbolManagerDialog';
import { NetlistReport } from '../NetlistReport';
import { useCurrentProject } from '../../hub/ProjectContextCore';

export function AppModals() {
  const { 
    activeProject, 
    activeAmbiente, 
    symbolsLib, 
    ui, 
    actions, 
    showToast,
    setSymbolsLib
  } = useCurrentProject();

  const { 
    symDialog, setSymDialog, 
    showExport, setShowExport, 
    showSymbolManager, setShowSymbolManager,
    showNetlist, setShowNetlist
  } = ui.modals;

  return (
    <>
      {symDialog && (
        <SymbolDialog
          clickData={symDialog}
          symbolsLib={symbolsLib}
          onConfirm={(el) => actions.handleSymConfirm(el, symDialog)}
          onCancel={() => setSymDialog(null)}
          escala={activeProject?.meta.escala}
        />
      )}

      {showExport && activeProject && (
        <ExportDialog
          project={activeProject}
          symbolsLib={symbolsLib}
          onClose={() => setShowExport(false)}
          onToast={showToast}
        />
      )}

      {showSymbolManager && (
        <SymbolManagerDialog
          symbolsLib={symbolsLib}
          onUpdate={setSymbolsLib}
          onClose={() => setShowSymbolManager(false)}
        />
      )}

      {showNetlist && activeProject && activeAmbiente && (
        <NetlistReport
          project={activeProject}
          ambiente={activeAmbiente}
          onClose={() => setShowNetlist(false)}
        />
      )}
    </>
  );
}
