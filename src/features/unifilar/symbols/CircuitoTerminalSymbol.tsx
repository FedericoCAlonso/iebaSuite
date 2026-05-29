/**
 * Símbolo IEC 60617: Circuito Terminal
 * Representación: línea terminada en flecha con texto del circuito
 */

interface CircuitoTerminalSymbolProps {
  size?: number
  selected?: boolean
  label?: string
  tipo?: string
}

export function CircuitoTerminalSymbol({
  size = 40,
  selected = false,
  label,
  tipo
}: CircuitoTerminalSymbolProps) {
  const stroke = selected ? '#38bdf8' : '#e2e8f0'
  const fill = selected ? 'rgba(56, 189, 248, 0.15)' : 'none'

  return (
    <g transform={`translate(0, 0)`}>
      {/* Marco contenedor */}
      <rect
        x={-size / 2}
        y={-size / 2}
        width={size}
        height={size}
        fill={fill}
        stroke={stroke}
        strokeWidth="1.5"
        rx="3"
      />

      {/* Línea diagonal hacia salida */}
      <line
        x1={-size / 4}
        y1={-size / 4}
        x2={size / 4}
        y2={size / 4}
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Punta de flecha en la salida */}
      <polygon
        points={`${size / 4},${size / 4} ${size / 4 - 3},${size / 4 - 5} ${size / 4 - 5},${size / 4 - 3}`}
        fill={stroke}
      />

      {/* Punto de conexión inicial */}
      <circle cx={-size / 4} cy={-size / 4} r="1.5" fill={stroke} />

      {/* Tipo de circuito (si aplica) */}
      {tipo && (
        <text
          x="0"
          y={-size / 4}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={stroke}
          fontSize={size / 5}
          fontWeight="700"
          fontFamily="Inter, monospace"
        >
          {tipo}
        </text>
      )}

      {/* Etiqueta del circuito */}
      {label && (
        <text
          x="0"
          y={size / 4 + 4}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={stroke}
          fontSize={size / 5.5}
          fontWeight="500"
          fontFamily="Inter, sans-serif"
        >
          {label.length > 10 ? label.slice(0, 9) + '…' : label}
        </text>
      )}
    </g>
  )
}
