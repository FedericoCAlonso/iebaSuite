/**
 * Símbolo IEC 60617: Alimentador / línea de entrada
 * Representación: flecha hacia abajo con texto "Alim."
 */

interface AlimentadorProps {
  size?: number
  selected?: boolean
}

export function AlimentadorSymbol({ size = 40, selected = false }: AlimentadorProps) {
  const stroke = selected ? '#38bdf8' : '#e2e8f0'
  const fill = selected ? 'rgba(56, 189, 248, 0.2)' : 'none'

  return (
    <g transform={`translate(0, 0)`}>
      {/* Caja contenedora */}
      <rect
        x={-size / 2}
        y={-size / 2}
        width={size}
        height={size}
        fill={fill}
        stroke={stroke}
        strokeWidth="1.5"
        rx="4"
      />

      {/* Línea vertical principal */}
      <line
        x1="0"
        y1={-size / 2 + 8}
        x2="0"
        y2={size / 2 - 12}
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Punta de flecha */}
      <polygon
        points={`0,${size / 2 - 8} -4,${size / 2 - 14} 4,${size / 2 - 14}`}
        fill={stroke}
      />

      {/* Texto */}
      <text
        x="0"
        y={size / 2 - 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={stroke}
        fontSize={size / 5}
        fontWeight="600"
        fontFamily="Inter, sans-serif"
      >
        Alim.
      </text>
    </g>
  )
}
