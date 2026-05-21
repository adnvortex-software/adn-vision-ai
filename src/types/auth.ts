import type { Role } from '@/config/constants'
import type { BaseEntity } from './firestore'

/**
 * Usuario del sistema
 */
export interface Usuario extends BaseEntity {
  uid: string
  email: string
  nombre: string
  rol: Role
  clienteId: string | null
  sucursalIds: string[] | null
  propietarioId: string | null
  activo: boolean
  onboardingCompleted?: boolean
}

/**
 * Estado de autenticación
 */
export interface AuthState {
  user: Usuario | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

/**
 * Claims personalizados de Firebase Auth
 */
export interface CustomClaims {
  rol: Role
  clienteId?: string
  sucursalIds?: string[]
  propietarioId?: string
}

/**
 * Datos para login
 */
export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

/**
 * Datos para crear usuario
 */
export interface CreateUsuarioData {
  email: string
  nombre: string
  rol: Role
  clienteId?: string
  sucursalIds?: string[]
  propietarioId?: string
}

/**
 * Datos para actualizar usuario
 */
export interface UpdateUsuarioData {
  nombre?: string
  rol?: Role
  sucursalIds?: string[]
  propietarioId?: string
  activo?: boolean
}
