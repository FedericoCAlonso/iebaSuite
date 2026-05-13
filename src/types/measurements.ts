export type ModuleType = 'srt_boca' | 'puesta_tierra' | 'diferencial'
export type ResultadoMedicion = 'aprobado' | 'observado' | 'rechazado'

export interface Measurement {
  id: string
  moduleType: ModuleType
  elementoId: string
  circuitoId?: string
  ambienteId: string
  valor: number
  unidad: string
  resultado: ResultadoMedicion
  datos: { clave: string; valor: string }[]
  photoStoragePaths?: string[]
  operador: string
  timestamp: number
}
