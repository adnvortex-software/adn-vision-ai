import { z } from 'zod'

const envSchema = z.object({
  VITE_FIREBASE_API_KEY: z.string().min(1, 'Firebase API Key es requerida'),
  VITE_FIREBASE_AUTH_DOMAIN: z.string().min(1, 'Firebase Auth Domain es requerido'),
  VITE_FIREBASE_PROJECT_ID: z.string().min(1, 'Firebase Project ID es requerido'),
  VITE_FIREBASE_STORAGE_BUCKET: z.string().min(1, 'Firebase Storage Bucket es requerido'),
  VITE_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1, 'Firebase Messaging Sender ID es requerido'),
  VITE_FIREBASE_APP_ID: z.string().min(1, 'Firebase App ID es requerido'),
  VITE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  VITE_ENABLE_DEBUG: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),
  VITE_MOCK_AUTH: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),
  VITE_ENABLE_QUERY_DEVTOOLS: z
    .string()
    .transform((val) => val === 'true')
    .default('true'),
})

type EnvConfig = z.infer<typeof envSchema>

function validateEnv(): EnvConfig {
  const parsed = envSchema.safeParse(import.meta.env)

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors
    const errorMessages = Object.entries(errors)
      .filter((entry): entry is [string, string[]] => Array.isArray(entry[1]))
      .map(([key, messages]) => `  ${key}: ${messages.join(', ')}`)
      .join('\n')

    console.error('Error de configuración de variables de entorno:\n' + errorMessages)

    // En desarrollo, permitir continuar con valores mock
    if (import.meta.env.DEV) {
      console.warn('Usando configuración de desarrollo con valores placeholder')
      return {
        VITE_FIREBASE_API_KEY: 'mock-api-key',
        VITE_FIREBASE_AUTH_DOMAIN: 'mock-project.firebaseapp.com',
        VITE_FIREBASE_PROJECT_ID: 'mock-project',
        VITE_FIREBASE_STORAGE_BUCKET: 'mock-project.appspot.com',
        VITE_FIREBASE_MESSAGING_SENDER_ID: '123456789',
        VITE_FIREBASE_APP_ID: '1:123456789:web:abc123',
        VITE_ENV: 'development',
        VITE_ENABLE_DEBUG: true,
        VITE_MOCK_AUTH: true,
        VITE_ENABLE_QUERY_DEVTOOLS: true,
      }
    }

    throw new Error('Variables de entorno inválidas. Revisa la consola para más detalles.')
  }

  return parsed.data
}

export const env = validateEnv()

export const isDev = env.VITE_ENV === 'development'
export const isStaging = env.VITE_ENV === 'staging'
export const isProd = env.VITE_ENV === 'production'
