export type ModuleType = 
  | 'puesta_tierra'
  | 'diferencial'
  | 'continuidad_masas'
  | 'resistencia_lazo'
  | 'corriente_cortocircuito'
  | 'resistencia_aislacion'
  | 'calidad_potencia'

export type ResultadoMedicion = 'aprobado' | 'observado' | 'rechazado' | 'no_aplica'

export type MetodoPuestaTierra = 'caida_de_tension' | 'dos_puntas'
export type CategoriaPuestaTierra = 'principal' | 'funcional_independiente'
export type TipoDiferencial = 'ac' | 'a' | 'f' | 'b'

export interface MeasurementBase {
  id: string
  moduleType: ModuleType
  projectId: string
  ambienteId?: string
  elementoId?: string        // ElementoElectrico.id (bocas, puntos de p.tierra, etc.)
  circuitoId?: string        // Circuito.id
  diferencialId?: string     // Diferencial.id
  tableroId?: string         // Tablero.id (para calidad de potencia en tableros)
  lineaId?: string           // Conexion.id o tramo seccional
  ubicacion: string          // Descripción libre del punto de medición
  observaciones?: string
  resultado: ResultadoMedicion
  operador: string
  instrumentoId?: string      // ID del instrumento usado (del perfil)
  errorMedicion?: string      // Ej: '± 2% + 3d' o '0.05Ω'
  fecha?: number              // timestamp de la medición (distinto al timestamp de carga)
  timestamp: number
  photoStoragePaths?: string[]
}

/** Puesta a tierra */
export interface MeasurementTierra extends MeasurementBase {
  moduleType: 'puesta_tierra'
  metodo: MetodoPuestaTierra
  categoria: CategoriaPuestaTierra
  interconexionHacia?: string  // Ej: 'Estrella a barra principal' o 'Ninguna'
  resistenciaOhm: number
  resistenciaSueloOhm?: number
  humedadSuelo?: number
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



/** Calidad de potencia (THD, FP, etc.) */
export interface MeasurementCalidadPotencia extends MeasurementBase {
  moduleType: 'calidad_potencia'
  potenciaActivaW?: number
  potenciaReactivaVAr?: number
  potenciaAparenteVA?: number
  thdVPercent?: number
  thdIPercent?: number
  factorPotencia?: number
  tensionVN?: number
  corrienteAN?: number
}


export type Measurement =
  | MeasurementTierra
  | MeasurementDiferencial
  | MeasurementContinuidad
  | MeasurementLazo
  | MeasurementCortocircuito
  | MeasurementAislacion
  | MeasurementCalidadPotencia
