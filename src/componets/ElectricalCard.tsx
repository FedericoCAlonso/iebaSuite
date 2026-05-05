// ═══════════════════════════════════════════════════════════════════════════
// MODULE: components/ElectricalCard.jsx
// En React: src/components/ElectricalCard.tsx
// ═══════════════════════════════════════════════════════════════════════════

import React from 'react';
import { SIMBOLOS_LIBRES, SIMBOLOS_PARED, SIMBOLOS_INFO, ElementoElectrico } from '../types';
import { NumInput } from './NumImput';
import { Card } from './Card';
import { F } from './Field';

interface ElectricalCardProps {
  el: ElementoElectrico;
  index: number;
  wallCount: number;
  onChange: (el: ElementoElectrico) => void;
  onRemove: () => void;
}

export function ElectricalCard({ el, index, wallCount, onChange, onRemove }: ElectricalCardProps) {
  const info = SIMBOLOS_INFO[el.tipo] || { label: el.tipo };
  const esPared = SIMBOLOS_PARED.includes(el.tipo);

  return (
    <Card
      idx={`E${index}`} idxColor="var(--red)"
      title={info.label}
      badge={el.referencia||'—'}
      onRemove={onRemove}
    >
      <F label="Tipo de símbolo">
        <select value={el.tipo} onChange={(e: React.ChangeEvent<HTMLSelectElement>)=>onChange({...el,tipo:e.target.value,paredIdx:SIMBOLOS_PARED.includes(e.target.value)?el.paredIdx:null})}>
          <optgroup label="— Libre (techo/planta)">
            {SIMBOLOS_LIBRES.map(id=><option key={id} value={id}>{SIMBOLOS_INFO[id]?.label||id}</option>)}
          </optgroup>
          <optgroup label="— De pared">
            {SIMBOLOS_PARED.map(id=><option key={id} value={id}>{SIMBOLOS_INFO[id]?.label||id}</option>)}
          </optgroup>
        </select>
      </F>
      <div className="field-row">
        <F label="Referencia (L1, T2…)">
          <input value={el.referencia||''} onChange={(e: React.ChangeEvent<HTMLInputElement>)=>onChange({...el,referencia:e.target.value})} placeholder="L1"/>
        </F>
        <F label="Mostrar dato en SVG">
          <select value={el.mostrarDato?'si':'no'} onChange={(e: React.ChangeEvent<HTMLSelectElement>)=>onChange({...el,mostrarDato:e.target.value==='si'})}>
            <option value="no">No</option>
            <option value="si">Sí (1er dato)</option>
          </select>
        </F>
      </div>
      {esPared ? (
        <div className="field-row">
          <F label="Pared #">
            <NumInput value={el.paredIdx??0} onChange={(v: number)=>onChange({...el,paredIdx:Math.max(0,Math.min(wallCount-1,Math.round(v)))})}/>
          </F>
          <F label="Pos. en pared (m)">
            <NumInput value={el.paredPos!=null?(el.paredPos*(el._escala||50)/1000):0} onChange={(v: number)=>onChange({...el,paredPos:v*(el._escala||50)/1000})}/>
          </F>
        </div>
      ) : (
        <div className="field-row">
          <F label="X (px plano)">
            <NumInput value={Math.round(el.x||0)} onChange={(v: number)=>onChange({...el,x:v})}/>
          </F>
          <F label="Y (px plano)">
            <NumInput value={Math.round(el.y||0)} onChange={(v: number)=>onChange({...el,y:v})}/>
          </F>
        </div>
      )}
      <div className="sec-hdr">Datos técnicos</div>
      {(el.datos||[]).map((d: {clave: string; valor: string}, j: number)=>(
        <div key={j} className="field-row" style={{alignItems:'flex-end'}}>
          <input value={d.clave||''} placeholder="clave" onChange={(e: React.ChangeEvent<HTMLInputElement>)=>{const a=[...el.datos];a[j]={...d,clave:e.target.value};onChange({...el,datos:a});}}/>
          <input value={d.valor||''} placeholder="valor" onChange={(e: React.ChangeEvent<HTMLInputElement>)=>{const a=[...el.datos];a[j]={...d,valor:e.target.value};onChange({...el,datos:a});}}/>
          <button className="btn btn-danger btn-xs" onClick={()=>{const a=[...el.datos];a.splice(j,1);onChange({...el,datos:a});}}>✕</button>
        </div>
      ))}
      <button className="btn btn-ghost btn-sm" onClick={()=>onChange({...el,datos:[...(el.datos||[]),{clave:'',valor:''}]})}>+ Dato</button>
    </Card>
  );
}
