// =============================================================================
// ENUMS GLOBALES
// =============================================================================

export type NivelTension = 'BT' | 'MT' | 'AT';

export type TipoConexion =
  | 'monofasica_2h'
  | 'monofasica_3h'
  | 'bifasica'
  | 'trifasica_3h'
  | 'trifasica_4h'
  | 'trifasica_5h';

export type EsquemaTierra = 'tt' | 'tn-s' | 'tn-c' | 'tn-c-s' | 'it';

export type TipoTarifa = 'T1R' | 'T1G' | 'T2' | 'T3' | 'AP' | 'otro';

export type MaterialConductor = 'Cu' | 'Al';

export type TipoAislacion = 'PVC' | 'XLPE' | 'EPR' | 'desnudo';

export type TipoMontaje =
  | 'embutido'
  | 'aplicado'
  | 'suspendido'
  | 'subterraneo'
  | 'subterraneo_directo'
  | 'aereo'
  | 'encastrado';

export type TipoProteccion =
  | 'termomagnetica'
  | 'diferencial'
  | 'magnetico'
  | 'fusible'
  | 'DPS';

export type TipoInfraestructura =
  | 'caño_rigido'
  | 'caño_flexible'
  | 'bandeja_perforada'
  | 'bandeja_ciega'
  | 'cable_canal'
  | 'zocalo_canal'
  | 'caja_pase'
  | 'caja_derivacion'
  | 'gabinete'
  | 'tablero_embutido';

export type TipoModulo =
  | 'tomacorriente_2p'
  | 'tomacorriente_2pt'
  | 'tomacorriente_trifasico'
  | 'llave_simple'
  | 'llave_doble'
  | 'llave_conmutada'
  | 'llave_cruzada'
  | 'luminaria'
  | 'señalizacion'
  | 'timbre_zumbador'
  | 'persiana_motor';

export type TipoMedicion =
  | 'medidor_kWh'
  | 'medidor_bidirecional'
  | 'TC'
  | 'TP'
  | 'voltimetro'
  | 'amperimetro'
  | 'analizador_de_redes'
  | 'ojo_de_buey';

export type TipoGeneracion =
  | 'grupo_electrogeno'
  | 'panel_fotovoltaico'
  | 'inversor_fv'
  | 'inversor_bateria'
  | 'bateria'
  | 'ups';

export type TipoPAT = 'jabalina' | 'malla_equipotencial' | 'placa_enterrada' | 'conductor_pat';

export type TipoConexionPuntual = 'terminal' | 'bornera' | 'conector_ficha' | 'empalme';

// =============================================================================
// CAPA 1: CATÁLOGO — ElementoElectrico y subclases
// =============================================================================

export interface ElementoElectricoBase {
  codigo_ref: string; // UUID
  nombre: string;
  marca?: string;
  modelo?: string;
  precio_unitario: number;
  unidad_medida: string; // "unidad", "metro", etc.
  nivel_tension: NivelTension;
  notas?: string;
  tipo_elemento: string;
}

export interface Infraestructura extends ElementoElectricoBase {
  tipo_elemento: 'infraestructura';
  tipo: TipoInfraestructura;
  montaje?: TipoMontaje;
  longitud_m?: number;
  diametro_o_ancho_mm?: number;
  alto_mm?: number;
  grado_proteccion_ip?: string;
}

export interface Conductor extends ElementoElectricoBase {
  tipo_elemento: 'conductor';
  material: MaterialConductor;
  seccion_mm2: number;
  cantidad_conductores: number;
  aislacion: TipoAislacion;
  tension_nominal_v: number;
  corriente_admisible_a?: number;
}

export interface Proteccion extends ElementoElectricoBase {
  tipo_elemento: 'proteccion';
  tipo: TipoProteccion;
  corriente_nominal_a: number;
  polos: number;
  tension_nominal_v: number;
  poder_de_corte_ka?: number;
  sensibilidad_diferencial_ma?: number;
  nivel_proteccion_up_kv?: number;
}

export interface Maniobra extends ElementoElectricoBase {
  tipo_elemento: 'maniobra';
  corriente_nominal_a: number;
  polos: number;
  tension_bobina_v?: number;
  categoria_utilizacion?: string;
}

export interface Modulo extends ElementoElectricoBase {
  tipo_elemento: 'modulo';
  tipo: TipoModulo;
  corriente_nominal_a?: number;
  tension_nominal_v: number;
  con_puesta_a_tierra: boolean;
  potencia_w?: number;
  flujo_luminoso_lm?: number;
  temperatura_color_k?: number;
}

export interface Medicion extends ElementoElectricoBase {
  tipo_elemento: 'medicion';
  tipo: TipoMedicion;
  magnitud_medida?: string;
  señal_salida?: string;
  clase_precision?: string;
}

export interface Generacion extends ElementoElectricoBase {
  tipo_elemento: 'generacion';
  tipo: TipoGeneracion;
  potencia_nominal_kva: number;
  tension_salida_v: number;
  tension_entrada_v?: number;
  rendimiento_pct?: number;
  autonomia_horas?: number;
}

export interface PuestaATierra extends ElementoElectricoBase {
  tipo_elemento: 'puesta_a_tierra';
  tipo: TipoPAT;
  resistencia_maxima_ohm?: number;
  resistencia_medida_ohm?: number;
  seccion_mm2?: number;
}

export interface ConexionPuntual extends ElementoElectricoBase {
  tipo_elemento: 'conexion_puntual';
  tipo: TipoConexionPuntual;
  corriente_nominal_a?: number;
  seccion_max_mm2?: number;
}

export type ElementoCatalogo =
  | Infraestructura
  | Conductor
  | Proteccion
  | Maniobra
  | Modulo
  | Medicion
  | Generacion
  | PuestaATierra
  | ConexionPuntual;

// =============================================================================
// CAPA 1.5: SUMINISTRO — Límite del sistema (frontera con la distribuidora)
// =============================================================================

export interface PuntoSuministro {
  codigo_ref: string; // UUID
  nivel_tension: NivelTension;
  tension_nominal_v: number;
  tipo_conexion: TipoConexion;
  tarifa: TipoTarifa;
  potencia_contratada_kw?: number;
  demanda_maxima_kw?: number;
  empresa_distribuidora?: string;
  numero_nis?: string;
  numero_contrato?: string;
  descripcion?: string;
}

export interface ContextoSuministro {
  puntos: PuntoSuministro[];
}

// =============================================================================
// CAPA 2: GRAFO — Nodos y tramos de la instalación
// =============================================================================

export interface NodoInstalacion {
  codigo_ref: string; // UUID
  etiqueta: string;
  descripcion?: string;
  nivel_tension: NivelTension;
  tension_nominal_v: number;
  elemento_ref?: string; // UUID de ElementoElectrico en catálogo
  ubicacion?: string;
}

export interface TramoInstalacion {
  codigo_ref: string; // UUID
  etiqueta: string;
  nodo_origen: string; // UUID
  nodo_destino: string; // UUID
  conductor_ref: string; // UUID
  longitud_m: number;
  montaje: TipoMontaje;
  infraestructura_ref?: string; // UUID
  circuito_ref?: string; // UUID
  bidireccional: boolean;
}

export interface CircuitoDominio {
  codigo_ref: string; // UUID
  etiqueta: string;
  descripcion?: string;
  proteccion_ref?: string; // UUID de Proteccion en catálogo
  nivel_tension: NivelTension;
  uso?: string;
}

// =============================================================================
// CAPA 3: INSTALACIÓN — Raíz del modelo
// =============================================================================

export interface Instalacion {
  codigo_ref: string; // UUID
  nombre: string;
  descripcion?: string;
  contexto_suministro: ContextoSuministro;
  catalogo: Record<string, ElementoCatalogo>; // UUID (string) → ElementoCatalogo
  nodos: Record<string, NodoInstalacion>; // UUID (string) → NodoInstalacion
  tramos: Record<string, TramoInstalacion>; // UUID (string) → TramoInstalacion
  circuitos: Record<string, CircuitoDominio>; // UUID (string) → CircuitoDominio
}
