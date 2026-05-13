import { useNavigate } from 'react-router-dom';
import { useProjects } from '../hooks/useProjects';
import { useProjectsScreen } from '../hooks/useProjectsScreen';
import { ProjectHeader } from '../components/projects/ProjectHeader';
import { ProjectList } from '../components/projects/ProjectList';
import './HubProjects.css';

export function HubProjects() {
  const navigate = useNavigate();
  const { 
    projects, 
    activeProjectId, 
    createProject, 
    deleteProject, 
    addProject 
  } = useProjects();

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

  return (
    <div className="screen-projects">
      <ProjectHeader 
        onManageSymbols={() => {}} // TODO: Implement if needed
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
      />
    </div>
  );
}
