import { useState } from 'react';
import { F } from '../Field';
import { NumInput } from '../NumImput';
import { type Project } from '../../types/index';

interface ProjectConfigDialogProps {
  project: Project;
  onUpdate: (id: string, fn: (p: Project) => Project) => void;
  onClose: () => void;
}

export function ProjectConfigDialog({ project, onUpdate, onClose }: ProjectConfigDialogProps) {
  const [meta, setMeta] = useState(project.meta);

  const handleSave = () => {
    onUpdate(project.id, p => ({ ...p, meta }));
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h3>Configuración del Proyecto</h3>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>
        
        <div className="modal-body">
          <F label="Nombre del proyecto">
            <input
              value={meta.nombre}
              onChange={e => setMeta({ ...meta, nombre: e.target.value })}
              autoFocus
            />
          </F>
          
          <div className="field-row">
            <F label="Escala 1:">
              <NumInput
                value={meta.escala}
                onChange={v => setMeta({ ...meta, escala: Math.round(v) || 50 })}
              />
            </F>
            <F label="Grosor pared (m)">
              <NumInput
                value={meta.grosor_pared_default}
                onChange={v => setMeta({ ...meta, grosor_pared_default: v })}
              />
            </F>
            <F label="Altura techo def. (m)">
              <NumInput
                value={meta.alturaDefault ?? 2.6}
                onChange={v => setMeta({ ...meta, alturaDefault: v })}
              />
            </F>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave}>Guardar Cambios</button>
        </div>
      </div>
    </div>
  );
}
