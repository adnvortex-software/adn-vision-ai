import { z } from 'zod'
import {
  NOVELTY_CATEGORIES,
  CAMERA_PROFILES,
  PLANS,
  EVENT_STATES,
  LIMITS,
} from '@/config/constants'

// Schema para punto 2D (coordenadas normalizadas 0-1)
export const point2DSchema = z.object({
  x: z.number().min(0, 'X debe ser >= 0').max(1, 'X debe ser <= 1'),
  y: z.number().min(0, 'Y debe ser >= 0').max(1, 'Y debe ser <= 1'),
})

export type Point2D = z.infer<typeof point2DSchema>

// Schema para línea virtual
export const lineaVirtualSchema = z.object({
  x1: z.number().min(0).max(1),
  y1: z.number().min(0).max(1),
  x2: z.number().min(0).max(1),
  y2: z.number().min(0).max(1),
  orientacion: z.enum(['horizontal', 'vertical', 'diagonal']),
})

export type LineaVirtual = z.infer<typeof lineaVirtualSchema>

// Schema para zona polígono
export const zonaPoligonoSchema = z
  .array(point2DSchema)
  .min(LIMITS.minPolygonVertices, `Mínimo ${String(LIMITS.minPolygonVertices)} vértices`)
  .max(LIMITS.maxPolygonVertices, `Máximo ${String(LIMITS.maxPolygonVertices)} vértices`)

export type ZonaPoligono = z.infer<typeof zonaPoligonoSchema>

// Schema para parámetros de novedad
export const novedadParamsSchema = z.object({
  lineaVirtual: lineaVirtualSchema.optional(),
  zonaPoligono: zonaPoligonoSchema.optional(),
  tiempoMinimoSeg: z
    .number()
    .int()
    .min(1, 'Mínimo 1 segundo')
    .max(
      LIMITS.maxNoveltyTimeoutSeconds,
      `Máximo ${String(LIMITS.maxNoveltyTimeoutSeconds)} segundos`
    )
    .optional(),
  cantidadMaxima: z.number().int().min(0, 'No puede ser negativo').optional(),
  sensibilidad: z.number().min(0, 'Mínimo 0').max(100, 'Máximo 100').optional(),
})

export type NovedadParams = z.infer<typeof novedadParamsSchema>

// Schema para crear configuración de novedad
export const createNovedadConfigSchema = z.object({
  tipoNovedad: z.string().min(1, 'Tipo de novedad es requerido'),
  params: novedadParamsSchema,
})

export type CreateNovedadConfigFormData = z.infer<typeof createNovedadConfigSchema>

// Schema para actualizar configuración de novedad
export const updateNovedadConfigSchema = createNovedadConfigSchema.partial().extend({
  activa: z.boolean().optional(),
})

export type UpdateNovedadConfigFormData = z.infer<typeof updateNovedadConfigSchema>

// Schema para catálogo de novedades
export const novedadCatalogoSchema = z.object({
  codigo: z.string().min(1, 'Código es requerido'),
  nombre: z.string().min(2, 'Mínimo 2 caracteres'),
  descripcion: z.string().min(10, 'Mínimo 10 caracteres'),
  categoria: z.enum(NOVELTY_CATEGORIES),
  perfilesCompatibles: z.array(z.enum(CAMERA_PROFILES)).min(1, 'Mínimo un perfil'),
  planMinimo: z.enum(PLANS),
  paramsSchema: z.record(z.unknown()),
  esTecnica: z.boolean(),
  generaPDF: z.boolean(),
  icono: z.string().min(1, 'Icono es requerido'),
  activa: z.boolean().default(true),
})

export type NovedadCatalogoFormData = z.infer<typeof novedadCatalogoSchema>

// Schema para cambiar estado de evento
export const updateEventoEstadoSchema = z.object({
  estado: z.enum(EVENT_STATES),
  notas: z.string().max(500, 'Máximo 500 caracteres').nullable().optional(),
})

export type UpdateEventoEstadoFormData = z.infer<typeof updateEventoEstadoSchema>

// Schema para validar evento de Firestore
export const eventoFirestoreSchema = z.object({
  tipoNovedad: z.string(),
  busId: z.string(),
  clienteId: z.string(),
  sucursalId: z.string(),
  camaraId: z.string(),
  timestamp: z.unknown(),
  screenshotUrl: z.string().nullable(),
  videoClipUrl: z.string().nullable(),
  datos: z.record(z.unknown()),
  estado: z.enum(EVENT_STATES),
  revisadoPor: z.string().nullable(),
  revisadoAt: z.unknown().nullable(),
  notas: z.string().nullable(),
  reportePdfUrl: z.string().nullable(),
  createdAt: z.unknown(),
  updatedAt: z.unknown(),
  createdBy: z.string(),
  deleted: z.boolean().optional(),
})

export type EventoFirestore = z.infer<typeof eventoFirestoreSchema>
