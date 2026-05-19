import type { BaseEntity } from './firestore'
import type { Timestamp as FirestoreTimestamp } from 'firebase/firestore'

/**
 * Conductor
 */
export interface Conductor extends BaseEntity {
  nombre: string
  cedula: string
  licencia: string
  fechaVencimientoLicencia: FirestoreTimestamp
  sucursalId: string
  propietarioId: string | null
  activo: boolean
  foto: string | null
}

/**
 * Datos para crear conductor
 */
export interface CreateConductorData {
  nombre: string
  cedula: string
  licencia: string
  fechaVencimientoLicencia: Date
  sucursalId: string
  propietarioId?: string
}

/**
 * Conductor con datos denormalizados para listados
 */
export interface ConductorConDetalles extends Conductor {
  id: string
  sucursalNombre?: string
  propietarioNombre?: string
  busAsignado?: {
    id: string
    placa: string
  } | null
  licenciaVencida: boolean
  diasParaVencimiento: number
}
