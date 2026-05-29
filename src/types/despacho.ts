import type { Timestamp as FirestoreTimestamp } from 'firebase/firestore'
import type { BaseEntity } from './firestore'

/**
 * Estados de un despacho
 */
export const DESPACHO_STATES = ['pendiente', 'en_curso', 'completado', 'cancelado'] as const
export type DespachoState = (typeof DESPACHO_STATES)[number]

export const DESPACHO_STATE_LABELS: Record<DespachoState, string> = {
  pendiente: 'Pendiente',
  en_curso: 'En curso',
  completado: 'Completado',
  cancelado: 'Cancelado',
}

export const DESPACHO_STATE_COLORS: Record<DespachoState, string> = {
  pendiente: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  en_curso: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  completado: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  cancelado: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
}

/**
 * Despacho - Registro de salida de un vehículo en una ruta
 */
export interface Despacho extends BaseEntity {
  // Fecha y hora del despacho
  fechaHora: FirestoreTimestamp

  // Vehículo
  busId: string
  placa: string
  tipoVehiculo: string
  numeroInterno?: number

  // Conductor (input libre por ahora)
  conductor: string

  // Ruta (input libre por ahora)
  ruta: string

  // Cliente
  clienteId: string
  clienteNombre: string

  // Despachador (quien creó el despacho)
  despachadorId: string
  despachadorNombre: string

  // Estado
  estado: DespachoState

  // Timestamps de cambios de estado
  iniciadoAt?: FirestoreTimestamp | null
  completadoAt?: FirestoreTimestamp | null
  canceladoAt?: FirestoreTimestamp | null
  motivoCancelacion?: string | null
}

/**
 * Datos para crear un despacho
 */
export interface CreateDespachoData {
  fechaHora: Date
  busId: string
  placa: string
  tipoVehiculo: string
  numeroInterno?: number
  conductor: string
  ruta: string
  clienteId: string
  clienteNombre: string
}

/**
 * Despacho con datos adicionales para listados
 */
export interface DespachoConDetalles extends Despacho {
  id: string
}
