/**
 * UnifilSidePanel.tsx
 * Panel lateral para edición de propiedades del unifilar
 */

import { useState } from 'react'
import type {
  Project,
  Tablero,
  UnifilNode,
  UnifilNodeTipo,
  UnifilNodeParams,
  UnifilDiagram
} from '../../types'

interface UnifilSidePanelProps {
  diagram: UnifilDiagram
  selectedNode: UnifilNode | null
  tablero: Tablero | null
  onUpdateNode: (updates: Partial<UnifilNode>) => void
  onDeleteNode: () => void
  onAddChild: (tipo: UnifilNodeTipo, params: UnifilNodeParams) => void
  onClose: () => void
  project: Project
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
  outline: 'none'
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '11px',
  fontWeight: '600',
  color: '#94a3b8',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  marginBottom: '6px'
}

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: 'pointer'
}

export function UnifilSidePanel({
  diagram,
  selectedNode,
  tablero,
  onUpdateNode,
  onDeleteNode,
  onAddChild,
  onClose,
  project
}: UnifilSidePanelProps) {
  const [showTypeSelector, setShowTypeSelector] = useState(false)

  // ========================================
  // Modo 1: Sin nodo seleccionado (info tablero)
  // ========================================
  if (!selectedNode) {
    return (
      <div
        style={{
          width: '320px',
          background: '#0f172a',
          borderLeft: '1px solid #1e293b',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto'
        }}
      >
        <div
          style={{
            padding: '20px',
            borderBottom: '1px solid #1e293b',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#e2e8f0' }}>
            📋 Tablero
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: '20px', color: '#e2e8f0' }}>
          <div style={{ marginBottom: '16px' }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}>
              NOMBRE
            </p>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>
              {tablero?.nombre || 'Sin nombre'}
            </p>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}>
              TIPO
            </p>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>
              {tablero?.tipo ? tablero.tipo.charAt(0).toUpperCase() + tablero.tipo.slice(1) : 'Auxiliar'}
            </p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}>
              ELEMENTOS EN EL DIAGRAMA
            </p>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>
              {diagram.nodes.length} nodos · {diagram.edges.length} conexiones
            </p>
          </div>

          <button
            onClick={() => {
              const newNode = {
                tipo: 'alimentador' as UnifilNodeTipo,
                params: {}
              }
              onAddChild(newNode.tipo, newNode.params)
            }}
            style={{
              width: '100%',
              padding: '10px 16px',
              background: '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => {
              ;(e.target as HTMLButtonElement).style.background = '#2563eb'
            }}
            onMouseLeave={(e) => {
              ;(e.target as HTMLButtonElement).style.background = '#3b82f6'
            }}
          >
            + Agregar Elemento Raíz
          </button>
        </div>
      </div>
    )
  }

  // ========================================
  // Modo 2: Nodo seleccionado (editar parámetros)
  // ========================================
  return (
    <div
      style={{
        width: '320px',
        background: '#0f172a',
        borderLeft: '1px solid #1e293b',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto'
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '20px',
          borderBottom: '1px solid #1e293b',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#38bdf8' }}>
          {selectedNode.tipo.replace(/_/g, ' ').toUpperCase()}
        </h3>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#64748b',
            fontSize: '18px',
            cursor: 'pointer'
          }}
        >
          ✕
        </button>
      </div>

      {/* Contenido dinámico según tipo */}
      <div style={{ flex: 1, padding: '20px', overflow: 'auto' }}>
        {/* Etiqueta personalizada */}
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Etiqueta Personalizada</label>
          <input
            type="text"
            value={selectedNode.label || ''}
            onChange={(e) => onUpdateNode({ label: e.target.value })}
            style={inputStyle}
            placeholder="Ej: TM Principal"
          />
        </div>

        {/* Campos paramétricos según tipo */}
        <ParametersForm
          tipo={selectedNode.tipo}
          params={selectedNode.params}
          onParamChange={(key, value) => {
            onUpdateNode({
              params: { ...selectedNode.params, [key]: value }
            })
          }}
          project={project}
          circuitoId={selectedNode.circuitoId}
          onCircuitoChange={(id) => onUpdateNode({ circuitoId: id })}
        />

        {/* Sección de acciones */}
        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #1e293b' }}>
          <button
            onClick={() => setShowTypeSelector(!showTypeSelector)}
            style={{
              width: '100%',
              padding: '10px 16px',
              background: '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              marginBottom: '12px'
            }}
          >
            + Agregar Elemento Hijo
          </button>

          <button
            onClick={onDeleteNode}
            style={{
              width: '100%',
              padding: '10px 16px',
              background: '#ef4444',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            🗑 Eliminar Este Elemento
          </button>
        </div>
      </div>

      {/* Selector de tipo desplegable */}
      {showTypeSelector && (
        <NodeTypeSelector
          onSelect={(tipo) => {
            onAddChild(tipo, {})
            setShowTypeSelector(false)
          }}
          onClose={() => setShowTypeSelector(false)}
        />
      )}
    </div>
  )
}

/**
 * Formulario dinámico de parámetros según tipo de nodo
 */
interface ParametersFormProps {
  tipo: UnifilNodeTipo
  params: UnifilNodeParams
  onParamChange: (key: string, value: any) => void
  project: Project
  circuitoId?: string
  onCircuitoChange?: (id: string) => void
}

function ParametersForm({
  tipo,
  params,
  onParamChange,
  project,
  circuitoId,
  onCircuitoChange
}: ParametersFormProps) {
  // Determinar qué campos mostrar según el tipo
  const showPolos = ['seccionador', 'interruptor_seccionador', 'termomagnetico', 'diferencial', 'diferencial_selectivo', 'caja_moldeada', 'seccionador_nh', 'dps'].includes(tipo)
  const showInominal = ['seccionador', 'interruptor_seccionador', 'termomagnetico', 'diferencial', 'diferencial_selectivo', 'caja_moldeada', 'dps', 'barra_distribuidora'].includes(tipo)
  const showSensibilidad = ['diferencial', 'diferencial_selectivo'].includes(tipo)
  const showCurva = ['termomagnetico', 'caja_moldeada'].includes(tipo)
  const showFusible = ['seccionador_nh'].includes(tipo)
  const showSalidas = ['barra_distribuidora', 'peine'].includes(tipo)
  const showICU = ['caja_moldeada'].includes(tipo)
  const showCircuitoRef = ['circuito_terminal'].includes(tipo)
  const showDescripcion = ['borne', 'barra_equipotencial', 'dps'].includes(tipo)

  return (
    <>
      {showPolos && (
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Polos</label>
          <select
            value={params.polos || 2}
            onChange={(e) => onParamChange('polos', parseInt(e.target.value))}
            style={selectStyle}
          >
            <option value={2}>2P (Bifásico)</option>
            <option value={3}>3P (Trifásico)</option>
            <option value={4}>4P (Trifásico + N)</option>
          </select>
        </div>
      )}

      {showInominal && (
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Corriente Nominal (A)</label>
          <input
            type="number"
            value={params.inominalA || ''}
            onChange={(e) => onParamChange('inominalA', e.target.value ? parseInt(e.target.value) : undefined)}
            style={inputStyle}
            placeholder="Ej: 16"
            min="1"
            max="500"
          />
        </div>
      )}

      {showSensibilidad && (
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Sensibilidad (mA)</label>
          <select
            value={params.sensibilidadMA || 30}
            onChange={(e) => onParamChange('sensibilidadMA', parseInt(e.target.value))}
            style={selectStyle}
          >
            <option value={10}>10 mA (Alta sensibilidad)</option>
            <option value={30}>30 mA (Estándar tomacorrientes)</option>
            <option value={100}>100 mA</option>
            <option value={300}>300 mA (Selectivo)</option>
            <option value={500}>500 mA</option>
          </select>
        </div>
      )}

      {showCurva && (
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Curva de Disparo</label>
          <select
            value={params.curvaDisparo || 'C'}
            onChange={(e) => onParamChange('curvaDisparo', e.target.value)}
            style={selectStyle}
          >
            <option value="B">B (Doméstica)</option>
            <option value="C">C (General)</option>
            <option value="D">D (Inductiva)</option>
          </select>
        </div>
      )}

      {showFusible && (
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Amperaje Fusible (A)</label>
          <input
            type="number"
            value={params.fusibleA || ''}
            onChange={(e) => onParamChange('fusibleA', e.target.value ? parseInt(e.target.value) : undefined)}
            style={inputStyle}
            placeholder="Ej: 16"
            min="1"
            max="630"
          />
        </div>
      )}

      {showSalidas && (
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Cantidad de Salidas</label>
          <input
            type="number"
            value={params.cantSalidas || ''}
            onChange={(e) => onParamChange('cantSalidas', e.target.value ? parseInt(e.target.value) : undefined)}
            style={inputStyle}
            placeholder="Ej: 4"
            min="1"
            max="20"
          />
        </div>
      )}

      {showICU && (
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Poder de Corte (kA)</label>
          <input
            type="number"
            value={params.icuKA || ''}
            onChange={(e) => onParamChange('icuKA', e.target.value ? parseInt(e.target.value) : undefined)}
            style={inputStyle}
            placeholder="Ej: 10"
            min="1"
            max="200"
            step="0.5"
          />
        </div>
      )}

      {showCircuitoRef && (
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Vincular a Circuito</label>
          <select
            value={circuitoId || ''}
            onChange={(e) => onCircuitoChange?.(e.target.value)}
            style={selectStyle}
          >
            <option value="">-- Sin vincular --</option>
            {(project.circuitos || []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} ({c.tipo})
              </option>
            ))}
          </select>
        </div>
      )}

      {showDescripcion && (
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Descripción</label>
          <textarea
            value={params.descripcionLibre || ''}
            onChange={(e) => onParamChange('descripcionLibre', e.target.value)}
            style={{
              ...inputStyle,
              minHeight: '60px',
              fontFamily: 'monospace',
              fontSize: '12px'
            }}
            placeholder="Notas libres..."
          />
        </div>
      )}
    </>
  )
}

/**
 * Selector de tipo de nodo
 */
interface NodeTypeSelectorProps {
  onSelect: (tipo: UnifilNodeTipo) => void
  onClose: () => void
}

function NodeTypeSelector({ onSelect, onClose }: NodeTypeSelectorProps) {
  const nodeTypeOptions: { value: UnifilNodeTipo; label: string }[] = [
    { value: 'alimentador', label: '📥 Alimentador' },
    { value: 'seccionador', label: '⚪ Seccionador' },
    { value: 'seccionador_nh', label: '📦 Seccionador NH' },
    { value: 'interruptor_seccionador', label: '🔄 Interruptor Seccionador' },
    { value: 'termomagnetico', label: '⚡ Termomagnético' },
    { value: 'diferencial', label: '⚠️ Diferencial' },
    { value: 'diferencial_selectivo', label: '⚠️ Diferencial Selectivo' },
    { value: 'caja_moldeada', label: '📋 Caja Moldeada' },
    { value: 'barra_distribuidora', label: '▬ Barra Distribuidora' },
    { value: 'peine', label: '🔶 Peine' },
    { value: 'borne', label: '● Borne' },
    { value: 'barra_equipotencial', label: '⏚ Barra Equipotencial' },
    { value: 'dps', label: '⚡ DPS' },
    { value: 'circuito_terminal', label: '➜ Circuito Terminal' }
  ]

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        background: '#1e293b',
        borderTop: '1px solid #334155',
        maxHeight: '300px',
        overflowY: 'auto',
        zIndex: 100
      }}
    >
      <div style={{ padding: '12px' }}>
        <p style={{ margin: '0 0 12px 0', fontSize: '11px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase' }}>
          Seleccionar Tipo
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px' }}>
          {nodeTypeOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onSelect(opt.value)}
              style={{
                padding: '10px 12px',
                background: '#0f172a',
                border: '1px solid #334155',
                color: '#e2e8f0',
                borderRadius: '4px',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                ;(e.target as HTMLButtonElement).style.background = '#1e293b'
                ;(e.target as HTMLButtonElement).style.borderColor = '#38bdf8'
              }}
              onMouseLeave={(e) => {
                ;(e.target as HTMLButtonElement).style.background = '#0f172a'
                ;(e.target as HTMLButtonElement).style.borderColor = '#334155'
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '8px',
            marginTop: '12px',
            background: 'none',
            border: '1px solid #475569',
            color: '#94a3b8',
            borderRadius: '4px',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
