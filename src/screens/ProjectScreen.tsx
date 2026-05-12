// ═══════════════════════════════════════════════════════════════════════════
// MODULE: screens/ProjectsScreen.tsx
// Refactorizado para seguir Clean Architecture y SRP.
// ═══════════════════════════════════════════════════════════════════════════

import { ProjectHeader } from '../components/projects/ProjectHeader';
import { ProjectList } from '../components/projects/ProjectList';
import { useProjectsScreen } from '../hooks/useProjectsScreen';
import type { Project } from '../types';

interface ProjectsScreenProps {
  projects: Project[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
  onImport: (data: any) => void;
  onManageSymbols: () => void;
}

/**
 * Pantalla principal de gestión de proyectos.
 * Orquestador declarativo que delega la lógica al hook useProjectsScreen y la UI a subcomponentes.
 */
export function ProjectsScreen({ 
  projects, 
  activeId, 
  onSelect, 
  onCreate, 
  onDelete, 
  onImport,
  onManageSymbols
}: ProjectsScreenProps) {
  
  // Extraemos la lógica de negocio y gestión de archivos al Custom Hook
  const { 
    fileRef, 
    handleImportClick, 
    handleFileChange 
  } = useProjectsScreen(onImport);

  return (
    <div className="screen-projects">
      {/* Encabezado y Acciones */}
      <ProjectHeader 
        onManageSymbols={onManageSymbols}
        onImport={handleImportClick}
        onCreate={onCreate}
        fileRef={fileRef}
        onFileChange={handleFileChange}
      />

      {/* Listado de Proyectos */}
      <ProjectList 
        projects={projects}
        activeId={activeId}
        onSelect={onSelect}
        onDelete={onDelete}
      />
    </div>
  );
}