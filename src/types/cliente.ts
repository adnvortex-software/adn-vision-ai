import type { Plan } from '@/config/constants'
import type { BaseEntity } from './firestore'

/**
 * Cliente (empresa de transporte)
 */
export interface Cliente extends BaseEntity {
  nombre: string
  nit: string
  contactoEmail: string
  contactoTelefono: string
  planContratado: Plan
  activo: boolean
  logoUrl?: string | null
}

/**
 * Sucursal de un cliente
 */
export interface Sucursal extends BaseEntity {
  clienteId: string
  nombre: string
  direccion: string
  ciudad: string
  activa: boolean
}

/**
 * Propietario de buses (afiliador)
 */
export interface Propietario extends BaseEntity {
  nombre: string
  documento: string
  sucursalId: string
  contactoEmail: string | null
  contactoTelefono: string | null
  activo: boolean
}

/**
 * Datos para crear cliente
 */
export interface CreateClienteData {
  nombre: string
  nit: string
  contactoEmail: string
  contactoTelefono: string
  planContratado: Plan
}

/**
 * Datos para crear sucursal
 */
export interface CreateSucursalData {
  nombre: string
  direccion: string
  ciudad: string
}

/**
 * Datos para crear propietario
 */
export interface CreatePropietarioData {
  nombre: string
  documento: string
  sucursalId: string
  contactoEmail?: string
  contactoTelefono?: string
}

/**
 * Cliente con datos denormalizados para listados
 */
export interface ClienteConEstadisticas extends Cliente {
  id: string
  totalSucursales: number
  totalBuses: number
  busesActivos: number
}
