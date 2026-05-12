import React, { useRef, useEffect } from 'react';
import type { Ambiente, Pared } from '../types';
import { createPared } from '../lib/storage';

interface CargaRapidaParedesProps {
  /** El ambiente activo que contiene los tramos */
  ambiente: Ambiente;
  /** El índice del tramo a editar (por defecto 0) */
  tramoIndex?: number;
  /** Función para mutar el estado del ambiente de forma inmutable */
  updateAmbiente: (fn: (a: Ambiente) => Ambiente) => void;
}

/**
 * Componente de Carga Rápida de Paredes.
 * Optimizado para Mobile First y entrada continua de datos.
 */
export function CargaRapidaParedes({ 
  ambiente, 
  tramoIndex = 0, 
  updateAmbiente 
}: CargaRapidaParedesProps) {
  
  const tramo = ambiente.tramos[tramoIndex];
  const wallsCount = tramo?.paredes.length || 0;
  
  // Refs para manejar el foco de los inputs de largo
  const largoRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Efecto UX: Si se añade una nueva pared, hacemos foco en el campo 'Largo' de la misma.
  useEffect(() => {
    if (wallsCount > 0) {
      const lastInput = largoRefs.current[wallsCount - 1];
      // Pequeño timeout para asegurar que el DOM se ha estabilizado (especialmente en móviles)
      if (lastInput) {
        const timeout = setTimeout(() => {
          lastInput.focus();
          // En móviles, a veces queremos seleccionar el texto para facilitar la sobreescritura del 0
          lastInput.select();
        }, 50);
        return () => clearTimeout(timeout);
      }
    }
  }, [wallsCount]);

  if (!tramo) {
    return <div className="carga-error">⚠️ No se encontró el tramo {tramoIndex + 1}</div>;
  }

  /**
   * Actualiza una propiedad numérica de una pared específica.
   */
  const handleParedChange = (idx: number, key: keyof Pared, val: string) => {
    const numVal = val === '' ? 0 : parseFloat(val);
    
    updateAmbiente(amb => {
      const newTramos = [...amb.tramos];
      const targetTramo = { ...newTramos[tramoIndex] };
      const newParedes = [...targetTramo.paredes];
      
      newParedes[idx] = { 
        ...newParedes[idx], 
        [key]: isNaN(numVal) ? 0 : numVal 
      };
      
      targetTramo.paredes = newParedes;
      newTramos[tramoIndex] = targetTramo;
      
      return { ...amb, tramos: newTramos };
    });
  };

  /**
   * Maneja la navegación por teclado y la auto-creación de filas.
   */
  const handleKeyDown = (e: React.KeyboardEvent, idx: number, field: 'largo' | 'angulo') => {
    // Si presiona Tab o Enter en el ángulo de la última pared, creamos una nueva.
    if ((e.key === 'Tab' || e.key === 'Enter')) {
      const isLastWall = idx === tramo.paredes.length - 1;
      const isAngleField = field === 'angulo';

      if (isLastWall && isAngleField) {
        // Evitamos que el Tab se salga del formulario
        e.preventDefault();
        
        updateAmbiente(amb => {
          const newTramos = [...amb.tramos];
          const targetTramo = { ...newTramos[tramoIndex] };
          
          // Creamos la nueva pared con el ángulo de 90 por defecto
          const nuevaPared = createPared({ largo: 0, angulo: 90 });
          targetTramo.paredes = [...targetTramo.paredes, nuevaPared];
          
          newTramos[tramoIndex] = targetTramo;
          return { ...amb, tramos: newTramos };
        });
      }
    }
  };

  /**
   * Elimina una pared (mínimo debe quedar una).
   */
  const handleRemove = (idx: number) => {
    if (tramo.paredes.length <= 1) return;
    
    updateAmbiente(amb => {
      const newTramos = [...amb.tramos];
      const targetTramo = { ...newTramos[tramoIndex] };
      targetTramo.paredes = targetTramo.paredes.filter((_, i) => i !== idx);
      newTramos[tramoIndex] = targetTramo;
      return { ...amb, tramos: newTramos };
    });
  };

  return (
    <div className="carga-rapida">
      <div className="carga-header">
        <span className="idx">#</span>
        <span className="label">Largo (m)</span>
        <span className="label">Ángulo (°)</span>
        <span className="actions"></span>
      </div>

      <div className="carga-list">
        {tramo.paredes.map((p, i) => (
          <div key={p.id} className="carga-row">
            <div className="idx">{i + 1}</div>
            
            <input
              ref={el => { largoRefs.current[i] = el; }}
              type="number"
              inputMode="decimal"
              step="0.01"
              value={p.largo === 0 ? '' : p.largo}
              onChange={e => handleParedChange(i, 'largo', e.target.value)}
              onKeyDown={e => handleKeyDown(e, i, 'largo')}
              placeholder="0.00"
              aria-label={`Largo pared ${i + 1}`}
            />

            <input
              type="number"
              inputMode="decimal"
              step="1"
              value={p.angulo}
              onChange={e => handleParedChange(i, 'angulo', e.target.value)}
              onKeyDown={e => handleKeyDown(e, i, 'angulo')}
              aria-label={`Ángulo pared ${i + 1}`}
            />

            <button 
              className="btn-del" 
              onClick={() => handleRemove(i)}
              title="Eliminar pared"
              tabIndex={-1} // Evitamos que el Tab pare en el botón de borrar para mayor fluidez
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <button 
        className="btn-add" 
        onClick={() => {
          updateAmbiente(amb => {
            const newTramos = [...amb.tramos];
            const targetTramo = { ...newTramos[tramoIndex] };
            targetTramo.paredes = [...targetTramo.paredes, createPared()];
            newTramos[tramoIndex] = targetTramo;
            return { ...amb, tramos: newTramos };
          });
        }}
      >
        ＋ Agregar Pared Manualmente
      </button>
    </div>
  );
}
