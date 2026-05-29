/**
 * UnifilCanvas.tsx
 * Canvas SVG para diagrama unifilar con layout automático top-down
 */

import { useMemo } from 'react'
import { useSymbols } from '../../core/SymbolsContext'
import type { UnifilDiagram, UnifilNode } from '../../types'
import type { DefinicionSimbolo } from '../../lib/symbols'
import {
  AlimentadorSymbol,
  TermomagneticoSymbol,
  DiferencialSymbol,
  BarraDistribuidoraSymbol,
  CircuitoTerminalSymbol
} from './symbols'

interface UnifilCanvasProps {
  diagram: UnifilDiagram
  selectedNodeId: string | null
  onSelectNode: (nodeId: string | null) => void
  onAddChild: (parentNodeId: string) => void
}

const UNIFIL_SYMBOL_IDS: Record<UnifilNode['tipo'], string> = {
  alimentador: 'sym-unifilar-alimentador',
  seccionador: 'sym-unifilar-termomagnetico',
  seccionador_nh: 'sym-unifilar-termomagnetico',
  interruptor_seccionador: 'sym-unifilar-termomagnetico',
  termomagnetico: 'sym-unifilar-termomagnetico',
  diferencial: 'sym-unifilar-diferencial',
  diferencial_selectivo: 'sym-unifilar-diferencial',
  caja_moldeada: 'sym-unifilar-termomagnetico',
  barra_distribuidora: 'sym-unifilar-barra-distribuidora',
  peine: 'sym-unifilar-barra-distribuidora',
  borne: 'sym-unifilar-barra-distribuidora',
  barra_equipotencial: 'sym-unifilar-barra-distribuidora',
  dps: 'sym-unifilar-diferencial',
  circuito_terminal: 'sym-unifilar-circuito-terminal'
}

function renderSymbolFromDefinition(symbol: DefinicionSimbolo, size: number, selected: boolean) {
  const scale = size / 2

  return (
    <g>
      {selected && (
        <rect
          x={-size / 2}
          y={-size / 2}
          width={size}
          height={size}
          rx={8}
          fill="rgba(56, 189, 248, 0.12)"
          stroke="#38bdf8"
          strokeWidth={1.5}
        />
      )}
      <g transform={`scale(${scale})`} dangerouslySetInnerHTML={{ __html: symbol.svgContent }} />
    </g>
  )
}

// Mapeo de tipos de nodo a componentes de símbolo
function getSymbolComponent(
  tipo: UnifilNode['tipo'],
  node: UnifilNode,
  selected: boolean,
  symbolsLib: DefinicionSimbolo[]
) {
  const size = 36
  const symbolId = UNIFIL_SYMBOL_IDS[tipo]
  const symbolDef = symbolId ? symbolsLib.find(s => s.id === symbolId) : undefined

  if (symbolDef) {
    return renderSymbolFromDefinition(symbolDef, size, selected)
  }

  switch (tipo) {
    case 'alimentador':
      return <AlimentadorSymbol size={size} selected={selected} />
    case 'termomagnetico':
      return (
        <TermomagneticoSymbol
          size={size}
          selected={selected}
          polos={node.params.polos}
        />
      )
    case 'diferencial':
    case 'diferencial_selectivo':
      return (
        <DiferencialSymbol
          size={size}
          selected={selected}
          sensibilidadMA={node.params.sensibilidadMA}
          polos={node.params.polos}
        />
      )
    case 'barra_distribuidora':
      return (
        <BarraDistribuidoraSymbol
          size={size}
          selected={selected}
          cantSalidas={node.params.cantSalidas}
        />
      )
    case 'circuito_terminal':
      return (
        <CircuitoTerminalSymbol
          size={size}
          selected={selected}
          label={node.label}
          tipo={node.params.descripcionLibre?.split(' ')[0]}
        />
      )
    default:
      // Símbolo por defecto: cuadrado simple
      return (
        <g>
          <rect
            x="-18"
            y="-18"
            width="36"
            height="36"
            fill={selected ? 'rgba(56, 189, 248, 0.15)' : 'none'}
            stroke={selected ? '#38bdf8' : '#e2e8f0'}
            strokeWidth="1.5"
            rx="3"
          />
          <text
            x="0"
            y="4"
            textAnchor="middle"
            fill={selected ? '#38bdf8' : '#94a3b8'}
            fontSize="9"
            fontWeight="600"
            fontFamily="Inter, sans-serif"
          >
            {tipo.slice(0, 3).toUpperCase()}
          </text>
        </g>
      )
  }
}

export function UnifilCanvas({
  diagram,
  selectedNodeId,
  onSelectNode,
  onAddChild
}: UnifilCanvasProps) {
  // Calcular bounding box del canvas
  const canvasBounds = useMemo(() => {
    if (diagram.nodes.length === 0) {
      return { minX: 0, maxX: 800, minY: 0, maxY: 600 }
    }

    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity

    diagram.nodes.forEach(node => {
      const nodeSize = 36
      minX = Math.min(minX, node.posX - nodeSize)
      maxX = Math.max(maxX, node.posX + nodeSize)
      minY = Math.min(minY, node.posY - nodeSize)
      maxY = Math.max(maxY, node.posY + nodeSize)
    })

    // Agregar padding
    const padding = 60
    return {
      minX: Math.max(0, minX - padding),
      maxX: maxX + padding,
      minY: Math.max(0, minY - padding),
      maxY: maxY + padding,
      width: maxX - minX + padding * 2,
      height: maxY - minY + padding * 2
    }
  }, [diagram.nodes])

  const viewBox = `${canvasBounds.minX} ${canvasBounds.minY} ${canvasBounds.width || 800} ${canvasBounds.height || 600}`

  // Renderizar edges
  const edgesGroup = useMemo(() => {
    return diagram.edges.map(edge => {
      const fromNode = diagram.nodes.find(n => n.id === edge.fromNodeId)
      const toNode = diagram.nodes.find(n => n.id === edge.toNodeId)

      if (!fromNode || !toNode) return null

      const isSelected =
        selectedNodeId === edge.fromNodeId || selectedNodeId === edge.toNodeId

      return (
        <g key={edge.id}>
          {/* Línea principal vertical */}
          <line
            x1={fromNode.posX}
            y1={fromNode.posY + 20}
            x2={toNode.posX}
            y2={toNode.posY - 20}
            stroke={isSelected ? '#38bdf8' : '#475569'}
            strokeWidth={isSelected ? 2 : 1.5}
            strokeLinecap="round"
          />

          {/* Marcas de conductores si existen */}
          {edge.conductores && (
            <UnifilEdgeLabel
              fromX={fromNode.posX}
              fromY={fromNode.posY + 20}
              toX={toNode.posX}
              toY={toNode.posY - 20}
              conductores={edge.conductores}
              selected={isSelected}
            />
          )}
        </g>
      )
    })
  }, [diagram.edges, diagram.nodes, selectedNodeId])

  // Renderizar nodos
  const { symbolsLib } = useSymbols()

  const nodesGroup = useMemo(() => {
    return diagram.nodes.map(node => {
      const isSelected = selectedNodeId === node.id
      const hasChildren = diagram.edges.some(e => e.fromNodeId === node.id)

      return (
        <g key={node.id}>
          {/* Símbolo del nodo */}
          <g
            transform={`translate(${node.posX}, ${node.posY})`}
            onClick={() => onSelectNode(node.id)}
            style={{ cursor: 'pointer' }}
          >
            {getSymbolComponent(node.tipo, node, isSelected, symbolsLib)}
          </g>

          {/* Etiqueta con In (si existe) */}
          {node.params.inominalA && (
            <text
              x={node.posX}
              y={node.posY + 30}
              textAnchor="middle"
              fill={isSelected ? '#38bdf8' : '#64748b'}
              fontSize="10"
              fontWeight="600"
              fontFamily="Inter, sans-serif"
            >
              {node.params.inominalA}A
            </text>
          )}

          {/* Botón "+" para agregar hijo (solo si no tiene hijos yet y es terminal) */}
          {isSelected && !hasChildren && (
            <g
              transform={`translate(${node.posX}, ${node.posY + 50})`}
              onClick={() => onAddChild(node.id)}
              style={{ cursor: 'pointer' }}
            >
              {/* Círculo del botón */}
              <circle
                cx="0"
                cy="0"
                r="12"
                fill="#38bdf8"
                opacity="0.9"
              />
              {/* Símbolo + */}
              <line
                x1="-4"
                y1="0"
                x2="4"
                y2="0"
                stroke="#0f172a"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <line
                x1="0"
                y1="-4"
                x2="0"
                y2="4"
                stroke="#0f172a"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </g>
          )}
        </g>
      )
    })
  }, [diagram.nodes, diagram.edges, selectedNodeId, onSelectNode, onAddChild])

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: '#0f172a',
        overflow: 'auto',
        position: 'relative'
      }}
    >
      {diagram.nodes.length === 0 ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#64748b',
            fontSize: '14px',
            textAlign: 'center',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          <div style={{ fontSize: '32px' }}>📊</div>
          <span>El diagrama unifilar está vacío.</span>
          <span style={{ fontSize: '12px', color: '#475569' }}>
            Agrega un elemento alimentador para comenzar.
          </span>
        </div>
      ) : (
        <svg
          viewBox={viewBox}
          style={{
            width: '100%',
            height: '100%',
            minWidth: '800px',
            minHeight: '600px'
          }}
        >
          {/* Fondo */}
          <defs>
            <pattern
              id="grid"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="#1e293b"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect
            width={canvasBounds.width || 800}
            height={canvasBounds.height || 600}
            fill="url(#grid)"
          />

          {/* Edges */}
          {edgesGroup}

          {/* Nodos */}
          {nodesGroup}
        </svg>
      )}
    </div>
  )
}

/**
 * Componente auxiliar: marcas de conductores en edge
 */
interface UnifilEdgeLabelProps {
  fromX: number
  fromY: number
  toX: number
  toY: number
  conductores: any
  selected: boolean
}

function UnifilEdgeLabel({
  fromX,
  fromY,
  toX,
  toY,
  conductores,
  selected
}: UnifilEdgeLabelProps) {
  // Punto medio de la línea
  const midX = (fromX + toX) / 2
  const midY = (fromY + toY) / 2

  // Vector perpendicular para desplazar las marcas
  const dx = toX - fromX
  const dy = toY - fromY
  const len = Math.sqrt(dx * dx + dy * dy)
  const perpX = -dy / len * 8
  const perpY = dx / len * 8

  // Contar conductores totales
  const total = conductores.cantFases + (conductores.conNeutro ? 1 : 0) + (conductores.conPE ? 1 : 0)
  const labelColor = selected ? '#38bdf8' : '#64748b'

  // Armar string de descripción
  const desc = `${conductores.cantFases}x${conductores.seccionMM2}${
    conductores.conNeutro ? `+N${conductores.seccionMM2}` : ''
  }${conductores.conPE ? `+PE${conductores.seccionMM2}` : ''} ${conductores.material || 'Cu'}`

  return (
    <g>
      {/* Marcas oblicuas IEC */}
      {Array.from({ length: Math.min(total, 4) }).map((_, i) => {
        const offset = (i - (total - 1) / 2) * 6
        return (
          <line
            key={`mark-${i}`}
            x1={midX + perpX + offset - 2}
            y1={midY + perpY + offset - 2}
            x2={midX + perpX + offset + 2}
            y2={midY + perpY + offset + 2}
            stroke={labelColor}
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        )
      })}

      {/* Texto de descripción */}
      <text
        x={midX + perpX + 12}
        y={midY + perpY}
        fill={labelColor}
        fontSize="9"
        fontWeight="500"
        fontFamily="Inter, monospace"
        dominantBaseline="middle"
      >
        {desc}
      </text>
    </g>
  )
}
