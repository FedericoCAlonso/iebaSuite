/**
 * Símbolo IEC 60617: Disyuntor Termomagnético (TM)
 * Representación: cuadrado con T y símbolo bimetálico
 */

interface TermomagneticoSymbolProps {
  size?: number
  selected?: boolean
  polos?: number
}

export function TermomagneticoSymbol({
  size = 40,
  selected = false,
  polos = 1
}: TermomagneticoSymbolProps) {
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

      {/* Contacto abierto diagonal */}
      <line
        x1={-size / 4}
        y1={-size / 6}
        x2={-size / 6}
        y2={size / 6}
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Símbolo bimetálico (curva) */}
      <path
        d={`M ${-size / 6} ${size / 6} Q ${size / 6} 0 ${size / 6} ${-size / 6}`}
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Texto "TM" */}
      <text
        x="0"
        y={size / 4}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={stroke}
        fontSize={size / 4.5}
        fontWeight="700"
        fontFamily="Inter, sans-serif"
      >
        TM
      </text>

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
