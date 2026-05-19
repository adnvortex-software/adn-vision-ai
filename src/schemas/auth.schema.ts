import { z } from 'zod'
import { ALL_ROLES } from '@/config/constants'

// Schema para login
export const loginSchema = z.object({
  email: z.string().min(1, 'Email es requerido').email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  rememberMe: z.boolean().optional().default(false),
})

export type LoginFormData = z.infer<typeof loginSchema>

// Schema para recuperar contraseña
export const resetPasswordSchema = z.object({
  email: z.string().min(1, 'Email es requerido').email('Email inválido'),
})

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

// Schema para crear usuario
export const createUsuarioSchema = z.object({
  email: z.string().min(1, 'Email es requerido').email('Email inválido'),
  nombre: z.string().min(2, 'Mínimo 2 caracteres').max(100, 'Máximo 100 caracteres'),
  rol: z.enum(ALL_ROLES, { errorMap: () => ({ message: 'Rol inválido' }) }),
  clienteId: z.string().nullable().optional(),
  sucursalIds: z.array(z.string()).nullable().optional(),
  propietarioId: z.string().nullable().optional(),
})

export type CreateUsuarioFormData = z.infer<typeof createUsuarioSchema>

// Schema para actualizar usuario
export const updateUsuarioSchema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres').max(100, 'Máximo 100 caracteres').optional(),
  rol: z.enum(ALL_ROLES).optional(),
  sucursalIds: z.array(z.string()).nullable().optional(),
  propietarioId: z.string().nullable().optional(),
  activo: z.boolean().optional(),
})

export type UpdateUsuarioFormData = z.infer<typeof updateUsuarioSchema>

// Schema para validar usuario de Firestore
export const usuarioFirestoreSchema = z.object({
  uid: z.string(),
  email: z.string().email(),
  nombre: z.string(),
  rol: z.enum(ALL_ROLES),
  clienteId: z.string().nullable(),
  sucursalIds: z.array(z.string()).nullable(),
  propietarioId: z.string().nullable(),
  activo: z.boolean(),
  createdAt: z.unknown(), // Firestore Timestamp
  updatedAt: z.unknown(),
  createdBy: z.string(),
  deleted: z.boolean().optional(),
})

export type UsuarioFirestore = z.infer<typeof usuarioFirestoreSchema>
