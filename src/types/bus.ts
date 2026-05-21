import type { BusState, VehicleType, CameraProfile } from '@/config/constants'
import type { BaseEntity } from './firestore'
import type { Timestamp as FirestoreTimestamp } from 'firebase/firestore'

/**
 * Bus
 */
export interface Bus extends BaseEntity {
  placa: string
  clienteId: string
  deviceId?: string
  ipVirtual?: string
  numeroInterno?: number
  sucursalId?: string | null
  propietarioId?: string | null
  tipoVehiculo: VehicleType
  rutaTexto?: string | null
  conductorAsignadoId?: string | null

  // Conectividad
  ztIpRouter: string
  subnetLan: string

  // DVR Configuration
  dvrIp?: string
  dvrUsuario?: string
  dvrPassword?: string

  // Estado operativo
  estado: BusState
  lastHeartbeat: FirestoreTimestamp | null
  numCamarasConfiguradas: number
  camarasNombres?: string[] // Array of camera names for display

  activo: boolean
}

/**
 * Cámara de un bus
 */
export interface Camara extends BaseEntity {
  nombre: string
  perfil: CameraProfile
  canal: number
  rtspUrl: string
  rtspSubstreamUrl: string | null
  resolucionInferenciaW: number
  resolucionInferenciaH: number
  fpsInferencia: number
  habilitada: boolean
  ultimoScreenshot: string | null
  ultimoScreenshotAt: FirestoreTimestamp | null
}

/**
 * Datos para crear bus
 */
export interface CreateBusData {
  placa: string
  clienteId: string
  deviceId: string
  ipVirtual: string
  numeroInterno?: number
  tipoVehiculo: VehicleType
  conductorAsignadoId?: string
  ztIpRouter: string
  subnetLan: string
  dvrIp?: string
  dvrUsuario?: string
  dvrPassword?: string
}

/**
 * Datos para crear cámara
 */
export interface CreateCamaraData {
  nombre: string
  perfil: CameraProfile
  canal: number
  rtspUrl: string
  rtspSubstreamUrl?: string
  resolucionInferenciaW?: number
  resolucionInferenciaH?: number
  fpsInferencia?: number
}

/**
 * Bus con datos denormalizados para listados
 */
export interface BusConDetalles extends Bus {
  id: string
  clienteNombre?: string
  sucursalNombre?: string
  propietarioNombre?: string
  conductorNombre?: string
  novedadesHoy?: number
  conteoDia?: {
    entradas: number
    salidas: number
    aforo: number
  }
}

/**
 * Datos del wizard de creación de bus
 */
export interface BusWizardData {
  // Step 1: Datos generales
  placa: string
  clienteId: string
  deviceId: string
  ipVirtual: string
  numeroInterno?: number
  tipoVehiculo: VehicleType
  conductorAsignadoId?: string | null

  // Step 2: Conectividad
  ztIpRouter: string
  subnetLan: string
  dvrIp: string
  dvrUsuario: string
  dvrPassword: string

  // Step 3: Cámaras
  camaras: CreateCamaraData[]
}
