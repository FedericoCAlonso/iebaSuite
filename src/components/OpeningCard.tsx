// ═══════════════════════════════════════════════════════════════════════════
// MODULE: components/OpeningCard.jsx
// En React: src/components/OpeningCard.tsx
// ═══════════════════════════════════════════════════════════════════════════
import React from 'react';
import { NumInput } from './NumImput';
import { Card } from './Card';
import { F } from './Field';
import {type Abertura } from '../types';

interface OpeningCardProps {
  ab: Abertura;
  index: number;
  wallCount: number;
  onChange: (ab: Abertura) => void;
  onRemove: () => void;
}

export function OpeningCard({ ab, index, wallCount, onChange, onRemove }: OpeningCardProps) {
  return (
    <Card
      idx={`A${index}`} idxColor="var(--blue)"
      title={`${(ab.tipo||'abertura').toUpperCase()} · Pared ${ab.pared}`}
      badge={`${ab.ancho||'?'}m`}
      onRemove={onRemove}
    >
      <div className="field-row">
        <F label="Tipo">
          <select value={ab.tipo||'puerta'} onChange={(e: React.ChangeEvent<HTMLSelectElement>)=>onChange({...ab,tipo:( e.target.value as Abertura['tipo'])})}>
            <option value="puerta">Puerta</option>
            <option value="ventana">Ventana</option>
            <option value="vano">Vano</option>
          </select>
        </F>
        <F label="Pared #">
          <NumInput value={ab.pared||0} onChange={(v: number)=>onChange({...ab,pared:Math.max(0,Math.min(wallCount-1,Math.round(v)))})}/>
        </F>
      </div>
      <div className="field-row">
        <F label="Posición (m)">
          <NumInput value={ab.posicion||0} onChange={(v: number)=>onChange({...ab,posicion:v})}/>
        </F>
        <F label="Ancho (m)">
          <NumInput value={ab.ancho||0.9} onChange={(v: number)=>onChange({...ab,ancho:v})}/>
        </F>
      </div>
      {ab.tipo==='puerta' && (
        <div className="field-row">
          <F label="Hojas">
            <select value={ab.hojas||1} onChange={(e: React.ChangeEvent<HTMLSelectElement>)=>onChange({...ab,hojas:parseInt(e.target.value)})}>
              <option value={1}>Simple</option>
              <option value={2}>Doble</option>
            </select>
          </F>
          <F label="Abre hacia">
            <select value={ab.lado||'interior'} onChange={(e: React.ChangeEvent<HTMLSelectElement>)=>onChange({...ab,lado:e.target.value})}>
              <option value="interior">Interior</option>
              <option value="exterior">Exterior</option>
            </select>
          </F>
          <F label="Sentido">
            <select value={ab.sentido||'derecha'} onChange={(e: React.ChangeEvent<HTMLSelectElement>)=>onChange({...ab,sentido:e.target.value})}>
              <option value="derecha">Derecha</option>
              <option value="izquierda">Izquierda</option>
            </select>
          </F>
        </div>
      )}
    </Card>
  );
}