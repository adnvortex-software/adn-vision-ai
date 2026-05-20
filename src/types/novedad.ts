import type { NoveltyCategory, CameraProfile, Plan, EventState } from '@/config/constants'
import type { BaseEntity } from './firestore'
import type { Timestamp as FirestoreTimestamp } from 'firebase/firestore'

/**
 * Punto 2D (coordenadas normalizadas 0-1)
 */
export interface Point2D {
  x: number
  y: number
}

/**
 * Línea virtual para detección de cruces
 */
export interface LineaVirtual {
  x1: number
  y1: number
  x2: number
  y2: number
  orientacion: 'horizontal' | 'vertical' | 'diagonal'
}

/**
 * Zona polígono para detección de presencia
 */
export type ZonaPoligono = Point2D[]

/**
 * Parámetros de configuración de novedad (schema flexible)
 */
export interface NovedadParams {
  lineaVirtual?: LineaVirtual
  zonaPoligono?: ZonaPoligono
  tiempoMinimoSeg?: number
  cantidadMaxima?: number
  sensibilidad?: number
}

/**
 * Catálogo de novedades (tipos disponibles)
 */
export interface NovedadCatalogo extends BaseEntity {
  codigo: string
  nombre: string
  descripcion: string
  categoria: NoveltyCategory
  perfilesCompatibles: CameraProfile[]
  planMinimo: Plan
  paramsSchema: Record<string, unknown>
  esTecnica: boolean
  generaPDF: boolean
  icono: string
  activa: boolean
}

/**
 * Configuración de novedad en una cámara específica
 */
export interface NovedadConfig extends BaseEntity {
  tipoNovedad: string
  activa: boolean
  params: NovedadParams
}

/**
 * Evento de novedad detectado
 */
export interface Evento extends BaseEntity {
  tipoNovedad: string
  busId: string
  clienteId: string
  sucursalId: string
  camaraId: string
  timestamp: FirestoreTimestamp
  screenshotUrl: string | null
  videoClipUrl: string | null
  datos: Record<string, unknown>
  estado: EventState
  revisadoPor: string | null
  revisadoAt: FirestoreTimestamp | null
  notas: string | null
  reportePdfUrl: string | null
}

/**
 * Conteo en tiempo real de un bus
 */
export interface Conteo {
  busId: string
  clienteId: string
  entradasDia: number
  salidasDia: number
  aforoActual: number
  fechaOperativa: string
  updatedAt: FirestoreTimestamp
}

/**
 * Evento individual de conteo (cruce de línea)
 */
export interface ConteoEvento {
  tipo: 'entrada' | 'salida'
  camaraId: string
  trackId: number
  aforoTrasEvento: number
  timestamp: FirestoreTimestamp
}

/**
 * Snapshot diario de conteo
 */
export interface ConteoDiario {
  busId: string
  clienteId: string
  fecha: string
  totalEntradas: number
  totalSalidas: number
  aforoMaximoDia: number
  franjasHorarias: Record<
    string,
    {
      entradas: number
      salidas: number
    }
  >
}

/**
 * Evento con datos denormalizados para listados
 */
export interface EventoConDetalles extends Evento {
  id: string
  busPlaca?: string
  clienteNombre?: string
  novedadNombre?: string
  novedadCategoria?: NoveltyCategory
  camaraNombre?: string
}

/**
 * Datos para crear configuración de novedad
 */
export interface CreateNovedadConfigData {
  tipoNovedad: string
  params: NovedadParams
}
