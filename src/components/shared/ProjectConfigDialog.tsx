import { useState } from 'react';
import { F } from '../../ui/Field';
import { NumInput } from '../../ui/NumInput';
import { Modal } from '../../ui/Modal';
import { useClients } from '../../core/ClientContext';
import { type Project } from '../../types/index';

interface ProjectConfigDialogProps {
  project: Project;
  onUpdate: (id: string, fn: (p: Project) => Project) => void;
  onClose: () => void;
}

export function ProjectConfigDialog({ project, onUpdate, onClose }: ProjectConfigDialogProps) {
  const [nombre, setNombre] = useState(project.nombre || '');
  const [escala, setEscala] = useState(project.escala ?? 50);
  const [grosorPared, setGrosorPared] = useState(project.grosor_pared_default ?? 0.15);
  const [alturaDefault, setAlturaDefault] = useState(project.alturaDefault ?? 2.6);
  const [clienteId, setClienteId] = useState(project.clienteId || '');
  const { clients } = useClients();

  const handleSave = () => {
    onUpdate(project.id, p => ({
      ...p,
      nombre,
      escala,
      grosor_pared_default: grosorPared,
      alturaDefault,
      clienteId
    }));
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
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          autoFocus
        />
      </F>

      <F label="Cliente asignado">
        <select
          value={clienteId}
          onChange={e => setClienteId(e.target.value)}
        >
          <option value="">Sin cliente</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>
              {c.razonSocial}{c.dniCuit ? ` — ${c.dniCuit}` : ''}
            </option>
          ))}
        </select>
      </F>

      <div className="field-row">
        <F label="Escala 1:">
          <NumInput
            value={escala}
            onChange={v => setEscala(Math.round(v) || 50)}
          />
        </F>
        <F label="Grosor pared (m)">
          <NumInput
            value={grosorPared}
            onChange={v => setGrosorPared(v)}
          />
        </F>
        <F label="Altura techo def. (m)">
          <NumInput
            value={alturaDefault}
            onChange={v => setAlturaDefault(v)}
          />
        </F>
      </div>
    </Modal>
  );
}
