import { z } from 'zod'

// Schema para crear conductor
export const createConductorSchema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres').max(100, 'Máximo 100 caracteres'),
  cedula: z
    .string()
    .min(5, 'Cédula inválida')
    .max(15, 'Cédula inválida')
    .regex(/^[\d.-]+$/, 'Cédula solo puede contener números, puntos y guiones'),
  licencia: z.string().min(5, 'Licencia inválida').max(20, 'Licencia inválida'),
  fechaVencimientoLicencia: z.date({
    required_error: 'Fecha de vencimiento es requerida',
    invalid_type_error: 'Fecha inválida',
  }),
  sucursalId: z.string().min(1, 'Sucursal es requerida'),
  propietarioId: z.string().nullable().optional(),
})

export type CreateConductorFormData = z.infer<typeof createConductorSchema>

// Schema para actualizar conductor
export const updateConductorSchema = createConductorSchema.partial().extend({
  activo: z.boolean().optional(),
  foto: z.string().url('URL de foto inválida').nullable().optional(),
})

export type UpdateConductorFormData = z.infer<typeof updateConductorSchema>

// Schema para validar conductor de Firestore
export const conductorFirestoreSchema = z.object({
  nombre: z.string(),
  cedula: z.string(),
  licencia: z.string(),
  fechaVencimientoLicencia: z.unknown(), // Firestore Timestamp
  sucursalId: z.string(),
  propietarioId: z.string().nullable(),
  activo: z.boolean(),
  foto: z.string().nullable(),
  createdAt: z.unknown(),
  updatedAt: z.unknown(),
  createdBy: z.string(),
  deleted: z.boolean().optional(),
})

export type ConductorFirestore = z.infer<typeof conductorFirestoreSchema>

// Schema para asignar conductor a bus
export const asignarConductorSchema = z.object({
  conductorId: z.string().min(1, 'Conductor es requerido'),
  busId: z.string().min(1, 'Bus es requerido'),
})

export type AsignarConductorFormData = z.infer<typeof asignarConductorSchema>
