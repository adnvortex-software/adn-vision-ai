import { z } from 'zod'
import { BUS_STATES, VEHICLE_TYPES, PLACA_REGEX } from '@/config/constants'

// Validador de placa colombiana
const placaSchema = z
  .string()
  .min(6, 'Placa inválida')
  .max(6, 'Placa inválida')
  .transform((val) => val.toUpperCase().replace(/\s/g, ''))
  .refine((val) => PLACA_REGEX.test(val), {
    message: 'Formato de placa inválido (ej: ABC123)',
  })

// Validador de IP
const ipSchema = z
  .string()
  .min(7, 'IP inválida')
  .max(15, 'IP inválida')
  .regex(
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
    'Formato de IP inválido'
  )

// Validador de subnet
const subnetSchema = z
  .string()
  .min(9, 'Subnet inválida')
  .max(18, 'Subnet inválida')
  .regex(
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/(?:[0-9]|[1-2][0-9]|3[0-2])$/,
    'Formato de subnet inválido (ej: 192.168.1.0/24)'
  )

// Schema para crear bus
export const createBusSchema = z.object({
  placa: placaSchema,
  clienteId: z.string().min(1, 'Cliente es requerido'),
  sucursalId: z.string().min(1, 'Sucursal es requerida'),
  propietarioId: z.string().nullable().optional(),
  tipoVehiculo: z.enum(VEHICLE_TYPES, {
    errorMap: () => ({ message: 'Tipo de vehículo inválido' }),
  }),
  rutaTexto: z.string().max(200, 'Máximo 200 caracteres').nullable().optional(),
  conductorAsignadoId: z.string().nullable().optional(),
  ztIpRouter: ipSchema,
  subnetLan: subnetSchema,
})

export type CreateBusFormData = z.infer<typeof createBusSchema>

// Schema para actualizar bus
export const updateBusSchema = createBusSchema.partial().extend({
  estado: z.enum(BUS_STATES).optional(),
  activo: z.boolean().optional(),
})

export type UpdateBusFormData = z.infer<typeof updateBusSchema>

// Schema para el wizard de creación de bus - Step 1
export const busWizardStep1Schema = z.object({
  placa: placaSchema,
  clienteId: z.string().min(1, 'Cliente es requerido'),
  sucursalId: z.string().min(1, 'Sucursal es requerida'),
  propietarioId: z.string().nullable().optional(),
  tipoVehiculo: z.enum(VEHICLE_TYPES),
  rutaTexto: z.string().max(200).nullable().optional(),
  conductorAsignadoId: z.string().nullable().optional(),
})

export type BusWizardStep1Data = z.infer<typeof busWizardStep1Schema>

// Schema para el wizard de creación de bus - Step 2
export const busWizardStep2Schema = z.object({
  ztIpRouter: ipSchema,
  subnetLan: subnetSchema,
})

export type BusWizardStep2Data = z.infer<typeof busWizardStep2Schema>

// Schema para validar bus de Firestore
export const busFirestoreSchema = z.object({
  placa: z.string(),
  clienteId: z.string(),
  sucursalId: z.string(),
  propietarioId: z.string().nullable(),
  tipoVehiculo: z.enum(VEHICLE_TYPES),
  rutaTexto: z.string().nullable(),
  conductorAsignadoId: z.string().nullable(),
  ztIpRouter: z.string(),
  subnetLan: z.string(),
  estado: z.enum(BUS_STATES),
  lastHeartbeat: z.unknown().nullable(),
  numCamarasConfiguradas: z.number(),
  activo: z.boolean(),
  createdAt: z.unknown(),
  updatedAt: z.unknown(),
  createdBy: z.string(),
  deleted: z.boolean().optional(),
})

export type BusFirestore = z.infer<typeof busFirestoreSchema>
