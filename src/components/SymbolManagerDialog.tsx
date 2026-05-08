// ═══════════════════════════════════════════════════════════════════════════
// MODULE: components/SymbolManagerDialog.tsx
// ═══════════════════════════════════════════════════════════════════════════

import React, { useRef, useState } from 'react';
import type { DefinicionSimbolo } from '../lib/symbols';
import { saveSymbols } from '../lib/symbols';
import { F } from './Field';

interface SymbolManagerDialogProps {
  symbolsLib: DefinicionSimbolo[];
  onUpdate: (symbols: DefinicionSimbolo[]) => void;
  onClose: () => void;
}

export function SymbolManagerDialog({ symbolsLib, onUpdate, onClose }: SymbolManagerDialogProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<DefinicionSimbolo>>({});

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        let svgInner = content;
        try {
          // Parsear SVG robustamente para ignorar metadatos (Inkscape, defs, etc)
          const parser = new DOMParser();
          const doc = parser.parseFromString(content, "image/svg+xml");
          const svgNode = doc.querySelector('svg');
          if (svgNode) {
            const removeSelectors = ['metadata', 'defs', 'title', 'desc', 'style', '[id^="sodipodi"]', '[id^="inkscape"]'];
            removeSelectors.forEach(sel => {
              svgNode.querySelectorAll(sel).forEach(el => el.remove());
            });
            svgInner = svgNode.innerHTML;
          }
        } catch(e) {
          console.warn("Fallo al parsear SVG, usando regex de respaldo.");
          const match = content.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);
          if (match) svgInner = match[1];
        }

        // Preparar nuevo símbolo
        const newId = `sym-custom-${Date.now()}`;
        const newSymbol: DefinicionSimbolo = {
          id: newId,
          label: file.name.replace('.svg', ''),
          escalaBase: 1,
          anclaje: { x: 0, y: 0 },
          svgContent: svgInner
        };
        
        // Agregar a la base y abrir modo edición
        const updated = [...symbolsLib, newSymbol];
        onUpdate(updated);
        saveSymbols(updated);
        
        setEditingId(newId);
        setFormData(newSymbol);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSaveEdit = () => {
    if (!editingId || !formData.id) return;
    const updated = symbolsLib.map(s => s.id === editingId ? { ...s, ...formData } as DefinicionSimbolo : s);
    onUpdate(updated);
    saveSymbols(updated);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (!id.startsWith('sym-custom-')) {
      alert("No puedes eliminar los símbolos por defecto de la aplicación.");
      return;
    }
    if (confirm("¿Eliminar este símbolo personalizado?")) {
      const updated = symbolsLib.filter(s => s.id !== id);
      onUpdate(updated);
      saveSymbols(updated);
    }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="dialog" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
        <div className="dialog-title">Gestor de Símbolos</div>
        
        {!editingId ? (
          <>
            <div className="info-helper" style={{ marginBottom: 16 }}>
              Aquí puedes ver los símbolos disponibles. Para agregar uno nuevo, importa un archivo .SVG (las líneas deben ser color "currentColor" o "black" para poder adaptarse al color de la app).
            </div>
            
            <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: 16 }}>
              {symbolsLib.map(s => {
                const isDefault = !s.id.startsWith('sym-custom-');
                return (
                  <div key={s.id} className="field-row" style={{ alignItems: 'center', borderBottom: '1px solid var(--border)', padding: '8px 0' }}>
                    <div style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)', borderRadius: 4, background: '#fff' }}>
                      <svg viewBox="-1 -1 2 2" width="30" height="30" color="var(--acc)" strokeWidth={0.1}>
                        <g dangerouslySetInnerHTML={{ __html: s.svgContent }} />
                      </svg>
                    </div>
                    <div style={{ flex: 1, marginLeft: 12 }}>
                      <div style={{ fontWeight: 'bold' }}>{s.label}</div>
                      <div style={{ fontSize: 11, color: '#666' }}>{isDefault ? 'Símbolo del sistema' : 'Personalizado'}</div>
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={() => { setEditingId(s.id); setFormData(s); }}>✏️</button>
                    {!isDefault && (
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s.id)}>✕</button>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="dialog-actions">
              <input ref={fileRef} type="file" accept=".svg" style={{ display: 'none' }} onChange={handleFileChange} />
              <button className="btn btn-ghost" onClick={onClose}>Cerrar</button>
              <button className="btn btn-acc" onClick={() => fileRef.current?.click()}>+ Importar SVG</button>
            </div>
          </>
        ) : (
          <>
            <div className="sec-hdr">Editando Símbolo</div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              <div style={{ width: 100, height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)', borderRadius: 4, background: '#fff' }}>
                <svg viewBox="-1 -1 2 2" width="80" height="80" color="var(--red)">
                  <g transform={`scale(${formData.escalaBase || 1})`} strokeWidth={0.05 / (formData.escalaBase || 1)}>
                    <g dangerouslySetInnerHTML={{ __html: formData.svgContent || '' }} />
                  </g>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <F label="Nombre / Etiqueta">
                  <input value={formData.label || ''} onChange={e => setFormData({ ...formData, label: e.target.value })} />
                </F>
                <div className="field-row">
                  <F label="Escala Base">
                    <input type="number" step="0.1" value={formData.escalaBase || 1} onChange={e => setFormData({ ...formData, escalaBase: parseFloat(e.target.value) || 1 })} />
                  </F>
                </div>
              </div>
            </div>
            
            <F label="SVG Paths (Código en crudo)">
              <textarea 
                rows={5} 
                style={{ fontFamily: 'monospace', fontSize: 11, width: '100%', padding: 8 }}
                value={formData.svgContent || ''}
                onChange={e => setFormData({ ...formData, svgContent: e.target.value })}
              />
            </F>

            <div className="dialog-actions" style={{ marginTop: 16 }}>
              <button className="btn btn-ghost" onClick={() => setEditingId(null)}>Cancelar</button>
              <button className="btn btn-acc" onClick={handleSaveEdit}>Guardar Símbolo</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
