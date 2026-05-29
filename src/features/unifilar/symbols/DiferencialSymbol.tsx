/**
 * Símbolo IEC 60617: Disyuntor Diferencial (DR)
 * Representación: cuadrado con símbolo de corriente de fuga (Δ o I△)
 */

interface DiferencialSymbolProps {
  size?: number
  selected?: boolean
  sensibilidadMA?: number
  polos?: number
}

export function DiferencialSymbol({
  size = 40,
  selected = false,
  sensibilidadMA,
  polos = 2
}: DiferencialSymbolProps) {
  const stroke = selected ? '#38bdf8' : '#e2e8f0'
  const fill = selected ? 'rgba(56, 189, 248, 0.15)' : 'none'

  return (
    <g transform={`translate(0, 0)`}>
      {/* Marco principal */}
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

      {/* Símbolo de corriente de fuga - triángulo con I */}
      <g transform={`translate(0, 0)`}>
        {/* Triángulo */}
        <polygon
          points={`0,-8 -6,4 6,4`}
          fill="none"
          stroke={stroke}
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* I dentro del triángulo */}
        <text
          x="0"
          y="0"
          textAnchor="middle"
          dominantBaseline="middle"
          fill={stroke}
          fontSize={size / 6}
          fontWeight="700"
          fontFamily="Inter, sans-serif"
        >
          I
        </text>
      </g>

      {/* Indicador de sensibilidad */}
      {sensibilidadMA && (
        <text
          x="0"
          y={size / 4}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={stroke}
          fontSize={size / 5.5}
          fontWeight="600"
          fontFamily="Inter, sans-serif"
        >
          {sensibilidadMA}mA
        </text>
      )}

      {/* Indicador de polos */}
      {polos && polos > 1 && (
        <text
          x="0"
          y={-size / 4}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={stroke}
          fontSize={size / 6}
          fontWeight="600"
          fontFamily="Inter, sans-serif"
        >
          {polos}P
        </text>
      )}
    </g>
  )
}
