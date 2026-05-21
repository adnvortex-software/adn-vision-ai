import { z } from 'zod'

const envSchema = z.object({
  // Firebase config - API Key is required for web SDK
  VITE_FIREBASE_API_KEY: z.string().default(''),
  VITE_FIREBASE_AUTH_DOMAIN: z.string().default(''),
  VITE_FIREBASE_PROJECT_ID: z.string().min(1, 'Firebase Project ID es requerido'),
  VITE_FIREBASE_STORAGE_BUCKET: z.string().default(''),
  VITE_FIREBASE_MESSAGING_SENDER_ID: z.string().default(''),
  VITE_FIREBASE_APP_ID: z.string().default(''),
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

    // En desarrollo, permitir continuar con valores del proyecto real
    if (import.meta.env.DEV) {
      console.warn('Usando configuración de desarrollo - algunas variables pueden faltar')
      return {
        VITE_FIREBASE_API_KEY: (import.meta.env.VITE_FIREBASE_API_KEY as string | undefined) ?? '',
        VITE_FIREBASE_AUTH_DOMAIN:
          (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined) ??
          'adn-lynx-fb.firebaseapp.com',
        VITE_FIREBASE_PROJECT_ID:
          (import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined) ?? 'adn-lynx-fb',
        VITE_FIREBASE_STORAGE_BUCKET:
          (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined) ??
          'adn-lynx-fb.firebasestorage.app',
        VITE_FIREBASE_MESSAGING_SENDER_ID:
          (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined) ?? '',
        VITE_FIREBASE_APP_ID: (import.meta.env.VITE_FIREBASE_APP_ID as string | undefined) ?? '',
        VITE_ENV: 'development',
        VITE_ENABLE_DEBUG: true,
        VITE_MOCK_AUTH: import.meta.env.VITE_MOCK_AUTH === 'true',
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
