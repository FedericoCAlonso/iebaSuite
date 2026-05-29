/**
 * UnifilEditor.tsx
 * Editor paramétrico de esquemas unifilares
 * Componente raíz que orquesta canvas, sidebar y selector de tablero
 */

import { useState, useCallback, useMemo } from 'react'
import type { Project, UnifilNode, UnifilNodeTipo, UnifilNodeParams } from '../../types'
import { UnifilCanvas } from './UnifilCanvas'
import { UnifilSidePanel } from './UnifilSidePanel'
import {
  getDiagramForTablero,
  addNode,
  removeNode,
  updateNode,
  updateNodeParams,
  saveDiagram,
  createUnifilNode,
  calculateAutoLayout
} from '../../utils/unifilUtils'

interface UnifilEditorProps {
  project: Project
  onProjectChange: (updated: Project) => void
}

export function UnifilEditor({ project, onProjectChange }: UnifilEditorProps) {
  // Estados locales
  const [selectedTableroId, setSelectedTableroId] = useState<string | null>(
    () => project.tableros?.[0]?.id || null
  )
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  // Obtener tablero activo
  const activeTablero = useMemo(() => {
    if (!selectedTableroId) return null
    return (project.tableros || []).find(t => t.id === selectedTableroId) || null
  }, [project.tableros, selectedTableroId])

  // Obtener diagrama del tablero activo
  const activeDiagram = useMemo(() => {
    if (!activeTablero) return { tableroId: '', nodes: [], edges: [] }
    return getDiagramForTablero(project, activeTablero.id)
  }, [project, activeTablero])

  // Obtener nodo seleccionado
  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null
    return activeDiagram.nodes.find(n => n.id === selectedNodeId) || null
  }, [activeDiagram.nodes, selectedNodeId])

  // ========================================
  // Handlers de mutación
  // ========================================

  const handleSelectNode = useCallback(
    (nodeId: string | null) => {
      setSelectedNodeId(nodeId)
    },
    []
  )

  const handleAddChild = useCallback(
    (_parentNodeId: string) => {
      // Paso 1: usuario selecciona tipo
      // El tipo se pasa luego mediante handleCreateChildNode
      // Por ahora, solo abrimos el selector en el panel
      // (el selector está en UnifilSidePanel)
    },
    []
  )

  const handleCreateChildNode = useCallback(
    (tipo: UnifilNodeTipo, params: UnifilNodeParams) => {
      if (!activeTablero) return

      // Calcular posición para el nuevo nodo (debajo del padre)
      const parentNode = selectedNode
      const baseY = parentNode?.posY ?? 60
      const newNode = createUnifilNode(
        tipo,
        activeTablero.id,
        parentNode?.posX ?? 400,
        baseY + 120,
        params
      )

      // Agregar nodo y edge
      let newDiagram = addNode(activeDiagram, newNode, selectedNodeId || undefined)

      // Aplicar layout automático
      newDiagram = calculateAutoLayout(newDiagram)

      // Guardar en proyecto
      const updatedProject = saveDiagram(project, newDiagram)
      onProjectChange(updatedProject)

      // Seleccionar el nuevo nodo
      setSelectedNodeId(newNode.id)
    },
    [activeTablero, selectedNode, selectedNodeId, activeDiagram, project, onProjectChange]
  )

  const handleUpdateNode = useCallback(
    (updates: Partial<UnifilNode>) => {
      if (!selectedNode || !activeTablero) return

      let newDiagram = updateNode(activeDiagram, selectedNode.id, updates)

      // Si se actualizó posición o es un cambio de parámetros, aplicar layout si es necesario
      if (updates.params) {
        newDiagram = updateNodeParams(activeDiagram, selectedNode.id, updates.params)
      }

      const updatedProject = saveDiagram(project, newDiagram)
      onProjectChange(updatedProject)
    },
    [selectedNode, activeTablero, activeDiagram, project, onProjectChange]
  )

  const handleDeleteNode = useCallback(() => {
    if (!selectedNode || !activeTablero) return

    let newDiagram = removeNode(activeDiagram, selectedNode.id)

    // Aplicar layout automático
    newDiagram = calculateAutoLayout(newDiagram)

    const updatedProject = saveDiagram(project, newDiagram)
    onProjectChange(updatedProject)

    // Deseleccionar
    setSelectedNodeId(null)
  }, [selectedNode, activeTablero, activeDiagram, project, onProjectChange])

  // ========================================
  // Render
  // ========================================

  if (!activeTablero) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: '#64748b',
          textAlign: 'center',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        <div style={{ fontSize: '32px' }}>📋</div>
        <p>No hay tableros disponibles en el proyecto.</p>
        <p style={{ fontSize: '12px', color: '#475569' }}>
          Crea un tablero en la sección de configuración del proyecto.
        </p>
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        background: '#0f172a'
      }}
    >
      {/* TopBar con selector de tablero */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 20px',
          background: '#0f172a',
          borderBottom: '1px solid #1e293b',
          height: '56px'
        }}
      >
        <label
          style={{
            fontSize: '12px',
            fontWeight: '600',
            color: '#94a3b8',
            textTransform: 'uppercase'
          }}
        >
          Tablero:
        </label>

        <select
          value={selectedTableroId || ''}
          onChange={(e) => {
            setSelectedTableroId(e.target.value || null)
            setSelectedNodeId(null) // Reset selection
          }}
          style={{
            padding: '6px 12px',
            borderRadius: '4px',
            border: '1px solid #334155',
            background: '#1e293b',
            color: '#e2e8f0',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          {(project.tableros || []).map((t) => (
            <option key={t.id} value={t.id}>
              {t.nombre}
            </option>
          ))}
        </select>

        <div style={{ flex: 1 }} />

        <div style={{ fontSize: '12px', color: '#64748b' }}>
          {activeDiagram.nodes.length} elementos · {activeDiagram.edges.length} conexiones
        </div>
      </div>

      {/* Main content: Canvas + Sidebar */}
      <div
        style={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
          minHeight: 0
        }}
      >
        {/* Canvas */}
        <UnifilCanvas
          diagram={activeDiagram}
          selectedNodeId={selectedNodeId}
          onSelectNode={handleSelectNode}
          onAddChild={handleAddChild}
        />

        {/* Sidebar */}
        <UnifilSidePanel
          diagram={activeDiagram}
          selectedNode={selectedNode}
          tablero={activeTablero}
          onUpdateNode={handleUpdateNode}
          onDeleteNode={handleDeleteNode}
          onAddChild={handleCreateChildNode}
          onClose={() => setSelectedNodeId(null)}
          project={project}
        />
      </div>
    </div>
  )
}
