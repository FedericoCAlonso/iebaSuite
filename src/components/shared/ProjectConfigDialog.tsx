import { useState } from 'react';
import { F } from '../Field';
import { NumInput } from '../NumImput';
import { Modal } from './Modal';
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
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Configuración del Proyecto"
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-acc" onClick={handleSave}>Guardar Cambios</button>
        </>
      }
    >
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
    </Modal>
  );
}

