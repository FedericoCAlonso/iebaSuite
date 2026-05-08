// ═══════════════════════════════════════════════════════════════════════════
// MODULE: screens/ProjectsScreen.tsx
// ═══════════════════════════════════════════════════════════════════════════

import React, { useRef } from 'react';
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

export function ProjectsScreen({ 
  projects, 
  activeId, 
  onSelect, 
  onCreate, 
  onDelete, 
  onImport,
  onManageSymbols
}: ProjectsScreenProps) {
  
  // Tipamos el Ref para un elemento de entrada HTML
  const fileRef = useRef<HTMLInputElement>(null);

  /**
   * Maneja la lectura de archivos locales (.json)
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result;
        if (typeof content === 'string') {
          const parsed = JSON.parse(content);
          onImport(parsed);
        }
      } catch (err) {
        console.error("Error al importar el proyecto:", err);
        alert("El archivo no es un JSON de proyecto válido.");
      }
    };
    
    reader.readAsText(file);
    
    // Limpiamos el valor del input para permitir importar el mismo archivo dos veces
    e.target.value = '';
  };

  return (
    <div className="screen-projects">
      <div className="screen-header">
        <span className="screen-title">Mis Proyectos</span>
        <div className="header-actions">
          <button 
            className="btn btn-ghost btn-sm" 
            onClick={onManageSymbols}
          >
            ⚙️ Símbolos
          </button>
          <button 
            className="btn btn-ghost btn-sm" 
            onClick={() => fileRef.current?.click()}
          >
            ↑ Importar
          </button>
          <button 
            className="btn btn-acc btn-sm" 
            onClick={onCreate}
          >
            + Nuevo Proyecto
          </button>
        </div>

        {/* Input oculto para la gestión de archivos */}
        <input 
          ref={fileRef} 
          type="file" 
          accept=".json" 
          style={{ display: 'none' }} 
          onChange={handleFileChange}
        />
      </div>

      <div className="project-list">
        {projects.length === 0 && (
          <div className="empty">
            Sin proyectos guardados.<br/>
            Comenzá creando uno nuevo o importando un backup.
          </div>
        )}

        {projects.map((p) => (
          <div 
            key={p.id} 
            className={`project-item ${p.id === activeId ? 'active' : ''}`} 
            onClick={() => onSelect(p.id)}
          >
            <div className="project-info" style={{ flex: 1 }}>
              <div className="project-name">
                {p.meta.nombre || 'Proyecto sin nombre'}
              </div>
              <div className="project-meta">
                Escala 1:{p.meta.escala} · {p.ambientes.length} ambiente(s)
              </div>
              <div className="project-ambientes-tags">
                {p.ambientes.map(a => a.nombre).join(' · ')}
              </div>
            </div>

            <button 
              className="btn btn-danger btn-sm" 
              title="Eliminar proyecto"
              onClick={(e) => {
                e.stopPropagation(); // Evitamos que se dispare el onSelect al borrar
                if (window.confirm(`¿Eliminar "${p.meta.nombre}"?`)) {
                  onDelete(p.id);
                }
              }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}