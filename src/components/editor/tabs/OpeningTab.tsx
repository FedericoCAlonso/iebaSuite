import React from 'react';
import { RENDERER } from '../../../lib/renderer';
import { OpeningCard } from '../../OpeningCard';
import { type Project, type Ambiente, type Abertura } from '../../../types';

interface OpeningTabProps {
  project: Project;
  activeAmbiente: Ambiente;
  activeAmbienteId: string;
  updateOpenings: (fn: (aberturas: Abertura[]) => Abertura[]) => void;
  onLinkOpening: (targetAmbId: string, targetOpeningId: string, currentOpeningId: string) => void;
}

/**
 * Pestaña para la gestión de aberturas (puertas, ventanas, etc.)
 */
export const OpeningTab: React.FC<OpeningTabProps> = React.memo(({ 
  project, 
  activeAmbiente, 
  activeAmbienteId, 
  updateOpenings,
  onLinkOpening
}) => {
  return (
    <>
      <div className="info-helper">
        🖱 Tocá una pared en el plano para agregar abertura.<br />
        O usá el botón "+" para ingresarla a mano.
      </div>
      {activeAmbiente.aberturas.map((ab, i) => (
        <OpeningCard
          key={ab.id}
          ab={ab}
          index={i}
          wallCount={RENDERER.buildSegs(activeAmbiente, project.meta).allSegs.length}
          ambientes={project.ambientes}
          activeAmbienteId={activeAmbienteId}
          onLinkOpening={onLinkOpening}
          onChange={(nab) => updateOpenings(ps => ps.map((x, j) => j === i ? nab : x))}
          onRemove={() => updateOpenings(ps => ps.filter((_, j) => j !== i))}
        />
      ))}

      <button 
        className="btn btn-acc" 
        style={{ width: '100%', marginTop: '16px' }}
        onClick={() => {
          const { allSegs } = RENDERER.buildSegs(activeAmbiente, project.meta);
          if (allSegs.length === 0) {
            alert("Primero definí las paredes del ambiente.");
            return;
          }
          updateOpenings(os => [...os, {
            id: Date.now().toString(),
            pared: 0,
            tipo: 'puerta',
            posicion: 0.5,
            ancho: 0.9,
            hojas: 1,
            lado: 'interior',
            sentido: 'derecha'
          }]);
        }}
      >
        + Nueva Abertura
      </button>
    </>
  );
});
