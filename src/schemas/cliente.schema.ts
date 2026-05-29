import { z } from 'zod'
import { PLANS } from '@/config/constants'

// Schema para crear cliente
export const createClienteSchema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres').max(200, 'Máximo 200 caracteres'),
  nit: z
    .string()
    .min(5, 'NIT inválido')
    .max(20, 'NIT inválido')
    .regex(/^[\d.-]+$/, 'NIT solo puede contener números, puntos y guiones'),
  contactoEmail: z.string().min(1, 'Email es requerido').email('Email inválido'),
  contactoTelefono: z
    .string()
    .min(7, 'Teléfono inválido')
    .max(15, 'Teléfono inválido')
    .regex(/^[\d\s()-+]+$/, 'Teléfono inválido'),
  planContratado: z.enum(PLANS, { errorMap: () => ({ message: 'Plan inválido' }) }),
})

export type CreateClienteFormData = z.infer<typeof createClienteSchema>

// Schema para actualizar cliente
export const updateClienteSchema = createClienteSchema.partial().extend({
  activo: z.boolean().optional(),
})

export type UpdateClienteFormData = z.infer<typeof updateClienteSchema>

// Schema para crear sucursal
export const createSucursalSchema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres').max(100, 'Máximo 100 caracteres'),
  direccion: z.string().min(5, 'Dirección muy corta').max(200, 'Dirección muy larga'),
  ciudad: z.string().min(2, 'Ciudad requerida').max(100, 'Ciudad muy larga'),
})

export type CreateSucursalFormData = z.infer<typeof createSucursalSchema>

// Schema para actualizar sucursal
export const updateSucursalSchema = createSucursalSchema.partial().extend({
  activa: z.boolean().optional(),
})

export type UpdateSucursalFormData = z.infer<typeof updateSucursalSchema>

// Schema para crear propietario
export const createPropietarioSchema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres').max(100, 'Máximo 100 caracteres'),
  documento: z
    .string()
    .min(5, 'Documento inválido')
    .max(20, 'Documento inválido')
    .regex(/^[\d.-]+$/, 'Documento solo puede contener números, puntos y guiones'),
  sucursalId: z.string().min(1, 'Sucursal es requerida'),
  contactoEmail: z.string().email('Email inválido').nullable().optional(),
  contactoTelefono: z
    .string()
    .regex(/^[\d\s()-+]*$/, 'Teléfono inválido')
    .nullable()
    .optional(),
})

export type CreatePropietarioFormData = z.infer<typeof createPropietarioSchema>

// Schema para actualizar propietario
export const updatePropietarioSchema = createPropietarioSchema.partial().extend({
  activo: z.boolean().optional(),
})

export type UpdatePropietarioFormData = z.infer<typeof updatePropietarioSchema>

// Schema para validar cliente de Firestore
export const clienteFirestoreSchema = z.object({
  nombre: z.string(),
  nit: z.string(),
  contactoEmail: z.string(),
  contactoTelefono: z.string(),
  planContratado: z.enum(PLANS),
  activo: z.boolean().optional().default(true),
  logoUrl: z.string().nullable().optional(),
  createdAt: z.unknown(),
  updatedAt: z.unknown(),
  createdBy: z.string().optional().default('system'),
  deleted: z.boolean().optional().default(false),
})

export type ClienteFirestore = z.infer<typeof clienteFirestoreSchema>
