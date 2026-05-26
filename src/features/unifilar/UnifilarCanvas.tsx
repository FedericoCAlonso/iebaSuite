import type { Project, Tablero, Diferencial, Circuito, CabeceraConfig } from '../../types/index'

interface UnifilarCanvasProps {
  project: Project
  activeTablero: Tablero | null
  selectedElement: {
    type: 'suministro' | 'tablero' | 'diferencial' | 'circuito'
    id: string
  } | null
  onSelectElement: (element: { type: 'suministro' | 'tablero' | 'diferencial' | 'circuito'; id: string } | null) => void
  validations: Array<{
    elementId: string
    elementType: 'circuito' | 'diferencial' | 'tablero'
    severity: 'error' | 'warning'
    message: string
  }>
}

type TreeNode = {
  type: 'diferencial' | 'circuito';
  id: string;
  item: Diferencial | Circuito;
  children: TreeNode[];
  width: number;
  x: number;
  y: number;
};

export function UnifilarCanvas({
  project,
  activeTablero,
  selectedElement,
  onSelectElement,
  validations
}: UnifilarCanvasProps) {
  if (!activeTablero) {
    return (
      <div style={{
        display: 'flex',
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text3)',
        fontSize: '14px',
        padding: '2rem',
        textAlign: 'center'
      }}>
        Seleccioná un tablero para visualizar su diagrama unifilar.
      </div>
    )
  }

  const circuitos = (project.circuitos || []).filter(c => c.tableroId === activeTablero.id)
  const diferenciales = (project.diferenciales || []).filter(d => d.tableroId === activeTablero.id)

  const elementsMap = new Map<string, TreeNode>()
  circuitos.forEach(c => elementsMap.set(c.id, { type: 'circuito', id: c.id, item: c, children: [], width: 0, x: 0, y: 0 }))
  diferenciales.forEach(d => elementsMap.set(d.id, { type: 'diferencial', id: d.id, item: d, children: [], width: 0, x: 0, y: 0 }))

  const roots: TreeNode[] = []

  // Build tree
  elementsMap.forEach((node, id) => {
    let parentId = node.type === 'circuito' ? (node.item as Circuito).parentId : (node.item as Diferencial).parentId;
    
    // Legacy support for Differential -> Circuit linking
    if (!parentId && node.type === 'circuito') {
       const dif = diferenciales.find(d => d.circuitosIds?.includes(id));
       if (dif) parentId = dif.id;
    }

    if (parentId && elementsMap.has(parentId)) {
      elementsMap.get(parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  })

  // Calculate Layout (Bottom-up width, Top-down positioning)
  const COLUMN_WIDTH = 180;
  const GROUP_SPACING = 40;
  const LEVEL_HEIGHT = 160;

  function calculateWidth(node: TreeNode): number {
    if (node.children.length === 0) {
      node.width = COLUMN_WIDTH;
      return node.width;
    }
    let totalW = 0;
    for (let i = 0; i < node.children.length; i++) {
      totalW += calculateWidth(node.children[i]);
      if (i < node.children.length - 1) totalW += GROUP_SPACING;
    }
    node.width = Math.max(COLUMN_WIDTH, totalW);
    return node.width;
  }

  roots.forEach(calculateWidth);

  let totalRootsWidth = roots.reduce((acc, root, idx) => acc + root.width + (idx < roots.length - 1 ? GROUP_SPACING : 0), 0);
  const totalWidth = Math.max(800, totalRootsWidth + 100);

  function assignPositions(node: TreeNode, startX: number, y: number) {
    node.x = startX + node.width / 2;
    node.y = y;
    
    let currentChildX = startX;
    node.children.forEach(child => {
      assignPositions(child, currentChildX, y + LEVEL_HEIGHT);
      currentChildX += child.width + GROUP_SPACING;
    });
  }

  let currentRootX = (totalWidth - totalRootsWidth) / 2;
  roots.forEach(root => {
    assignPositions(root, currentRootX, 215);
    currentRootX += root.width + GROUP_SPACING;
  });

  const getValidationIcon = (id: string, type: 'circuito' | 'diferencial' | 'tablero') => {
    const val = validations.find(v => v.elementId === id && v.elementType === type)
    if (!val) return null
    return (
      <g transform="translate(15, -15)">
        <circle r="9" fill={val.severity === 'error' ? '#ef4444' : '#f59e0b'} />
        <text y="3" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold" fontFamily="Inter, sans-serif">!</text>
        <title>{val.message}</title>
      </g>
    )
  }

  const getCabeceraSymbol = (config?: CabeceraConfig) => {
    const tipo = config?.tipo || 'seccionador';
    return tipo;
  }

  // Render Cabecera Símbolos
  const renderCabeceraElement = (x: number, y: number, isSelected: boolean, config?: CabeceraConfig) => {
    const tipo = getCabeceraSymbol(config);
    const stroke = isSelected ? '#38bdf8' : '#e2e8f0';
    const fill = isSelected ? 'rgba(56, 189, 248, 0.15)' : 'none';
    
    return (
      <g stroke={stroke} fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" transform={`translate(${x}, ${y})`}>
        <line x1={0} y1={0} x2={0} y2={10} />
        <line x1={0} y1={10} x2={10} y2={25} />
        <line x1={0} y1={25} x2={0} y2={35} />
        
        {tipo === 'seccionador' && (
          <line x1={-4} y1={10} x2={4} y2={10} strokeWidth="2" />
        )}
        
        {tipo === 'interruptor_seccionador' && (
          <>
            <line x1={-4} y1={10} x2={4} y2={10} strokeWidth="2" />
            <circle cx={0} cy={10} r={2} fill={stroke} />
          </>
        )}
        
        {tipo === 'TM' && (
          <>
            <rect x={-4} y={5} width={8} height={6} fill={fill} strokeWidth="1" />
            <path d={`M -5 20 A 5 5 0 0 1 5 20`} strokeWidth="1" fill="none" />
          </>
        )}

        {tipo === 'DR' && (
          <>
            <circle cx={0} cy={18} r={8} strokeWidth="1" fill={fill} />
            <line x1={8} y1={18} x2={5} y2={15} strokeDasharray="2 2" strokeWidth="1" />
          </>
        )}

        <text x={15} y={15} stroke="none" fill={isSelected ? '#38bdf8' : '#94a3b8'} fontSize="10" fontWeight="600" fontFamily="Inter, sans-serif">
          {config?.inominalA ? `${config.inominalA}A` : '—'} {tipo.replace('_', ' ')}
        </text>
        {tipo === 'DR' && (
          <text x={15} y={27} stroke="none" fill="#64748b" fontSize="9" fontFamily="Inter, sans-serif">
            {config?.sensibilidadMA ? `${config.sensibilidadMA}mA` : ''} · {config?.polos || 2}P
          </text>
        )}
      </g>
    )
  }

  // Barritas de conductores
  const renderConductorMarkers = (x: number, y: number, polos: number, addPE: boolean) => {
    const lines = [];
    // Base diagonal line for markers
    lines.push(<line key="base" x1={x - 8} y1={y + 8} x2={x + 8} y2={y - 8} stroke="#64748b" strokeWidth="1.5" />);
    
    // Calculate phases and neutral
    const numFases = polos === 4 || polos === 3 ? 3 : 1;
    const hasNeutral = polos === 4 || polos === 2;
    
    let currentOffset = -4;
    const step = 3;

    // Phases
    for (let i = 0; i < numFases; i++) {
      lines.push(<line key={`f_${i}`} x1={x + currentOffset} y1={y - currentOffset - 4} x2={x + currentOffset} y2={y - currentOffset + 4} stroke="#64748b" strokeWidth="1.5" />);
      currentOffset += step;
    }

    // Neutral
    if (hasNeutral) {
      lines.push(
        <g key="n" transform={`translate(${x + currentOffset}, ${y - currentOffset})`}>
          <line x1={0} y1={-5} x2={0} y2={5} stroke="#64748b" strokeWidth="1.5" />
          <circle cx={0} cy={-5} r={1.5} fill="#64748b" stroke="none" />
        </g>
      );
      currentOffset += step;
    }

    // PE at the end if requested
    if (addPE) {
      lines.push(
        <g key="pe" transform={`translate(${x + currentOffset}, ${y - currentOffset})`}>
          <line x1={0} y1={-4} x2={0} y2={4} stroke="#10b981" strokeWidth="1.5" />
          <line x1={-2} y1={-4} x2={2} y2={-4} stroke="#10b981" strokeWidth="1.5" />
        </g>
      );
    }

    return <g>{lines}</g>
  }

  // Render Node Recursively
  const renderTreeNode = (node: TreeNode, parentY: number) => {
    const isSelected = selectedElement?.type === node.type && selectedElement?.id === node.id;
    const isDiferencial = node.type === 'diferencial';
    const c = node.item as Circuito;
    const d = node.item as Diferencial;
    
    const elementY = node.y;
    const childrenY = elementY + LEVEL_HEIGHT;

    return (
      <g key={node.id}>
        {/* Line from parent to this element */}
        <line
          x1={node.x}
          y1={parentY}
          x2={node.x}
          y2={elementY}
          stroke={isSelected ? '#38bdf8' : '#475569'}
          strokeWidth={isSelected ? '2' : '1.5'}
        />

        {/* The Element Symbol */}
        <g
          transform={`translate(${node.x}, ${elementY})`}
          onClick={(e) => { e.stopPropagation(); onSelectElement({ type: node.type, id: node.id }) }}
          style={{ cursor: 'pointer' }}
        >
          <rect x="-15" y="-5" width="30" height="45" fill="transparent" stroke="none" />
          {isDiferencial ? (
            <g>
              {renderCabeceraElement(0, 0, isSelected, { tipo: 'DR', inominalA: d.inominalA, sensibilidadMA: d.sensibilidadMA, polos: d.polos })}
            </g>
          ) : (
            <g>
              {renderCabeceraElement(0, 0, isSelected, { tipo: c.tipo === 'DPS' ? 'otro' : 'TM', inominalA: c.corrienteNominal, polos: c.polos })}
              {c.tipo === 'DPS' && <text x={15} y={27} fill="#ef4444" fontSize="9" fontWeight="bold">DPS</text>}
            </g>
          )}
          {getValidationIcon(node.id, node.type)}
        </g>

        {/* Line down from element */}
        <line
          x1={node.x}
          y1={elementY + 35}
          x2={node.x}
          y2={node.children.length > 0 ? childrenY - 10 : elementY + 90}
          stroke={isSelected ? '#38bdf8' : '#475569'}
          strokeWidth={isSelected ? '2' : '1.5'}
        />

        {/* If it's a leaf circuit, draw the cable and load block */}
        {!isDiferencial && node.children.length === 0 && (
          <g>
            {/* Cable Description and Markers */}
            <g transform={`translate(${node.x}, ${elementY + 60})`} stroke="none" textAnchor="middle" fontFamily="Inter, sans-serif">
              {renderConductorMarkers(0, -10, c.polos || 2, true)}
              <text y="5" fill="#f8fafc" fontSize="10" fontWeight="600">{c.seccion ? `${c.seccion.toFixed(1)} mm²` : '—'} {c.material === 'aluminio' ? 'Al' : 'Cu'}</text>
              <text y="17" fill="#64748b" fontSize="8">{c.tipoConducto || '—'}</text>
            </g>

            {/* Load Block */}
            <g
              transform={`translate(${node.x}, ${elementY + 110})`}
              onClick={(e) => { e.stopPropagation(); onSelectElement({ type: 'circuito', id: node.id }) }}
              style={{ cursor: 'pointer' }}
            >
              <polygon points="-10,0 10,0 0,12" fill={isSelected ? '#38bdf8' : '#475569'} />
              <rect
                x="-70" y="15" width="140" height="45" rx="4"
                fill="#1e293b"
                stroke={isSelected ? '#38bdf8' : '#334155'} strokeWidth="1.5"
                filter={isSelected ? 'url(#glow)' : undefined}
              />
              <text x="0" y="30" textAnchor="middle" fill="#f8fafc" fontSize="10" fontWeight="bold" fontFamily="Inter, sans-serif">
                {c.nombre}: {c.tipo}
              </text>
              <text x="0" y="42" textAnchor="middle" fill="#64748b" fontSize="9" fontFamily="Inter, sans-serif">
                {c.descripcion || 'Sin descripción'}
              </text>
              <text x="0" y="52" textAnchor="middle" fill="#0ea5e9" fontSize="8.5" fontWeight="600" fontFamily="Inter, sans-serif">
                L: {c.longitudDeclarada || '—'} m
              </text>
            </g>
          </g>
        )}

        {/* If it has children, draw a horizontal sub-busbar */}
        {node.children.length > 0 && (
          <g>
            <line
              x1={node.children[0].x}
              y1={childrenY - 10}
              x2={node.children[node.children.length - 1].x}
              y2={childrenY - 10}
              stroke={isDiferencial ? '#10b981' : '#38bdf8'}
              strokeWidth="2"
              strokeLinecap="round"
            />
            {node.children.map(child => renderTreeNode(child, childrenY - 10))}
          </g>
        )}
      </g>
    )
  }

  // Find Feeder info
  let feederText = 'ACOMETIDA'
  let parentTableroId: string | null = null
  if (activeTablero.alimentadorDesdeTableroId === 'red_distribuidora') {
    feederText = 'RED DISTRIBUIDORA'
  } else if (activeTablero.alimentadorDesdeTableroId) {
    parentTableroId = activeTablero.alimentadorDesdeTableroId
    const parentTablero = project.tableros?.find(t => t.id === activeTablero.alimentadorDesdeTableroId)
    const parentCircuit = activeTablero.alimentadorDesdeCircuitoId 
      ? project.circuitos?.find(c => c.id === activeTablero.alimentadorDesdeCircuitoId) 
      : null
    
    if (parentTablero) {
      feederText = `ALIMENTADO DESDE: ${parentTablero.nombre}`
      if (parentCircuit) {
        feederText += ` ➔ ${parentCircuit.nombre}`
      }
    }
  }

  // Canvas Max Depth Height
  let maxDepth = 0;
  function getDepth(node: TreeNode, currentDepth: number) {
    if (currentDepth > maxDepth) maxDepth = currentDepth;
    node.children.forEach(c => getDepth(c, currentDepth + 1));
  }
  roots.forEach(r => getDepth(r, 1));
  const canvasHeight = Math.max(600, 200 + maxDepth * LEVEL_HEIGHT + 200);

  return (
    <div style={{
      width: '100%',
      height: '100%',
      overflow: 'auto',
      backgroundColor: '#0f172a',
      position: 'relative',
      borderRadius: '8px',
      border: '1px solid rgba(255, 255, 255, 0.05)'
    }}>
      <svg
        width={totalWidth}
        height={canvasHeight}
        style={{
          display: 'block',
          backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }}
      >
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* ========================================================
            1. ACOMETIDA / ALIMENTADOR (Top Center)
           ======================================================== */}
        <g
          transform={`translate(${totalWidth / 2}, 30)`}
          onClick={(e) => {
            e.stopPropagation()
            if (parentTableroId) {
              onSelectElement({ type: 'tablero', id: parentTableroId })
            } else {
              onSelectElement({ type: 'suministro', id: 'suministro' })
            }
          }}
          style={{ cursor: 'pointer' }}
        >
          <line x1="0" y1="0" x2="0" y2="40" stroke="#f59e0b" strokeWidth="2" />
          <rect
            x="-120" y="-25" width="240" height="30" rx="4"
            fill="#1e293b"
            stroke={selectedElement?.type === 'suministro' ? '#f59e0b' : '#475569'} strokeWidth="2"
            filter={selectedElement?.type === 'suministro' ? 'url(#glow)' : undefined}
          />
          <text y="-5" textAnchor="middle" fill="#f59e0b" fontSize="10" fontWeight="bold" fontFamily="Inter, sans-serif">
            {feederText}
          </text>
        </g>

        {/* ========================================================
            2. INTERRUPTOR CABECERA DEL TABLERO
           ======================================================== */}
        <g
          transform={`translate(${totalWidth / 2}, 70)`}
          onClick={(e) => {
            e.stopPropagation()
            onSelectElement({ type: 'tablero', id: activeTablero.id })
          }}
          style={{ cursor: 'pointer' }}
        >
          <line x1="0" y1="0" x2="0" y2="20" stroke="#38bdf8" strokeWidth="2" />
          
          <rect
            x="-100" y="20" width="200" height="45" rx="4"
            fill="#1e293b"
            stroke={selectedElement?.type === 'tablero' ? '#38bdf8' : '#334155'} strokeWidth="1.5"
            filter={selectedElement?.type === 'tablero' ? 'url(#glow)' : undefined}
          />
          <text y="40" textAnchor="middle" fill="#e2e8f0" fontSize="11" fontWeight="600" fontFamily="Inter, sans-serif">
            {activeTablero.nombre}
          </text>
          <text y="55" textAnchor="middle" fill="#64748b" fontSize="8" fontFamily="Inter, sans-serif" style={{ textTransform: 'uppercase' }}>
            Tablero {activeTablero.tipo} · FS: {activeTablero.factorSimultaneidad || 1.0}
          </text>

          {/* Renderizar Interruptor Cabecera inside the box or just below it */}
          <g transform="translate(-15, 75)">
             {renderCabeceraElement(0, 0, selectedElement?.type === 'tablero', activeTablero.interruptorCabecera || { tipo: 'seccionador' })}
          </g>

          {getValidationIcon(activeTablero.id, 'tablero')}
          
          <line x1="0" y1="110" x2="0" y2="135" stroke="#38bdf8" strokeWidth="2" />
        </g>

        {/* ========================================================
            3. EMBARRADO PRINCIPAL (Busbar)
           ======================================================== */}
        <g transform="translate(0, 205)">
          <line x1="40" y1="0" x2={totalWidth - 40} y2="0" stroke="#0284c7" strokeWidth="5" strokeLinecap="round" />
          <text x="45" y="-8" fill="#38bdf8" fontSize="9" fontWeight="bold" fontFamily="Inter, sans-serif" letterSpacing="0.5">
            EMBARRADO {activeTablero.nombre} ({project.sistemaDistribucion || 'TT'})
          </text>
          
          <line x1="40" y1="12" x2={totalWidth - 40} y2="12" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeDasharray="8 4" />
          <text x="45" y="23" fill="#10b981" fontSize="8" fontWeight="600" fontFamily="Inter, sans-serif">
            COLECTOR DE TIERRA (PE)
          </text>
          <g transform={`translate(${totalWidth - 30}, 12)`} stroke="#10b981" strokeWidth="1.5" fill="none">
            <line x1="0" y1="0" x2="0" y2="8" />
            <line x1="-8" y1="8" x2="8" y2="8" />
            <line x1="-5" y1="11" x2="5" y2="11" />
            <line x1="-2" y1="14" x2="2" y2="14" />
          </g>
        </g>

        {/* ========================================================
            4. ARBOL DE CIRCUITOS
           ======================================================== */}
        {roots.map(root => renderTreeNode(root, 205))}

      </svg>
    </div>
  )
}

