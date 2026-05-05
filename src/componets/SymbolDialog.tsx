
// ═══════════════════════════════════════════════════════════════════════════
// MODULE: components/SymbolDialog.jsx
// Diálogo de inserción/edición de símbolo eléctrico.
// En React: src/components/SymbolDialog.tsx
// ═══════════════════════════════════════════════════════════════════════════
import React from 'react';
import { SIMBOLOS_LIBRES, SIMBOLOS_PARED, SIMBOLOS_INFO, type ElementoElectrico } from '../types';
import { F } from './Field';   
import { STORAGE } from '../lib/storage';

interface SymbolDialogProps {
  clickData: { x: number; y: number; snapSeg?: any; snapPos?: number; snapSegIdx?: number } | { existing: ElementoElectrico };
  onConfirm: (data: ElementoElectrico | null) => void;
  onCancel: () => void;
}

export function SymbolDialog({ clickData, onConfirm, onCancel }: SymbolDialogProps) {
  // clickData: { x, y, snapSeg, snapPos, snapSegIdx } | { existing }
  const existing = 'existing' in clickData ? clickData.existing : null;

  const [tipo, setTipo] = React.useState(existing?.tipo||'sym-boca-techo');
  const [ref,  setRef]  = React.useState(existing?.referencia||'');
  const [datos,setDatos]= React.useState(existing?.datos||[]);
  const [mostrar,setMostrar]=React.useState(existing?.mostrarDato||false);
  const esPared = SIMBOLOS_PARED.includes(tipo);

  const handleConfirm = () => {
    if ('existing' in clickData) {
      onConfirm({ ...existing, tipo, referencia:ref, datos, mostrarDato:mostrar });
    } else {
      const el = STORAGE.newElemento(tipo, clickData.x||100, clickData.y||100);
      el.referencia=ref; el.datos=datos; el.mostrarDato=mostrar;
      if (esPared && clickData.snapSegIdx!=null) {
        el.paredIdx  = clickData.snapSegIdx;
        el.paredPos  = clickData.snapPos||0;
        el.x = 0; el.y = 0;
      }
      onConfirm(el);
    }
  };

  return (
    <div className="overlay" onClick={onCancel}>
      <div className="dialog" onClick={e=>e.stopPropagation()}>
        <div className="dialog-title">{existing?'Editar elemento':'Insertar símbolo'}</div>
        <F label="Tipo">
          <select value={tipo} onChange={e=>setTipo(e.target.value)}>
            <optgroup label="— Libre (techo/planta)">
              {SIMBOLOS_LIBRES.map(id=><option key={id} value={id}>{SIMBOLOS_INFO[id]?.label||id}</option>)}
            </optgroup>
            <optgroup label="— De pared">
              {SIMBOLOS_PARED.map(id=><option key={id} value={id}>{SIMBOLOS_INFO[id]?.label||id}</option>)}
            </optgroup>
          </select>
        </F>
        {esPared && !existing && 'snapSegIdx' in clickData && clickData.snapSegIdx != null && (
          <div style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--green)'}}>
            ✓ Snap a pared #{clickData.snapSegIdx} · pos {((clickData.snapPos||0)*50/1000).toFixed(2)}m
          </div>
        )}
        <F label="Referencia">
          <input value={ref} onChange={(e: React.ChangeEvent<HTMLInputElement>)=>setRef(e.target.value)} placeholder="L1, T1, TC2…"/>
        </F>
        <F label="Mostrar dato en SVG exportado">
          <select value={mostrar?'si':'no'} onChange={(e: React.ChangeEvent<HTMLSelectElement>)=>setMostrar(e.target.value==='si')}>
            <option value="no">No</option><option value="si">Sí (1er dato)</option>
          </select>
        </F>
        <div className="sec-hdr">Datos técnicos</div>
        {datos.map((d: {clave: string; valor: string}, j: number)=>(
          <div key={j} className="field-row" style={{alignItems:'flex-end'}}>
            <input value={d.clave} placeholder="clave" onChange={(e: React.ChangeEvent<HTMLInputElement>)=>{const a=[...datos];a[j]={...d,clave:e.target.value};setDatos(a);}}/>
            <input value={d.valor} placeholder="valor" onChange={(e: React.ChangeEvent<HTMLInputElement>)=>{const a=[...datos];a[j]={...d,valor:e.target.value};setDatos(a);}}/>
            <button className="btn btn-danger btn-xs" onClick={()=>{const a=[...datos];a.splice(j,1);setDatos(a);}}>✕</button>
          </div>
        ))}
        <button className="btn btn-ghost btn-sm" onClick={()=>setDatos([...datos,{clave:'',valor:''}])}>+ Dato</button>
        <div className="dialog-actions">
          <button className="btn btn-ghost" onClick={onCancel}>Cancelar</button>
          {existing && <button className="btn btn-danger" onClick={()=>onConfirm(null)}>Eliminar</button>}
          <button className="btn btn-acc" onClick={handleConfirm}>{existing?'Guardar':'Insertar'}</button>
        </div>
      </div>
    </div>
  );
}
