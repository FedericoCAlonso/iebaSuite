import React from 'react';
import { ConexionCard } from '../../ConexionCard';
import { type Project, type Circuito, type Conexion } from '../../../types';

interface ConnectionsTabProps {
  project: Project;
  circuitos: Circuito[];
  conexiones: Conexion[];
  updateConexiones: (fn: (conexiones: Conexion[]) => Conexion[]) => void;
}

/**
 * Pestaña para la gestión del netlist y conexiones inter-boca.
 */
export const ConnectionsTab: React.FC<ConnectionsTabProps> = React.memo(({ 
  project, 
  circuitos, 
  conexiones, 
  updateConexiones 
}) => {
  return (
    <>
      <div className="info-helper">
        🔗 Creá el netlist vinculando bocas entre sí. Estas líneas punteadas se verán en el plano.
      </div>
      {conexiones.map((c, i) => (
        <ConexionCard
          key={c.id}
          conexion={c}
          index={i}
          ambientes={project.ambientes}
          circuitos={circuitos}
          onChange={nc => updateConexiones(ps => ps.map(x => x.id === nc.id ? nc : x))}
          onRemove={() => updateConexiones(ps => ps.filter(x => x.id !== c.id))}
        />
      ))}
      {conexiones.length === 0 && (
        <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>
          No hay conexiones en el netlist. Agregá una para unir dos bocas.
        </div>
      )}
    </>
  );
});
