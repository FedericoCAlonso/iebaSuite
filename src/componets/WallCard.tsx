// ═══════════════════════════════════════════════════════════════════════════
// MODULE: components/WallCard.jsx
// Tarjeta de pared con irregularidades y esquina saliente.
// En React: src/components/WallCard.tsx
// ═══════════════════════════════════════════════════════════════════════════
import React from 'react';
import { Card } from './Card';
import { F } from './Field';
import { NumInput } from './NumImput';
import { Pared, Irregularidad } from '../types';

interface WallCardProps {
  pared: Pared;
  index: number;
  onChange: (pared: Pared) => void;
  onRemove: () => void;
}

export function WallCard({ pared, index, onChange, onRemove }: WallCardProps) {
  const [openIrr, setOpenIrr] = React.useState(false);
  const largoText = pared.largo==='auto'||pared.largo===null?'AUTO':pared.largo?`${pared.largo}m`:'—';
  const angText   = pared.angulo!=null ? `${pared.angulo}°` : '';

  const setIrr = (irrs: Irregularidad[]) => onChange({...pared, irregularidades:irrs});

  return (
    <Card
      idx={`P${index}`}
      title={`${largoText}${angText?' / '+angText:''}`}
      badge={pared.grosor?`g:${pared.grosor}m`:null}
      onRemove={onRemove}
    >
      <div className="field-row">
        <F label="Largo (m o 'auto')">
          <input
            value={pared.largo??''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>)=>{
              const v=e.target.value.toLowerCase()==='auto'?'auto':e.target.value;
              onChange({...pared,largo:v});
            }}
            placeholder="ej: 4.20 o auto"
          />
        </F>
        <F label="Ángulo (°)">
          <NumInput value={pared.angulo??90} onChange={(v: number)=>onChange({...pared,angulo:v})} placeholder="90"/>
        </F>
      </div>
      <div className="field-row">
        <F label="Grosor propio (m)">
          <NumInput value={pared.grosor??''} onChange={(v: number)=>onChange({...pared,grosor:v||null})} placeholder="default"/>
        </F>
        <F label="Mocheta (m, vacío=no)">
          <NumInput
            value={pared.esquina_saliente?.ancho??''}
            onChange={(v: number)=>onChange({...pared,esquina_saliente:v?{ancho:v}:null})}
            placeholder="no"
          />
        </F>
      </div>

      {/* Irregularidades */}
      <div className="sub-card">
        <div className={`card-hdr ${openIrr?'open':''}`} onClick={()=>setOpenIrr(o=>!o)}>
          <span className="card-title-main" style={{fontSize:11}}>Irregularidades</span>
          <span className="card-badge">{(pared.irregularidades||[]).length}</span>
          <span className={`card-chevron ${openIrr?'open':''}`}>▶</span>
        </div>
        {openIrr && (
          <div className="sub-card-body">
            {(pared.irregularidades||[]).map((irr: Irregularidad, j: number)=>(
              <div key={j} className="irr-row">
                <span className="card-idx" style={{color:'var(--text3)'}}>i{j}</span>
                <F label="Pos(m)"><NumInput value={irr.posicion} onChange={(v: number)=>{const a=[...pared.irregularidades];a[j]={...irr,posicion:v};setIrr(a);}} style={{width:58}}/></F>
                <F label="Ancho"><NumInput value={irr.ancho} onChange={(v: number)=>{const a=[...pared.irregularidades];a[j]={...irr,ancho:v};setIrr(a);}} style={{width:58}}/></F>
                <F label="Prof(+/-)"><NumInput value={irr.profundidad} onChange={(v: number)=>{const a=[...pared.irregularidades];a[j]={...irr,profundidad:v};setIrr(a);}} style={{width:58}}/></F>
                <button className="btn btn-danger btn-xs" onClick={()=>{const a=[...pared.irregularidades];a.splice(j,1);setIrr(a);}}>✕</button>
              </div>
            ))}
            <button className="btn btn-ghost btn-sm" onClick={()=>setIrr([...(pared.irregularidades||[]),{posicion:0,ancho:0.5,profundidad:0.1}])}>+ Irregularidad</button>
          </div>
        )}
      </div>
    </Card>
  );
}
