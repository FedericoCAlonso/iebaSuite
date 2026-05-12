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
      <button 
        className="btn btn-acc" 
        style={{ width: '100%', marginTop: '16px' }}
        onClick={() => updateCircuitos(cs => [...cs, {
          id: Date.now().toString(),
          nombre: `C${cs.length + 1}`,
          tipo: 'TUG',
          seccion: 2.5,
          proteccion: '16A TM',
          cantConductores: 2,
          conducto: 'PVC 20mm',
          color: '#' + Math.floor(Math.random()*16777215).toString(16)
        }])}
      >
        + Nuevo Circuito
      </button>
      {circuitos.length === 0 && (
        <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>
          No hay circuitos definidos. Agregá el primero.
        </div>
      )}
    </>
  );
});
