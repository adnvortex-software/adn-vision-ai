// Zona horaria fija para Colombia
export const TIMEZONE = 'America/Bogota'

// Formatos de fecha estándar
export const DATE_FORMATS = {
  display: 'dd/MM/yyyy',
  displayWithTime: 'dd/MM/yyyy HH:mm',
  displayFull: "EEEE, d 'de' MMMM 'de' yyyy",
  iso: 'yyyy-MM-dd',
  isoWithTime: "yyyy-MM-dd'T'HH:mm:ss",
  time: 'HH:mm',
  timeWithSeconds: 'HH:mm:ss',
} as const

// Regex para validación de placa colombiana
// Formatos: ABC123, ABC12D (motos y algunos vehículos nuevos)
export const PLACA_REGEX = /^[A-Z]{3}\d{2}[A-Z0-9]$/

// Perfiles de cámara disponibles
export const CAMERA_PROFILES = [
  'cabina',
  'puerta',
  'pasillo',
  'frontal',
  'exterior',
  'otro',
] as const

export type CameraProfile = (typeof CAMERA_PROFILES)[number]

// Estados de bus
export const BUS_STATES = ['activo', 'inactivo', 'mantenimiento', 'sin_conexion'] as const

export type BusState = (typeof BUS_STATES)[number]

// Tipos de vehículo
export const VEHICLE_TYPES = ['bus', 'buseta', 'van', 'microbus', 'otro'] as const

export type VehicleType = (typeof VEHICLE_TYPES)[number]

// Planes disponibles
export const PLANS = ['basico', 'profesional', 'premium'] as const

export type Plan = (typeof PLANS)[number]

// Roles del sistema
export const INTERNAL_ROLES = ['super_admin', 'ops_admin', 'analyst', 'support'] as const

export const CLIENT_ROLES = ['client_admin', 'client_viewer'] as const

export const ALL_ROLES = [...INTERNAL_ROLES, ...CLIENT_ROLES] as const

export type Role = (typeof ALL_ROLES)[number]

// Categorías de novedades
export const NOVELTY_CATEGORIES = [
  'operativa',
  'seguridad_conductor',
  'seguridad_pasajero',
  'tecnica',
  'comercial',
] as const

export type NoveltyCategory = (typeof NOVELTY_CATEGORIES)[number]

// Estados de evento
export const EVENT_STATES = ['nuevo', 'revisado', 'resuelto', 'descartado'] as const

export type EventState = (typeof EVENT_STATES)[number]

// Configuración de inferencia por defecto
export const DEFAULT_INFERENCE_CONFIG = {
  width: 480,
  height: 360,
  fps: 3,
} as const

// Límites del sistema
export const LIMITS = {
  maxCamerasPerBus: 6,
  minCamerasPerBus: 1,
  maxPolygonVertices: 20,
  minPolygonVertices: 3,
  maxNoveltyTimeoutSeconds: 300,
  defaultNoveltyTimeoutSeconds: 10,
} as const

// Keys de localStorage
export const STORAGE_KEYS = {
  theme: 'adn-lynx-theme',
  language: 'adn-lynx-language',
  sidebarCollapsed: 'adn-lynx-sidebar-collapsed',
} as const
