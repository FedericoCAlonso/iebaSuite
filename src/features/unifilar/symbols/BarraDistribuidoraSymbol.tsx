/**
 * Símbolo IEC 60617: Barra Distribuidora
 * Representación: línea horizontal gruesa con tomas verticales para cada salida
 */

interface BarraDistribuidoraSymbolProps {
  size?: number
  selected?: boolean
  cantSalidas?: number
}

export function BarraDistribuidoraSymbol({
  size = 50,
  selected = false,
  cantSalidas = 4
}: BarraDistribuidoraSymbolProps) {
  const stroke = selected ? '#38bdf8' : '#e2e8f0'
  const fill = selected ? 'rgba(56, 189, 248, 0.1)' : '#0f172a'

  const barHeight = 8
  const barWidth = Math.max(size, 50)
  const connectHeight = size / 2 - barHeight / 2 - 4

  // Calcular posiciones de las salidas
  const tapPositions = Array.from({ length: Math.min(cantSalidas, 6) }).map(
    (_, i) => {
      const totalSpacing = barWidth - 12
      return -barWidth / 2 + 6 + (i * totalSpacing) / (Math.max(cantSalidas, 2) - 1 || 1)
    }
  )

  return (
    <g transform={`translate(0, 0)`}>
      {/* Barra principal horizontal */}
      <rect
        x={-barWidth / 2}
        y={-barHeight / 2}
        width={barWidth}
        height={barHeight}
        fill={fill}
        stroke={stroke}
        strokeWidth="2"
        rx="2"
      />

      {/* Tomas verticales para salidas */}
      {tapPositions.map((xPos, idx) => (
        <g key={`tap-${idx}`}>
          {/* Línea vertical desde barra */}
          <line
            x1={xPos}
            y1={barHeight / 2}
            x2={xPos}
            y2={barHeight / 2 + connectHeight}
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          {/* Pequeño círculo en la conexión */}
          <circle cx={xPos} cy={barHeight / 2} r="2.5" fill={stroke} />
        </g>
      ))}

      {/* Etiqueta */}
      <text
        x="0"
        y={-barHeight / 2 - 8}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={stroke}
        fontSize={size / 5.5}
        fontWeight="600"
        fontFamily="Inter, sans-serif"
      >
        Barra
      </text>

      {/* Cantidad de salidas */}
      <text
        x="0"
        y={barHeight / 2 + connectHeight + 10}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={stroke}
        fontSize={size / 6.5}
        fontWeight="500"
        fontFamily="Inter, sans-serif"
        opacity="0.8"
      >
        {cantSalidas}
      </text>
    </g>
  )
}
