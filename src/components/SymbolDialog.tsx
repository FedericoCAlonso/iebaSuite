// ═══════════════════════════════════════════════════════════════════════════
// MODULE: components/SymbolDialog.tsx
// ═══════════════════════════════════════════════════════════════════════════

import { useState } from 'react';
import type { ElementoElectrico } from '../types';
import type { DefinicionSimbolo } from '../lib/symbols';
import { F } from './Field';   
import { createElemento } from '../lib/storage';
import { pxToM } from '../lib/geometry';
import type { SymbolDialogData } from '../App';

interface SymbolDialogProps {
  /** Datos provenientes del clic en el plano o del componente ElectricalCard */
  clickData: SymbolDialogData;
  /** Retorna el elemento editado/creado, o null si se solicita eliminar */
  onConfirm: (data: ElementoElectrico | null) => void;
  onCancel: () => void;
  /** Escala necesaria para mostrar la posición de snap en metros */
  escala?: number; 
  symbolsLib: DefinicionSimbolo[];
}

export function SymbolDialog({ clickData, onConfirm, onCancel, symbolsLib, escala = 50 }: SymbolDialogProps) {
  // Identificamos si estamos en modo edición o creación
  const isEdit = clickData.mode === 'edit';
  const existing = isEdit ? clickData.existing : null;

  // --- Estado Local del Formulario ---
  const [tipo, setTipo] = useState(existing?.tipo || 'sym-boca-techo');
  const [ref, setRef] = useState(existing?.referencia || '');
  const [datos, setDatos] = useState(existing?.datos || []);
  const [mostrar, setMostrar] = useState(existing?.mostrarDato || false);

  const [usarSnap, setUsarSnap] = useState<boolean>(() => {
    if (isEdit && existing?.paredIdx != null) return true;
    if (!isEdit && clickData.mode === 'create' && clickData.snapSegIdx != null) return true;
    return false;
  });

  /**
   * Procesa la confirmación dependiendo del modo
   */
  const handleConfirm = () => {
    if (isEdit && existing) {
      const updated = { 
        ...existing, 
        tipo, 
        referencia: ref, 
        datos, 
        mostrarDato: mostrar 
      };
      
      // Si el usuario desactiva el snap, quitamos la referencia a la pared
      if (!usarSnap) {
        updated.paredIdx = null;
        updated.paredPos = null;
      }
      onConfirm(updated);
    } else if (clickData.mode === 'create') {
      // Creamos un elemento nuevo
      const el = createElemento(tipo, clickData.x, clickData.y);
      el.referencia = ref;
      el.datos = datos;
      el.mostrarDato = mostrar;

      // Inyectamos anclaje solo si el usuario dejó marcado el snap
      if (usarSnap && clickData.snapSegIdx != null) {
        el.paredIdx = clickData.snapSegIdx;
        el.paredPos = clickData.snapPos || 0;
        el.x = 0; 
        el.y = 0;
      }
      onConfirm(el);
    }
  };

  return (
    <div className="overlay" onClick={onCancel}>
      <div className="dialog" onClick={e => e.stopPropagation()}>
        <div className="dialog-title">
          {isEdit ? 'Editar elemento' : 'Insertar símbolo'}
        </div>

        <F label="Tipo de dispositivo">
          <select value={tipo} onChange={e => setTipo(e.target.value)}>
            {symbolsLib.map(s => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </F>

        {/* Snap Control */}
        {(!isEdit && clickData.mode === 'create' && clickData.snapSegIdx != null) && (
          <div className="field-row" style={{ alignItems: 'center', marginBottom: 12, background: 'var(--bg-card)', padding: '8px', borderRadius: '4px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flex: 1 }}>
              <input type="checkbox" checked={usarSnap} onChange={e => setUsarSnap(e.target.checked)} />
              Anclar a la pared más cercana
            </label>
            {usarSnap && (
              <div style={{ fontSize: 11, color: 'var(--green)', fontFamily: 'var(--mono)' }}>
                pos {pxToM(clickData.snapPos || 0, escala).toFixed(2)}m
              </div>
            )}
          </div>
        )}
        
        {isEdit && existing?.paredIdx != null && (
          <div className="field-row" style={{ alignItems: 'center', marginBottom: 12, background: 'var(--bg-card)', padding: '8px', borderRadius: '4px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={usarSnap} onChange={e => setUsarSnap(e.target.checked)} />
              Mantener anclado a pared
            </label>
          </div>
        )}

        <F label="Referencia (ID)">
          <input 
            value={ref} 
            onChange={(e) => setRef(e.target.value)} 
            placeholder="L1, T1, TC2…"
          />
        </F>

        <F label="Mostrar referencia en el plano">
          <select value={mostrar ? 'si' : 'no'} onChange={(e) => setMostrar(e.target.value === 'si')}>
            <option value="no">No</option>
            <option value="si">Sí (etiqueta visible)</option>
          </select>
        </F>

        <div className="sec-hdr">Datos técnicos adicionales</div>
        
        <div className="datos-tecnicos-list">
          {datos.map((d, j) => (
            <div key={j} className="field-row" style={{ alignItems: 'flex-end', gap: '4px', marginBottom: '4px' }}>
              <input 
                style={{ flex: 1 }}
                value={d.clave} 
                placeholder="clave" 
                onChange={(e) => {
                  const a = [...datos];
                  a[j] = { ...d, clave: e.target.value };
                  setDatos(a);
                }}
              />
              <input 
                style={{ flex: 1 }}
                value={d.valor} 
                placeholder="valor" 
                onChange={(e) => {
                  const a = [...datos];
                  a[j] = { ...d, valor: e.target.value };
                  setDatos(a);
                }}
              />
              <button 
                className="btn btn-danger btn-xs" 
                onClick={() => {
                  const a = [...datos];
                  a.splice(j, 1);
                  setDatos(a);
                }}
              >✕</button>
            </div>
          ))}
        </div>

        <button 
          className="btn btn-ghost btn-sm" 
          onClick={() => setDatos([...datos, { clave: '', valor: '' }])}
        >
          + Agregar campo técnico
        </button>

        <div className="dialog-actions" style={{ marginTop: '20px' }}>
          <button className="btn btn-ghost" onClick={onCancel}>Cancelar</button>
          
          {isEdit && (
            <button className="btn btn-danger" onClick={() => onConfirm(null)}>
              Eliminar elemento
            </button>
          )}
          
          <button className="btn btn-acc" onClick={handleConfirm}>
            {isEdit ? 'Guardar cambios' : 'Insertar en plano'}
          </button>
        </div>
      </div>
    </div>
  );
}