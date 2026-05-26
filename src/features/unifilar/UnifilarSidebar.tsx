import React from 'react'
import type { Project, Tablero, Diferencial, Circuito } from '../../types/index'

interface UnifilarSidebarProps {
  project: Project
  selectedElement: {
    type: 'suministro' | 'tablero' | 'diferencial' | 'circuito'
    id: string
  } | null
  onUpdateProject: (fn: (p: Project) => Project) => void
  onClose: () => void
  onDeleteElement: (type: 'diferencial' | 'circuito' | 'tablero', id: string) => void
  onEditCircuit?: (id: string) => void
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: '6px',
  border: '1px solid #334155',
  background: '#1e293b',
  color: '#f8fafc',
  fontFamily: 'Inter, sans-serif',
  fontSize: '13px',
  outline: 'none',
  marginTop: '4px',
  marginBottom: '12px'
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '11px',
  fontWeight: '600',
  color: '#94a3b8',
  textTransform: 'uppercase',
  letterSpacing: '0.5px'
}

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: 'pointer'
}

export function UnifilarSidebar({
  project,
  selectedElement,
  onUpdateProject,
  onClose,
  onDeleteElement,
  onEditCircuit
}: UnifilarSidebarProps) {
  if (!selectedElement) {
    return (
      <div style={{
        padding: '24px',
        color: '#94a3b8',
        fontSize: '13px',
        textAlign: 'center',
        background: '#0f172a',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{ fontSize: '24px' }}>🖱️</div>
        <span>Seleccioná un elemento en el diagrama unifilar para inspeccionar y editar sus propiedades técnicas en tiempo real.</span>
      </div>
    )
  }

  const { type, id } = selectedElement

  // 1. EDITAR SUMINISTRO
  if (type === 'suministro') {
    const suministro = project.suministro || {}
    const updateSuministro = (fields: Partial<typeof suministro>) => {
      onUpdateProject(p => ({
        ...p,
        suministro: { ...p.suministro, ...fields },
        updatedAt: Date.now()
      }))
    }

    return (
      <div style={{ padding: '20px', color: '#f8fafc', height: '100%', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#f59e0b', margin: 0 }}>🔌 Editar Acometida</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ fontSize: '14px', color: '#94a3b8' }}>✕</button>
        </div>

        <label style={labelStyle}>Tensión de Servicio (V)</label>
        <select
          value={suministro.tension || 220}
          onChange={e => updateSuministro({ tension: parseInt(e.target.value) })}
          style={selectStyle}
        >
          <option value={220}>220 V (Monofásico)</option>
          <option value={380}>380 V (Trifásico)</option>
        </select>

        <label style={labelStyle}>Fases del Suministro</label>
        <select
          value={suministro.fases || 1}
          onChange={e => updateSuministro({ fases: parseInt(e.target.value) as 1 | 3 })}
          style={selectStyle}
        >
          <option value={1}>Monofásico (1F + N)</option>
          <option value={3}>Trifásico (3F + N)</option>
        </select>

        <label style={labelStyle}>Potencia Contratada (kW)</label>
        <input
          type="number"
          step="0.1"
          placeholder="Ej: 5.5"
          value={suministro.potenciaContratadaKW || ''}
          onChange={e => updateSuministro({ potenciaContratadaKW: parseFloat(e.target.value) || undefined })}
          style={inputStyle}
        />

        <label style={labelStyle}>Número de Medidor</label>
        <input
          placeholder="Ej: A-9382928"
          value={suministro.nroMedidor || ''}
          onChange={e => updateSuministro({ nroMedidor: e.target.value })}
          style={inputStyle}
        />

        <label style={labelStyle}>Compañía Distribuidora</label>
        <input
          placeholder="Ej: Edesur, Edenor"
          value={suministro.distribuidora || ''}
          onChange={e => updateSuministro({ distribuidora: e.target.value })}
          style={inputStyle}
        />

        <label style={labelStyle}>Categoría Tarifaria</label>
        <input
          placeholder="Ej: T1-R2"
          value={suministro.categoriaTarifa || ''}
          onChange={e => updateSuministro({ categoriaTarifa: e.target.value })}
          style={inputStyle}
        />
        
        <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(245, 158, 11, 0.05)', borderRadius: '6px', border: '1px solid rgba(245, 158, 11, 0.1)', fontSize: '12px', color: '#f59e0b', lineHeight: '1.5' }}>
          💡 La potencia contratada e instalada influye directamente en el cálculo de caída de tensión general.
        </div>
      </div>
    )
  }

  // 2. EDITAR TABLERO
  if (type === 'tablero') {
    const tablero = (project.tableros || []).find(t => t.id === id)
    if (!tablero) return <div style={{ padding: '20px', color: '#94a3b8' }}>Tablero no encontrado.</div>

    const updateTablero = (fields: Partial<Tablero>) => {
      onUpdateProject(p => ({
        ...p,
        tableros: (p.tableros || []).map(t => t.id === id ? { ...t, ...fields } : t),
        updatedAt: Date.now()
      }))
    }

    return (
      <div style={{ padding: '20px', color: '#f8fafc', height: '100%', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#38bdf8', margin: 0 }}>⚡ Editar Tablero</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ fontSize: '14px', color: '#94a3b8' }}>✕</button>
        </div>

        <label style={labelStyle}>Nombre del Tablero</label>
        <input
          placeholder="Ej: TS1, TS Principal"
          value={tablero.nombre || ''}
          onChange={e => updateTablero({ nombre: e.target.value })}
          style={inputStyle}
        />

        <label style={labelStyle}>Tipo de Tablero</label>
        <select
          value={tablero.tipo || 'seccional'}
          onChange={e => updateTablero({ tipo: e.target.value as Tablero['tipo'] })}
          style={selectStyle}
        >
          <option value="general">Principal / General</option>
          <option value="seccional">Seccional</option>
          <option value="auxiliar">Auxiliar / de Control</option>
        </select>

        <label style={labelStyle}>Ubicación Física</label>
        <input
          placeholder="Ej: Pasillo de Entrada, Garage"
          value={tablero.ubicacion || ''}
          onChange={e => updateTablero({ ubicacion: e.target.value })}
          style={inputStyle}
        />

        <label style={labelStyle}>Factor de Simultaneidad (FS)</label>
        <input
          type="number"
          step="0.05"
          min="0.1"
          max="1.0"
          placeholder="Ej: 0.8"
          value={tablero.factorSimultaneidad ?? 1.0}
          onChange={e => updateTablero({ factorSimultaneidad: parseFloat(e.target.value) || 1.0 })}
          style={inputStyle}
        />

        <label style={labelStyle}>Sistema de Distribución (Proyecto)</label>
        <select
          value={project.sistemaDistribucion || 'TT'}
          onChange={e => onUpdateProject(p => ({ ...p, sistemaDistribucion: e.target.value as Project['sistemaDistribucion'] }))}
          style={selectStyle}
        >
          <option value="TT">Sistema TT (Tierra independiente)</option>
          <option value="TN-S">Sistema TN-S (Neutro y PE separados)</option>
          <option value="TN-C">Sistema TN-C (Neutro y PE combinados - PEN)</option>
          <option value="TN-C-S">Sistema TN-C-S</option>
          <option value="IT">Sistema IT (Neutro aislado/impedido)</option>
        </select>

        {/* ALIMENTADOR / CASCADA */}
        <div style={{ marginTop: '16px', borderTop: '1px solid #334155', paddingTop: '16px' }}>
          <label style={{ ...labelStyle, color: '#f59e0b' }}>Alimentador (Viene de Tablero)</label>
          <select
            value={tablero.alimentadorDesdeTableroId || 'red_distribuidora'}
            onChange={e => updateTablero({ alimentadorDesdeTableroId: e.target.value, alimentadorDesdeCircuitoId: undefined })}
            style={selectStyle}
          >
            <option value="red_distribuidora">Acometida / Red Distribuidora</option>
            {project.tableros?.filter(t => t.id !== id).map(t => (
              <option key={t.id} value={t.id}>Tablero: {t.nombre}</option>
            ))}
          </select>

          {tablero.alimentadorDesdeTableroId && tablero.alimentadorDesdeTableroId !== 'red_distribuidora' && (
            <>
              <label style={{ ...labelStyle, color: '#f59e0b', marginTop: '8px' }}>Alimentador (Circuito de origen)</label>
              <select
                value={tablero.alimentadorDesdeCircuitoId || ''}
                onChange={e => updateTablero({ alimentadorDesdeCircuitoId: e.target.value })}
                style={selectStyle}
              >
                <option value="">Seleccionar Circuito Alimentador...</option>
                {project.circuitos?.filter(c => c.tableroId === tablero.alimentadorDesdeTableroId).map(c => (
                  <option key={c.id} value={c.id}>{c.nombre} ({c.tipo})</option>
                ))}
              </select>
            </>
          )}
        </div>

        {/* CABECERA */}
        <div style={{ marginTop: '16px', borderTop: '1px solid #334155', paddingTop: '16px' }}>
          <label style={{ ...labelStyle, color: '#38bdf8' }}>Interruptor Cabecera</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Tipo</label>
              <select
                value={tablero.interruptorCabecera?.tipo || 'seccionador'}
                onChange={e => updateTablero({ 
                  interruptorCabecera: { 
                    ...(tablero.interruptorCabecera || {}), 
                    tipo: e.target.value as any 
                  } 
                })}
                style={selectStyle}
              >
                <option value="seccionador">Seccionador</option>
                <option value="interruptor_seccionador">Interruptor Secc.</option>
                <option value="TM">Termomagnética</option>
                <option value="DR">Disyuntor Diferencial</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>In (A)</label>
              <input
                type="number"
                placeholder="Ej: 63"
                value={tablero.interruptorCabecera?.inominalA || ''}
                onChange={e => updateTablero({ 
                  interruptorCabecera: { 
                    ...(tablero.interruptorCabecera || { tipo: 'seccionador' }), 
                    inominalA: parseInt(e.target.value) || undefined 
                  } 
                })}
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        <div style={{ marginTop: '24px', borderTop: '1px solid #334155', paddingTop: '16px' }}>
          <button
            className="btn btn-outline"
            style={{ width: '100%', borderColor: '#ef4444', color: '#ef4444' }}
            onClick={() => {
              if (confirm(`¿Eliminar tablero "${tablero.nombre}"? Los circuitos de este tablero pasarán a "sin tablero".`)) {
                onDeleteElement('tablero', tablero.id)
              }
            }}
          >
            🗑️ Eliminar Tablero
          </button>
        </div>
      </div>
    )
  }

  // 3. EDITAR DIFERENCIAL
  if (type === 'diferencial') {
    const diferencial = (project.diferenciales || []).find(d => d.id === id)
    if (!diferencial) return <div style={{ padding: '20px', color: '#94a3b8' }}>Diferencial no encontrado.</div>

    const updateDiferencial = (fields: Partial<Diferencial>) => {
      onUpdateProject(p => ({
        ...p,
        diferenciales: (p.diferenciales || []).map(d => d.id === id ? { ...d, ...fields } : d),
        updatedAt: Date.now()
      }))
    }

    // Circuitos en este tablero que pueden ser protegidos por este DR
    const tableroCircuitos = (project.circuitos || []).filter(c => c.tableroId === diferencial.tableroId)

    const handleToggleCircuito = (circuitoId: string) => {
      const actualList = diferencial.circuitosIds || []
      const newList = actualList.includes(circuitoId)
        ? actualList.filter(cid => cid !== circuitoId)
        : [...actualList, circuitoId]
      updateDiferencial({ circuitosIds: newList })
    }

    return (
      <div style={{ padding: '20px', color: '#f8fafc', height: '100%', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#10b981', margin: 0 }}>🛡️ Editar Disyuntor (DR)</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ fontSize: '14px', color: '#94a3b8' }}>✕</button>
        </div>

        <label style={labelStyle}>Ubicación / Aguas Arriba</label>
        <select
          value={diferencial.parentId || ''}
          onChange={e => updateDiferencial({ parentId: e.target.value === '' ? undefined : e.target.value })}
          style={selectStyle}
        >
          <option value="">Directo a Embarrado Principal</option>
          {/* Un DR colgando de otro DR o Circuito es raro pero posible paramétricamente */}
          {(project.diferenciales || []).filter(d => d.tableroId === diferencial.tableroId && d.id !== id).map(d => (
            <option key={d.id} value={d.id}>Debajo de DR: {d.descripcion || `${d.inominalA}A`}</option>
          ))}
        </select>

        <label style={labelStyle}>Corriente Nominal In (A)</label>
        <select
          value={diferencial.inominalA || 25}
          onChange={e => updateDiferencial({ inominalA: parseInt(e.target.value) })}
          style={selectStyle}
        >
          <option value={16}>16 A</option>
          <option value={25}>25 A (Recomendado estándar)</option>
          <option value={40}>40 A</option>
          <option value={63}>63 A</option>
          <option value={80}>80 A</option>
        </select>

        <label style={labelStyle}>Sensibilidad de Fuga (mA)</label>
        <select
          value={diferencial.sensibilidadMA || 30}
          onChange={e => updateDiferencial({ sensibilidadMA: parseInt(e.target.value) as Diferencial['sensibilidadMA'] })}
          style={selectStyle}
        >
          <option value={10}>10 mA (Zonas medicinales / jacuzzis)</option>
          <option value={30}>30 mA (Alta sensibilidad - Seguridad Humana)</option>
          <option value={100}>100 mA (Media sensibilidad)</option>
          <option value={300}>300 mA (Protección contra incendios)</option>
          <option value={500}>500 mA (Industrial)</option>
        </select>

        <label style={labelStyle}>Polos</label>
        <select
          value={diferencial.polos || 2}
          onChange={e => updateDiferencial({ polos: parseInt(e.target.value) as 2 | 4 })}
          style={selectStyle}
        >
          <option value={2}>2 Polos (Monofásico - F+N)</option>
          <option value={4}>4 Polos (Trifásico - 3F+N)</option>
        </select>

        <label style={labelStyle}>Clase / Tipo</label>
        <select
          value={diferencial.tipo || 'AC'}
          onChange={e => updateDiferencial({ tipo: e.target.value as Diferencial['tipo'] })}
          style={selectStyle}
        >
          <option value="AC">Clase AC (Solo corriente alterna senoidal pura)</option>
          <option value="A">Clase A (Inmunizado - Carga pulsante continua)</option>
          <option value="F">Clase F (Variadores de velocidad / bombas)</option>
          <option value="B">Clase B (Trifásico con inversores / cargadores EV)</option>
          <option value="S">Clase S (Selectivo / Temporizado)</option>
        </select>

        <label style={labelStyle}>Descripción</label>
        <input
          placeholder="Ej: Diferencial Tomas Generales"
          value={diferencial.descripcion || ''}
          onChange={e => updateDiferencial({ descripcion: e.target.value })}
          style={inputStyle}
        />

        {/* ASOCIACIÓN DE CIRCUITOS */}
        <div style={{ marginTop: '16px', borderTop: '1px solid #334155', paddingTop: '16px' }}>
          <label style={{ ...labelStyle, marginBottom: '8px' }}>Circuitos Protegidos por este DR</label>
          {tableroCircuitos.length === 0 ? (
            <div style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', padding: '8px 0' }}>
              No hay circuitos definidos en este tablero. Creá uno para poder protegerlo.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto', background: '#0f172a', padding: '8px', borderRadius: '6px', border: '1px solid #334155' }}>
              {tableroCircuitos.map(c => {
                const isChecked = (diferencial.circuitosIds || []).includes(c.id)
                return (
                  <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer', color: isChecked ? '#10b981' : '#f8fafc', padding: '4px 0' }}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleCircuito(c.id)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span><strong>{c.nombre}</strong>: {c.tipo} ({c.descripcion || 'Sin obs.'})</span>
                  </label>
                )
              })}
            </div>
          )}
        </div>

        <div style={{ marginTop: '24px', borderTop: '1px solid #334155', paddingTop: '16px' }}>
          <button
            className="btn btn-outline"
            style={{ width: '100%', borderColor: '#ef4444', color: '#ef4444' }}
            onClick={() => {
              if (confirm('¿Eliminar este disyuntor diferencial? Los circuitos asociados quedarán desprotegidos.')) {
                onDeleteElement('diferencial', diferencial.id)
              }
            }}
          >
            🗑️ Eliminar Disyuntor
          </button>
        </div>
      </div>
    )
  }

  // 4. EDITAR CIRCUITO / BREAKER
  if (type === 'circuito') {
    const circuito = (project.circuitos || []).find(c => c.id === id)
    if (!circuito) return <div style={{ padding: '20px', color: '#94a3b8' }}>Circuito no encontrado.</div>

    const updateCircuito = (fields: Partial<Circuito>) => {
      onUpdateProject(p => ({
        ...p,
        circuitos: (p.circuitos || []).map(c => c.id === id ? { ...c, ...fields } : c),
        updatedAt: Date.now()
      }))
    }

    return (
      <div style={{ padding: '20px', color: '#f8fafc', height: '100%', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#38bdf8', margin: 0 }}>🔌 Editar Circuito Coche</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ fontSize: '14px', color: '#94a3b8' }}>✕</button>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Nomenclatura y Tipo</label>
            <div style={{ ...inputStyle, background: 'rgba(255,255,255,0.05)', color: '#cbd5e1' }}>
              <strong>{circuito.nombre || 'Sin nombre'}</strong> ({circuito.tipo || 'TUG'})
            </div>
          </div>
        </div>

        <label style={labelStyle}>Descripción / Carga</label>
        <div style={{ ...inputStyle, background: 'rgba(255,255,255,0.05)', color: '#cbd5e1' }}>
          {circuito.descripcion || 'Sin descripción'}
        </div>

        <button 
          className="btn btn-acc" 
          style={{ width: '100%', marginBottom: '16px', marginTop: '8px' }}
          onClick={() => onEditCircuit?.(id)}
        >
          ✏️ Abrir Editor de Circuito
        </button>

        {/* PROPIEDADES ESPECÍFICAS DE DIAGRAMA UNIFILAR */}
        <div style={{ marginTop: '24px', borderTop: '1px solid #334155', paddingTop: '16px' }}>
          <h4 style={{ fontSize: '13px', color: '#e2e8f0', marginBottom: '12px' }}>Parámetros de Diagrama Unifilar</h4>
          
          <label style={labelStyle}>Ubicación / Aguas Arriba</label>
          <select
            value={circuito.parentId || ''}
            onChange={e => updateCircuito({ parentId: e.target.value === '' ? undefined : e.target.value })}
            style={selectStyle}
          >
            <option value="">Directo a Embarrado Principal</option>
            <optgroup label="Disyuntores (DR)">
              {(project.diferenciales || []).filter(d => d.tableroId === circuito.tableroId).map(d => (
                <option key={d.id} value={d.id}>DR: {d.descripcion || `${d.inominalA}A/${d.sensibilidadMA}mA`}</option>
              ))}
            </optgroup>
            <optgroup label="Otros Circuitos">
              {(project.circuitos || []).filter(c => c.tableroId === circuito.tableroId && c.id !== id).map(c => (
                <option key={c.id} value={c.id}>Sub-circuito de: {c.nombre}</option>
              ))}
            </optgroup>
          </select>

          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ ...labelStyle, color: '#38bdf8' }}>Polos Gráficos (Aparato)</label>
              <select
                value={circuito.polos || 2}
                onChange={e => updateCircuito({ polos: parseInt(e.target.value) as 2 | 3 | 4 })}
                style={{ ...selectStyle, marginBottom: 12 }}
              >
                <option value={2}>Bipolar (2P)</option>
                <option value={3}>Tripolar (3P)</option>
                <option value={4}>Tetrapolar (4P)</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Conductores (Línea)</label>
              <select
                value={circuito.cantConductores || 2}
                onChange={e => updateCircuito({ cantConductores: parseInt(e.target.value) })}
                style={selectStyle}
              >
                <option value={2}>2 (F+N)</option>
                <option value={3}>3 (2F+N)</option>
                <option value={4}>4 (3F+N)</option>
              </select>
            </div>
          </div>
        </div>

        {/* MOVER DE TABLERO */}
        <label style={labelStyle}>Tablero al que pertenece</label>
        <select
          value={circuito.tableroId}
          onChange={e => updateCircuito({ tableroId: e.target.value })}
          style={selectStyle}
        >
          {project.tableros?.map(t => (
            <option key={t.id} value={t.id}>{t.nombre}</option>
          ))}
        </select>

        <div style={{ marginTop: '24px', borderTop: '1px solid #334155', paddingTop: '16px' }}>
          <button
            className="btn btn-outline"
            style={{ width: '100%', borderColor: '#ef4444', color: '#ef4444' }}
            onClick={() => {
              if (confirm(`¿Eliminar circuito "${circuito.nombre}" por completo del proyecto?`)) {
                onDeleteElement('circuito', circuito.id)
              }
            }}
          >
            🗑️ Eliminar Circuito
          </button>
        </div>
      </div>
    )
  }

  return null
}
