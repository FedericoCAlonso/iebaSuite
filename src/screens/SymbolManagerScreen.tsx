// ═══════════════════════════════════════════════════════════════════════════
// MODULE: screens/SymbolManagerScreen.tsx
// Herramienta del Hub para gestionar la biblioteca de símbolos eléctricos.
// Sincroniza automáticamente con Firebase vía SymbolsContext.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useRef, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSymbols } from '../core/SymbolsContext';
import { useAuth } from '../core/AuthContext';
import type { DefinicionSimbolo } from '../lib/symbols';
import { parseSvgFileContent } from '../utils/svgParser';
import { F } from '../components/Field';
import './SymbolManagerScreen.css';

const USO_LABELS: Record<string, string> = {
  planta: 'Planta',
  unifilar: 'Unifilar',
};

const USO_COLORS: Record<string, string> = {
  planta: '#3b82f6',
  unifilar: '#8b5cf6',
};

export function SymbolManagerScreen() {
  const navigate = useNavigate();
  const { symbolsLib, categoriesLib, setSymbolsLib } = useSymbols();
  const { user } = useAuth();

  const fileRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('todas');
  const [editingSymbol, setEditingSymbol] = useState<DefinicionSimbolo | null>(null);

  // ── Filtrado ──
  const filtered = useMemo(() => {
    return symbolsLib.filter(s => {
      const matchesSearch =
        !search ||
        s.label.toLowerCase().includes(search.toLowerCase()) ||
        s.id.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        activeCategory === 'todas' || s.categoria === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [symbolsLib, search, activeCategory]);

  const customCount = symbolsLib.filter(s => s.id.startsWith('sym-custom-')).length;
  const defaultCount = symbolsLib.length - customCount;

  // ── Handlers ──
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        const svgInner = parseSvgFileContent(content);
        const newSymbol: DefinicionSimbolo = {
          id: `sym-custom-${Date.now()}`,
          label: file.name.replace(/\.svg$/i, ''),
          escalaBase: 1,
          anclaje: { x: 0, y: 0 },
          svgContent: svgInner,
          uso: 'planta',
        };
        setSymbolsLib([...symbolsLib, newSymbol]);
        setEditingSymbol(newSymbol);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [symbolsLib, setSymbolsLib]);

  const handleSaveEdit = useCallback(() => {
    if (!editingSymbol) return;
    const updated = symbolsLib.map(s =>
      s.id === editingSymbol.id ? editingSymbol : s
    );
    setSymbolsLib(updated);
    setEditingSymbol(null);
  }, [editingSymbol, symbolsLib, setSymbolsLib]);

  const handleDelete = useCallback((id: string) => {
    if (!id.startsWith('sym-custom-')) {
      alert('No se pueden eliminar los símbolos del sistema.');
      return;
    }
    if (confirm('¿Eliminar este símbolo personalizado?')) {
      setSymbolsLib(symbolsLib.filter(s => s.id !== id));
    }
  }, [symbolsLib, setSymbolsLib]);

  const categories = ['todas', ...categoriesLib.map(c => c.id)];

  return (
    <div className="screen-symbols">
      {/* Header */}
      <div className="screen-symbols__header">
        <div className="screen-symbols__header-left">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => navigate('/')}
            title="Volver al Hub"
          >
            ← Volver
          </button>
          <h1 className="screen-symbols__title">Biblioteca de Símbolos</h1>
          <span className="screen-symbols__subtitle">
            {symbolsLib.length} totales · {customCount} personalizados · {defaultCount} del sistema
            {user && (
              <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--green)' }}>
                ● Sync Firebase
              </span>
            )}
          </span>
        </div>

        <div className="screen-symbols__header-right">
          <input
            type="text"
            className="screen-symbols__search"
            placeholder="Buscar símbolo…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <input
            ref={fileRef}
            type="file"
            accept=".svg"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <button
            className="btn btn-acc"
            onClick={() => fileRef.current?.click()}
          >
            + Importar SVG
          </button>
        </div>
      </div>

      {/* Categorías */}
      <div className="screen-symbols__tabs">
        {categories.map(cat => {
          const label =
            cat === 'todas'
              ? `Todas (${symbolsLib.length})`
              : categoriesLib.find(c => c.id === cat)?.name || cat;
          return (
            <button
              key={cat}
              className={`screen-symbols__tab ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="screen-symbols__empty">
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
          <strong>Sin resultados</strong>
          <p style={{ color: 'var(--text3)', marginTop: 4 }}>
            Probá con otro término de búsqueda o importá un SVG nuevo.
          </p>
        </div>
      ) : (
        <div className="screen-symbols__grid">
          {filtered.map(s => {
            const isDefault = !s.id.startsWith('sym-custom-');
            const catName = categoriesLib.find(c => c.id === s.categoria)?.name || s.categoria || 'General';
            return (
              <div key={s.id} className="symbol-card">
                <div className="symbol-card__preview">
                  <svg
                    viewBox="-1 -1 2 2"
                    width="48"
                    height="48"
                    color="var(--acc)"
                    style={{ overflow: 'visible' }}
                  >
                    <g
                      transform={`scale(${s.escalaBase || 1})`}
                      dangerouslySetInnerHTML={{ __html: s.svgContent }}
                    />
                  </svg>
                </div>

                <div className="symbol-card__meta">
                  <div className="symbol-card__name" title={s.label}>
                    {s.label}
                  </div>
                  <div className="symbol-card__tags">
                    <span className="symbol-card__tag" style={{ background: 'var(--bg2)' }}>
                      {isDefault ? 'Sistema' : 'Personalizado'}
                    </span>
                    {s.uso && (
                      <span
                        className="symbol-card__tag"
                        style={{
                          background: `${USO_COLORS[s.uso]}15`,
                          color: USO_COLORS[s.uso],
                        }}
                      >
                        {USO_LABELS[s.uso]}
                      </span>
                    )}
                    {s.categoria && (
                      <span className="symbol-card__tag" style={{ background: 'var(--bg2)' }}>
                        {catName}
                      </span>
                    )}
                  </div>
                </div>

                <div className="symbol-card__actions">
                  <button
                    className="btn btn-ghost btn-xs"
                    title="Editar"
                    onClick={() => setEditingSymbol(s)}
                  >
                    ✏️
                  </button>
                  {!isDefault && (
                    <button
                      className="btn btn-danger btn-xs"
                      title="Eliminar"
                      onClick={() => handleDelete(s.id)}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de edición */}
      {editingSymbol && (
        <div className="overlay" onClick={() => setEditingSymbol(null)}>
          <div className="dialog" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div className="dialog-title">
              {editingSymbol.id.startsWith('sym-custom-') ? 'Editar símbolo personalizado' : 'Ver símbolo del sistema'}
            </div>

            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              <div
                style={{
                  width: 120,
                  height: 120,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r)',
                  background: '#fff',
                  flexShrink: 0,
                }}
              >
                <svg
                  viewBox="-1 -1 2 2"
                  width="90"
                  height="90"
                  color="var(--acc)"
                >
                  <g
                    transform={`scale(${editingSymbol.escalaBase || 1})`}
                    dangerouslySetInnerHTML={{ __html: editingSymbol.svgContent }}
                  />
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <F label="Nombre / Etiqueta">
                  <input
                    value={editingSymbol.label}
                    onChange={e =>
                      setEditingSymbol({ ...editingSymbol, label: e.target.value })
                    }
                    disabled={!editingSymbol.id.startsWith('sym-custom-')}
                  />
                </F>
                <div className="field-row">
                  <F label="Escala base">
                    <input
                      type="number"
                      step="0.1"
                      value={editingSymbol.escalaBase || 1}
                      onChange={e =>
                        setEditingSymbol({
                          ...editingSymbol,
                          escalaBase: parseFloat(e.target.value) || 1,
                        })
                      }
                      disabled={!editingSymbol.id.startsWith('sym-custom-')}
                    />
                  </F>
                  <F label="Categoría">
                    <select
                      value={editingSymbol.categoria || ''}
                      onChange={e =>
                        setEditingSymbol({
                          ...editingSymbol,
                          categoria: e.target.value || undefined,
                        })
                      }
                      disabled={!editingSymbol.id.startsWith('sym-custom-')}
                    >
                      <option value="">Sin categoría</option>
                      {categoriesLib.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </F>
                </div>
                <div className="field-row">
                  <F label="Uso">
                    <select
                      value={editingSymbol.uso || 'planta'}
                      onChange={e =>
                        setEditingSymbol({
                          ...editingSymbol,
                          uso: e.target.value as 'planta' | 'unifilar',
                        })
                      }
                      disabled={!editingSymbol.id.startsWith('sym-custom-')}
                    >
                      <option value="planta">Planta</option>
                      <option value="unifilar">Unifilar</option>
                    </select>
                  </F>
                  <F label="ID">
                    <input value={editingSymbol.id} disabled readOnly />
                  </F>
                </div>
              </div>
            </div>

            <F label="Contenido SVG (paths)">
              <textarea
                rows={5}
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 11,
                  width: '100%',
                  padding: 8,
                  borderRadius: 'var(--r)',
                  border: '1px solid var(--border)',
                  background: 'var(--bg2)',
                  color: 'var(--text)',
                }}
                value={editingSymbol.svgContent}
                onChange={e =>
                  setEditingSymbol({
                    ...editingSymbol,
                    svgContent: e.target.value,
                  })
                }
                disabled={!editingSymbol.id.startsWith('sym-custom-')}
              />
            </F>

            <div className="dialog-actions" style={{ marginTop: 20 }}>
              <button
                className="btn btn-ghost"
                onClick={() => setEditingSymbol(null)}
              >
                Cerrar
              </button>
              {editingSymbol.id.startsWith('sym-custom-') && (
                <button className="btn btn-acc" onClick={handleSaveEdit}>
                  Guardar cambios
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
