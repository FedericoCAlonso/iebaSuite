/**
 * utils/unifilUtils.ts
 * Funciones de mutación inmutable para diagrama unifilar
 */

import { generateId } from '../lib/storage'
import type {
  UnifilNode,
  UnifilEdge,
  UnifilDiagram,
  UnifilNodeParams,
  UnifilConductorDesc,
  Project
} from '../types'

/**
 * Crea un nodo unifilar nuevo con valores por defecto
 */
export function createUnifilNode(
  tipo: UnifilNode['tipo'],
  tableroId: string,
  posX: number = 0,
  posY: number = 0,
  params: UnifilNodeParams = {}
): UnifilNode {
  return {
    id: generateId(),
    tipo,
    tableroId,
    label: `${tipo} ${generateId().slice(0, 5)}`,
    posX,
    posY,
    params
  }
}

/**
 * Crea un edge (conexión) entre dos nodos
 */
export function createUnifilEdge(
  fromNodeId: string,
  toNodeId: string,
  tableroId: string,
  conductores?: UnifilConductorDesc
): UnifilEdge {
  return {
    id: generateId(),
    tableroId,
    fromNodeId,
    toNodeId,
    conductores
  }
}

/**
 * Agregar un nodo al diagrama, opcionalmente como hijo de otro nodo
 * Si parentNodeId está presente, se crea automáticamente el edge
 */
export function addNode(
  diagram: UnifilDiagram,
  node: UnifilNode,
  parentNodeId?: string
): UnifilDiagram {
  const newDiagram = {
    ...diagram,
    nodes: [...diagram.nodes, node]
  }

  // Si hay padre, crear edge automáticamente
  if (parentNodeId) {
    const parent = diagram.nodes.find(n => n.id === parentNodeId)
    if (parent) {
      const edge = createUnifilEdge(parentNodeId, node.id, diagram.tableroId)
      newDiagram.edges = [...newDiagram.edges, edge]
    }
  }

  return newDiagram
}

/**
 * Remover un nodo y todos sus edges asociados (incluyendo hijos en cascada)
 */
export function removeNode(diagram: UnifilDiagram, nodeId: string): UnifilDiagram {
  // Encontrar todos los nodos hijos (recursivo)
  const childrenToRemove = new Set<string>()
  const queue = [nodeId]
  
  while (queue.length > 0) {
    const current = queue.pop()!
    childrenToRemove.add(current)
    
    // Buscar hijos del nodo actual
    const children = diagram.edges
      .filter(e => e.fromNodeId === current)
      .map(e => e.toNodeId)
    
    children.forEach(childId => {
      if (!childrenToRemove.has(childId)) {
        queue.push(childId)
      }
    })
  }

  // Remover nodos
  const newNodes = diagram.nodes.filter(n => !childrenToRemove.has(n.id))
  
  // Remover edges asociados (que tengan como origen o destino cualquiera de los nodos removidos)
  const newEdges = diagram.edges.filter(e => 
    !childrenToRemove.has(e.fromNodeId) && !childrenToRemove.has(e.toNodeId)
  )

  return {
    ...diagram,
    nodes: newNodes,
    edges: newEdges
  }
}

/**
 * Actualizar parámetros de un nodo existente
 */
export function updateNode(
  diagram: UnifilDiagram,
  nodeId: string,
  updates: Partial<Omit<UnifilNode, 'id' | 'tipo' | 'tableroId'>>
): UnifilDiagram {
  const nodeIndex = diagram.nodes.findIndex(n => n.id === nodeId)
  if (nodeIndex === -1) return diagram

  const updatedNode: UnifilNode = {
    ...diagram.nodes[nodeIndex],
    ...updates
  }

  const newNodes = [...diagram.nodes]
  newNodes[nodeIndex] = updatedNode

  return {
    ...diagram,
    nodes: newNodes
  }
}

/**
 * Actualizar solo los parámetros (UnifilNodeParams) de un nodo
 */
export function updateNodeParams(
  diagram: UnifilDiagram,
  nodeId: string,
  paramUpdates: Partial<UnifilNodeParams>
): UnifilDiagram {
  const nodeIndex = diagram.nodes.findIndex(n => n.id === nodeId)
  if (nodeIndex === -1) return diagram

  const updatedNode: UnifilNode = {
    ...diagram.nodes[nodeIndex],
    params: {
      ...diagram.nodes[nodeIndex].params,
      ...paramUpdates
    }
  }

  const newNodes = [...diagram.nodes]
  newNodes[nodeIndex] = updatedNode

  return {
    ...diagram,
    nodes: newNodes
  }
}

/**
 * Agregar un edge (conexión) entre dos nodos
 */
export function addEdge(diagram: UnifilDiagram, edge: UnifilEdge): UnifilDiagram {
  // Validar que ambos nodos existan
  const fromExists = diagram.nodes.some(n => n.id === edge.fromNodeId)
  const toExists = diagram.nodes.some(n => n.id === edge.toNodeId)
  
  if (!fromExists || !toExists) {
    console.warn(`addEdge: uno o ambos nodos no existen en el diagrama`)
    return diagram
  }

  // Verificar que no exista edge duplicado
  const alreadyExists = diagram.edges.some(
    e => e.fromNodeId === edge.fromNodeId && e.toNodeId === edge.toNodeId
  )
  
  if (alreadyExists) {
    console.warn(`addEdge: edge ya existe entre ${edge.fromNodeId} y ${edge.toNodeId}`)
    return diagram
  }

  return {
    ...diagram,
    edges: [...diagram.edges, edge]
  }
}

/**
 * Remover un edge específico
 */
export function removeEdge(
  diagram: UnifilDiagram,
  fromNodeId: string,
  toNodeId: string
): UnifilDiagram {
  const newEdges = diagram.edges.filter(
    e => !(e.fromNodeId === fromNodeId && e.toNodeId === toNodeId)
  )

  return {
    ...diagram,
    edges: newEdges
  }
}

/**
 * Actualizar descripción de conductores de un edge
 */
export function updateEdgeConductores(
  diagram: UnifilDiagram,
  fromNodeId: string,
  toNodeId: string,
  conductores: UnifilConductorDesc
): UnifilDiagram {
  const edgeIndex = diagram.edges.findIndex(
    e => e.fromNodeId === fromNodeId && e.toNodeId === toNodeId
  )

  if (edgeIndex === -1) {
    console.warn(`updateEdgeConductores: edge no encontrado`)
    return diagram
  }

  const updatedEdge = {
    ...diagram.edges[edgeIndex],
    conductores
  }

  const newEdges = [...diagram.edges]
  newEdges[edgeIndex] = updatedEdge

  return {
    ...diagram,
    edges: newEdges
  }
}

/**
 * Obtener el diagrama unifilar de un tablero específico
 * Retorna un diagrama vacío si no existe
 */
export function getDiagramForTablero(
  project: Project,
  tableroId: string
): UnifilDiagram {
  const diagram = project.unifilDiagrams?.find(d => d.tableroId === tableroId)
  
  if (diagram) {
    return diagram
  }

  // Retornar diagrama vacío
  return {
    tableroId,
    nodes: [],
    edges: []
  }
}

/**
 * Guardar un diagrama modificado en el proyecto
 * Actualiza o crea el diagrama del tablero correspondiente
 */
export function saveDiagram(project: Project, diagram: UnifilDiagram): Project {
  const diagrams = project.unifilDiagrams || []
  const existingIndex = diagrams.findIndex(d => d.tableroId === diagram.tableroId)

  let newDiagrams: UnifilDiagram[]

  if (existingIndex >= 0) {
    // Actualizar diagrama existente
    newDiagrams = [...diagrams]
    newDiagrams[existingIndex] = diagram
  } else {
    // Crear nuevo diagrama
    newDiagrams = [...diagrams, diagram]
  }

  return {
    ...project,
    unifilDiagrams: newDiagrams,
    updatedAt: Date.now()
  }
}

/**
 * Obtener todos los nodos hijos de un nodo (directo, no recursivo)
 */
export function getDirectChildren(
  diagram: UnifilDiagram,
  parentNodeId: string
): UnifilNode[] {
  const childIds = diagram.edges
    .filter(e => e.fromNodeId === parentNodeId)
    .map(e => e.toNodeId)

  return diagram.nodes.filter(n => childIds.includes(n.id))
}

/**
 * Obtener el camino desde un nodo hasta la raíz (alimentador)
 */
export function getPathToRoot(
  diagram: UnifilDiagram,
  nodeId: string
): UnifilNode[] {
  const path: UnifilNode[] = []
  let current = diagram.nodes.find(n => n.id === nodeId)

  while (current) {
    path.unshift(current)
    
    // Buscar el nodo padre (edge inverso)
    const parentEdge = diagram.edges.find(e => e.toNodeId === current!.id)
    if (parentEdge) {
      current = diagram.nodes.find(n => n.id === parentEdge.fromNodeId)
    } else {
      current = undefined
    }
  }

  return path
}

/**
 * Calcular posiciones automáticas para todos los nodos usando layout top-down
 * Algoritmo: raíz en centro, deltaY=120px entre niveles, hijos distribuidos horizontalmente
 */
export function calculateAutoLayout(diagram: UnifilDiagram): UnifilDiagram {
  const DELTA_Y = 120
  const DELTA_X = 150
  const CENTER_X = 400  // Centro del canvas (aproximado)

  // Construir mapa de profundidad (BFS)
  const depthMap = new Map<string, number>()
  const parentMap = new Map<string, string[]>()

  diagram.nodes.forEach(n => {
    if (!parentMap.has(n.id)) {
      parentMap.set(n.id, [])
    }
  })

  diagram.edges.forEach(e => {
    const children = parentMap.get(e.fromNodeId) || []
    children.push(e.toNodeId)
    parentMap.set(e.fromNodeId, children)
  })

  // Encontrar raíces (nodos sin padre)
  const roots = diagram.nodes.filter(n => {
    const hasParent = diagram.edges.some(e => e.toNodeId === n.id)
    return !hasParent
  })

  // BFS para asignar profundidad
  const queue: Array<[string, number]> = roots.map(r => [r.id, 0])
  
  while (queue.length > 0) {
    const [nodeId, depth] = queue.shift()!
    depthMap.set(nodeId, depth)

    const children = parentMap.get(nodeId) || []
    children.forEach(childId => {
      if (!depthMap.has(childId)) {
        queue.push([childId, depth + 1])
      }
    })
  }

  // Agrupar nodos por profundidad y calcular posición horizontal
  const byDepth = new Map<number, string[]>()
  depthMap.forEach((depth, nodeId) => {
    if (!byDepth.has(depth)) {
      byDepth.set(depth, [])
    }
    byDepth.get(depth)!.push(nodeId)
  })

  // Calcular X basado en la posición de hijos bajo el mismo padre
  const positionMap = new Map<string, { x: number; y: number }>()

  // Asignar Y basado en depth
  depthMap.forEach((depth, nodeId) => {
    const y = 60 + depth * DELTA_Y
    positionMap.set(nodeId, { x: 0, y })  // X se calcula luego
  })

  // Calcular X con distribución horizontal equilibrada
  parentMap.forEach((childIds, parentId) => {
    const parentPos = positionMap.get(parentId)
    if (!parentPos || childIds.length === 0) return

    const totalWidth = (childIds.length - 1) * DELTA_X
    const startX = parentPos.x - totalWidth / 2

    childIds.forEach((childId, index) => {
      const x = startX + index * DELTA_X
      const pos = positionMap.get(childId)
      if (pos) {
        positionMap.set(childId, { ...pos, x })
      }
    })
  })

  // Si algún nodo no tiene posición calculada, usar raíz como base
  const rootPos = positionMap.get(roots[0]?.id || '')
  const defaultX = rootPos?.x ?? CENTER_X

  // Actualizar nodos con nuevas posiciones
  const newNodes = diagram.nodes.map(n => {
    const pos = positionMap.get(n.id)
    return {
      ...n,
      posX: pos?.x ?? defaultX,
      posY: pos?.y ?? 60
    }
  })

  return {
    ...diagram,
    nodes: newNodes
  }
}
