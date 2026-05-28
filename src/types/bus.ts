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

  // Counting Configuration
  countingEnabled?: boolean
  countingCameraChannel?: number // 1, 2, 3, etc.
  countingLinePosition?: number // Position in pixels
  countingLineOrientation?: 'horizontal' | 'vertical'
  countingSnapshotUrl?: string // URL of the last captured frame for configuration
  aforoMax?: number

  // Novelty Detection Configuration
  noveltyConfigs?: NoveltyConfig[]

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

/**
 * Configuración de novedad para detección
 */
export interface NoveltyConfig {
  id: string
  tipoNovedad: 'pasajero_cabina' | 'sobrecupo_pasillo'
  cameraChannel: number
  cameraId: string
  maxPersonas: number // Solo aplica para pasajero_cabina
  tiempoMinimoMin: number // Tiempo en minutos
  zonaPoligono?: Array<{ x: number; y: number }> // Normalized 0-1 coordinates
  activa: boolean
}

/**
 * Tipos de novedades disponibles
 */
export const NOVELTY_TYPES = {
  pasajero_cabina: {
    nombre: 'Pasajero en cabina',
    descripcion: 'Detecta personas no autorizadas en la cabina del conductor',
    defaultMaxPersonas: 1,
    defaultTiempoMin: 1, // 1 minuto
    showMaxPersonas: true,
  },
  sobrecupo_pasillo: {
    nombre: 'Sobrecupo en pasillo',
    descripcion: 'Detecta pasajeros de pie en el pasillo',
    defaultMaxPersonas: 0, // Siempre 0, cualquier persona es sobrecupo
    defaultTiempoMin: 2, // 2 minutos
    showMaxPersonas: false,
  },
} as const

export type NoveltyType = keyof typeof NOVELTY_TYPES
