import { SymbolDialog } from './SymbolDialog';
import { ExportDialog } from './ExportDialog';
import { SymbolManagerDialog } from './SymbolManagerDialog';
import { NetlistReport } from './NetlistReport';
import type { Project, Ambiente, ElementoElectrico, SymbolDialogData } from '../types/index';

interface AppModalsProps {
  activeProject: Project | null;
  activeAmbiente: Ambiente | null;
  symbolsLib: any[];
  modals: {
    symDialog: SymbolDialogData | null;
    setSymDialog: (val: SymbolDialogData | null) => void;
    showExport: boolean;
    setShowExport: (val: boolean) => void;
    showSymbolManager: boolean;
    setShowSymbolManager: (val: boolean) => void;
    showNetlist: boolean;
    setShowNetlist: (val: boolean) => void;
  };
  onSymConfirm: (updated: ElementoElectrico | null, dialog: SymbolDialogData) => void;
  onSymbolsUpdate: (lib: any[]) => void;
  onToast: (msg: string) => void;
}

export function AppModals({
  activeProject,
  activeAmbiente,
  symbolsLib,
  modals,
  onSymConfirm,
  onSymbolsUpdate,
  onToast
}: AppModalsProps) {
  const { 
    symDialog, setSymDialog, 
    showExport, setShowExport, 
    showSymbolManager, setShowSymbolManager,
    showNetlist, setShowNetlist
  } = modals;

  return (
    <>
      {symDialog && (
        <SymbolDialog
          clickData={symDialog}
          symbolsLib={symbolsLib}
          onConfirm={(el) => onSymConfirm(el, symDialog)}
          onCancel={() => setSymDialog(null)}
          escala={activeProject?.meta.escala}
        />
      )}

      {showExport && activeProject && (
        <ExportDialog
          project={activeProject}
          symbolsLib={symbolsLib}
          onClose={() => setShowExport(false)}
          onToast={onToast}
        />
      )}

      {showSymbolManager && (
        <SymbolManagerDialog
          symbolsLib={symbolsLib}
          onUpdate={onSymbolsUpdate}
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
