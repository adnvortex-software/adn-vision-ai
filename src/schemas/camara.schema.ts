import { z } from 'zod'
import { CAMERA_PROFILES, DEFAULT_INFERENCE_CONFIG, LIMITS } from '@/config/constants'

// Validador de URL RTSP
const rtspUrlSchema = z
  .string()
  .min(10, 'URL RTSP requerida')
  .regex(/^rtsp:\/\/.+/, 'URL debe comenzar con rtsp://')

// Schema para crear cámara
export const createCamaraSchema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres').max(50, 'Máximo 50 caracteres'),
  perfil: z.enum(CAMERA_PROFILES, { errorMap: () => ({ message: 'Perfil inválido' }) }),
  canal: z
    .number()
    .int('Debe ser un número entero')
    .min(1, 'Canal mínimo es 1')
    .max(16, 'Canal máximo es 16'),
  rtspUrl: rtspUrlSchema,
  rtspSubstreamUrl: rtspUrlSchema.nullable().optional(),
  resolucionInferenciaW: z
    .number()
    .int()
    .min(160, 'Mínimo 160px')
    .max(1920, 'Máximo 1920px')
    .default(DEFAULT_INFERENCE_CONFIG.width),
  resolucionInferenciaH: z
    .number()
    .int()
    .min(120, 'Mínimo 120px')
    .max(1080, 'Máximo 1080px')
    .default(DEFAULT_INFERENCE_CONFIG.height),
  fpsInferencia: z
    .number()
    .int()
    .min(1, 'Mínimo 1 FPS')
    .max(30, 'Máximo 30 FPS')
    .default(DEFAULT_INFERENCE_CONFIG.fps),
})

export type CreateCamaraFormData = z.infer<typeof createCamaraSchema>

// Schema para actualizar cámara
export const updateCamaraSchema = createCamaraSchema.partial().extend({
  habilitada: z.boolean().optional(),
})

export type UpdateCamaraFormData = z.infer<typeof updateCamaraSchema>

// Schema para el wizard - configuración de cámaras (array)
export const busWizardStep3Schema = z.object({
  camaras: z
    .array(createCamaraSchema)
    .min(LIMITS.minCamerasPerBus, `Mínimo ${String(LIMITS.minCamerasPerBus)} cámara`)
    .max(LIMITS.maxCamerasPerBus, `Máximo ${String(LIMITS.maxCamerasPerBus)} cámaras`),
})

export type BusWizardStep3Data = z.infer<typeof busWizardStep3Schema>

// Schema para validar cámara de Firestore
export const camaraFirestoreSchema = z.object({
  nombre: z.string(),
  perfil: z.enum(CAMERA_PROFILES),
  canal: z.number(),
  rtspUrl: z.string(),
  rtspSubstreamUrl: z.string().nullable(),
  resolucionInferenciaW: z.number(),
  resolucionInferenciaH: z.number(),
  fpsInferencia: z.number(),
  habilitada: z.boolean(),
  ultimoScreenshot: z.string().nullable(),
  ultimoScreenshotAt: z.unknown().nullable(),
  createdAt: z.unknown(),
  updatedAt: z.unknown(),
  createdBy: z.string(),
  deleted: z.boolean().optional(),
})

export type CamaraFirestore = z.infer<typeof camaraFirestoreSchema>
