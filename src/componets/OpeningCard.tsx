// ═══════════════════════════════════════════════════════════════════════════
// MODULE: components/OpeningCard.jsx
// En React: src/components/OpeningCard.tsx
// ═══════════════════════════════════════════════════════════════════════════
import {NumInput } from './NumImput';
import { Card } from './Card';
import { F } from './Field';  


export function OpeningCard({ ab, index, wallCount, onChange, onRemove }) {
  return (
    <Card
      idx={`A${index}`} idxColor="var(--blue)"
      title={`${(ab.tipo||'abertura').toUpperCase()} · Pared ${ab.pared}`}
      badge={`${ab.ancho||'?'}m`}
      onRemove={onRemove}
    >
      <div className="field-row">
        <F label="Tipo">
          <select value={ab.tipo||'puerta'} onChange={e=>onChange({...ab,tipo:e.target.value})}>
            <option value="puerta">Puerta</option>
            <option value="ventana">Ventana</option>
            <option value="vano">Vano</option>
          </select>
        </F>
        <F label="Pared #">
          <NumInput value={ab.pared||0} onChange={v=>onChange({...ab,pared:Math.max(0,Math.min(wallCount-1,Math.round(v)))})}/>
        </F>
      </div>
      <div className="field-row">
        <F label="Posición (m)">
          <NumInput value={ab.posicion||0} onChange={v=>onChange({...ab,posicion:v})} step={0.01}/>
        </F>
        <F label="Ancho (m)">
          <NumInput value={ab.ancho||0.9} onChange={v=>onChange({...ab,ancho:v})} step={0.01}/>
        </F>
      </div>
      {ab.tipo==='puerta' && (
        <div className="field-row">
          <F label="Hojas">
            <select value={ab.hojas||1} onChange={e=>onChange({...ab,hojas:parseInt(e.target.value)})}>
              <option value={1}>Simple</option>
              <option value={2}>Doble</option>
            </select>
          </F>
          <F label="Abre hacia">
            <select value={ab.lado||'interior'} onChange={e=>onChange({...ab,lado:e.target.value})}>
              <option value="interior">Interior</option>
              <option value="exterior">Exterior</option>
            </select>
          </F>
          <F label="Sentido">
            <select value={ab.sentido||'derecha'} onChange={e=>onChange({...ab,sentido:e.target.value})}>
              <option value="derecha">Derecha</option>
              <option value="izquierda">Izquierda</option>
            </select>
          </F>
        </div>
      )}
    </Card>
  );
}