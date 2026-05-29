import { z } from 'zod'
import { DESPACHO_STATES } from '@/types/despacho'

// Schema para crear despacho
export const createDespachoSchema = z.object({
  fechaHora: z.date({
    required_error: 'La fecha y hora son requeridas',
  }),
  busId: z.string().min(1, 'El vehículo es requerido'),
  conductor: z.string().min(1, 'El conductor es requerido'),
  ruta: z.string().min(1, 'La ruta es requerida'),
  clienteId: z.string().min(1, 'El cliente es requerido'),
})

export type CreateDespachoFormData = z.infer<typeof createDespachoSchema>

// Schema para actualizar estado de despacho
export const updateDespachoEstadoSchema = z.object({
  estado: z.enum(DESPACHO_STATES),
  motivoCancelacion: z.string().optional(),
})

export type UpdateDespachoEstadoFormData = z.infer<typeof updateDespachoEstadoSchema>

// Schema para validar despacho de Firestore
export const despachoFirestoreSchema = z.object({
  fechaHora: z.unknown(), // Firestore Timestamp
  busId: z.string(),
  placa: z.string(),
  tipoVehiculo: z.string(),
  numeroInterno: z.number().optional(),
  conductor: z.string(),
  ruta: z.string(),
  clienteId: z.string(),
  clienteNombre: z.string(),
  despachadorId: z.string(),
  despachadorNombre: z.string(),
  estado: z.enum(DESPACHO_STATES).default('pendiente'),
  iniciadoAt: z.unknown().nullable().optional(),
  completadoAt: z.unknown().nullable().optional(),
  canceladoAt: z.unknown().nullable().optional(),
  motivoCancelacion: z.string().nullable().optional(),
  createdAt: z.unknown(),
  updatedAt: z.unknown(),
  createdBy: z.string().default('system'),
  deleted: z.boolean().default(false),
})

export type DespachoFirestore = z.infer<typeof despachoFirestoreSchema>
