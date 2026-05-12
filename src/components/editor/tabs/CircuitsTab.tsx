import React from 'react';
import { CircuitoCard } from '../../CircuitoCard';
import { type Circuito } from '../../../types';

interface CircuitsTabProps {
  circuitos: Circuito[];
  updateCircuitos: (fn: (circuitos: Circuito[]) => Circuito[]) => void;
}

/**
 * Pestaña para la gestión de circuitos eléctricos.
 */
export const CircuitsTab: React.FC<CircuitsTabProps> = React.memo(({ 
  circuitos, 
  updateCircuitos 
}) => {
  return (
    <>
      <div className="info-helper">
        ⚡ Definí los circuitos del proyecto. Luego asigná cada boca a un circuito.<br />
        Nomenclatura AEA: <strong>TS1.C1</strong> = Circuito C1 del Tablero Seccional 1.
      </div>
      {circuitos.map((c, i) => (
        <CircuitoCard
          key={c.id}
          circuito={c}
          index={i}
          onChange={(nc) => updateCircuitos(cs => cs.map((x, j) => j === i ? nc : x))}
          onRemove={() => updateCircuitos(cs => cs.filter((_, j) => j !== i))}
        />
      ))}
      {circuitos.length === 0 && (
        <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>
          No hay circuitos definidos. Agregá el primero.
        </div>
      )}
    </>
  );
});
