import type { Timestamp as FirestoreTimestamp, DocumentData } from 'firebase/firestore'

/**
 * Campos comunes a todas las entidades
 * Note: createdAt/updatedAt can be null for mock data or before server timestamps are set
 */
export interface BaseEntity {
  createdAt: FirestoreTimestamp | null
  updatedAt: FirestoreTimestamp | null
  createdBy: string
  deleted?: boolean
}

/**
 * Helper type for Firestore document data with timestamps
 */
export interface FirestoreDocData extends DocumentData {
  createdAt: FirestoreTimestamp
  updatedAt: FirestoreTimestamp
}

/**
 * Entidad con ID de Firestore
 */
export interface WithId {
  id: string
}

/**
 * Tipo para entidad completa (con ID y campos base)
 */
export type Entity<T> = T & BaseEntity & WithId

/**
 * Tipo para crear una entidad (sin campos autogenerados)
 */
export type CreateEntity<T> = Omit<T, keyof BaseEntity | 'id'>

/**
 * Tipo para actualizar una entidad (todos los campos opcionales excepto ID)
 */
export type UpdateEntity<T> = Partial<Omit<T, 'id' | 'createdAt' | 'createdBy'>> & { id: string }

/**
 * Convierte Timestamp de Firestore a Date
 */
export function timestampToDate(timestamp: FirestoreTimestamp): Date {
  return timestamp.toDate()
}

/**
 * Tipo para queries con paginación
 */
export interface PaginatedQuery {
  limit?: number
  startAfter?: string
  orderBy?: string
  orderDirection?: 'asc' | 'desc'
}

/**
 * Resultado paginado
 */
export interface PaginatedResult<T> {
  data: T[]
  hasMore: boolean
  lastDoc?: string
  total?: number
}
