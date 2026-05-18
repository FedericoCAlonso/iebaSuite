export type ModuleType = 
  | 'srt_boca'
  | 'puesta_tierra'
  | 'diferencial'
  | 'continuidad_masas'
  | 'resistencia_lazo'
  | 'corriente_cortocircuito'
  | 'resistencia_aislacion'
  | 'termografia'
  | 'calidad_potencia'

export type ResultadoMedicion = 'aprobado' | 'observado' | 'rechazado' | 'no_aplica'

export type MetodoPuestaTierra = 'falla_de_potencial' | 'telecom' | 'pinza' | '62%'
export type TipoDiferencial = 'ac' | 'a' | 'f' | 'b'

export interface MeasurementBase {
  id: string
  moduleType: ModuleType
  projectId: string
  ambienteId?: string
  elementoId?: string
  circuitoId?: string
  ubicacion: string          // Descripción libre del punto de medición
  observaciones?: string
  resultado: ResultadoMedicion
  operador: string
  instrumentoId?: string      // ID del instrumento usado (del perfil)
  timestamp: number
  photoStoragePaths?: string[]
}

/** Puesta a tierra */
export interface MeasurementTierra extends MeasurementBase {
  moduleType: 'puesta_tierra'
  metodo: MetodoPuestaTierra
  resistenciaOhm: number
  resistenciaSueloOhm?: number
  humedadSuelo?: number
  distanciaJabalina?: number
}

/** Interruptor diferencial */
export interface MeasurementDiferencial extends MeasurementBase {
  moduleType: 'diferencial'
  tipo: TipoDiferencial
  sensibilidadNominalmA: number
  tiempoDisparoms: number
  corrienteDisparomA: number
  tensionPruebaV: number
  funcionaManual: boolean
}

/** Continuidad de masas (bajas impedancias) */
export interface MeasurementContinuidad extends MeasurementBase {
  moduleType: 'continuidad_masas'
  resistenciaOhm: number
  referenciaOhm?: number      // Valor de referencia esperado
  corrientePruebaA: number
}

/** Resistencia de lazo de tierra (Zloop) */
export interface MeasurementLazo extends MeasurementBase {
  moduleType: 'resistencia_lazo'
  impedanciaOhm: number
  corrienteProspectivaA: number
  tensionRedV: number
}

/** Corriente de cortocircuito (Icc prospectiva) */
export interface MeasurementCortocircuito extends MeasurementBase {
  moduleType: 'corriente_cortocircuito'
  corrienteIccA: number
  impedanciaZ1Ohm?: number
  impedanciaZrefOhm?: number
  metodo: 'impedancia' | 'directa'
}

/** Resistencia de aislación */
export interface MeasurementAislacion extends MeasurementBase {
  moduleType: 'resistencia_aislacion'
  tensionPruebaV: number      // 500V, 1000V, etc.
  resistenciaMOhm: number
  temperaturaAmbiente?: number
  humedadRelativa?: number
}

/** Termografía */
export interface MeasurementTermografia extends MeasurementBase {
  moduleType: 'termografia'
  temperaturaC: number
  diferenciaC?: number        // ΔT respecto a ambiente
  emisividad?: number
  imagenTermicaPath?: string
}

/** Calidad de potencia (THD, FP, etc.) */
export interface MeasurementCalidadPotencia extends MeasurementBase {
  moduleType: 'calidad_potencia'
  thdVPercent?: number
  thdIPercent?: number
  factorPotencia?: number
  tensionVN?: number
  corrienteAN?: number
}

/** SRT boca a boca */
export interface MeasurementSrtBoca extends MeasurementBase {
  moduleType: 'srt_boca'
  resultadoSrt?: string
}

export type Measurement =
  | MeasurementTierra
  | MeasurementDiferencial
  | MeasurementContinuidad
  | MeasurementLazo
  | MeasurementCortocircuito
  | MeasurementAislacion
  | MeasurementTermografia
  | MeasurementCalidadPotencia
  | MeasurementSrtBoca
