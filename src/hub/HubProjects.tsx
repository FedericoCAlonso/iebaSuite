import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '../hooks/useProjects';
import { useProjectsScreen } from '../hooks/useProjectsScreen';
import { ProjectHeader } from '../components/projects/ProjectHeader';
import { ProjectList } from '../components/projects/ProjectList';
import { ProjectConfigDialog } from '../components/shared/ProjectConfigDialog';
import { SymbolManagerDialog } from '../components/SymbolManagerDialog';
import './HubProjects.css';

export function HubProjects() {
  const navigate = useNavigate();
  const projectState = useProjects();
  const { 
    projects, 
    activeProjectId, 
    createProject, 
    deleteProject, 
    addProject,
    symbolsLib,
    setSymbolsLib,
    updateProject
  } = projectState;

  const [configProjectId, setConfigProjectId] = useState<string | null>(null);
  const [isSymbolManagerOpen, setIsSymbolManagerOpen] = useState(false);

  const { 
    fileRef, 
    handleImportClick, 
    handleFileChange 
  } = useProjectsScreen(addProject);

  const handleSelect = (id: string) => {
    navigate(`/proyecto/${id}/relevador`);
  };

  const handleCreate = () => {
    const newProject = createProject();
    navigate(`/proyecto/${newProject.id}/relevador`);
  };

  const projectToConfig = projects.find(p => p.id === configProjectId);

  return (
    <div className="screen-projects">
      <ProjectHeader 
        onManageSymbols={() => setIsSymbolManagerOpen(true)}
        onImport={handleImportClick}
        onCreate={handleCreate}
        fileRef={fileRef}
        onFileChange={handleFileChange}
      />

      <ProjectList 
        projects={projects}
        activeId={activeProjectId}
        onSelect={handleSelect}
        onDelete={deleteProject}
        onConfig={setConfigProjectId}
      />

      {projectToConfig && (
        <ProjectConfigDialog
          project={projectToConfig}
          onUpdate={updateProject}
          onClose={() => setConfigProjectId(null)}
        />
      )}

      {isSymbolManagerOpen && (
        <SymbolManagerDialog
          symbolsLib={symbolsLib}
          onUpdate={setSymbolsLib}
          onClose={() => setIsSymbolManagerOpen(false)}
        />
      )}
    </div>
  );
}
