/**
 * Seed data for catalogoNovedades collection
 *
 * MVP includes 5 types of novedades:
 * 1. conteo_pasajeros - Passenger counting
 * 2. pasajero_en_cabina - Passenger in driver cabin
 * 3. sobrecupo - Overcrowding / standing passengers
 * 4. conductor_sin_cinturon - Driver without seatbelt
 * 5. conductor_fumando - Driver smoking
 */

import type { NovedadCatalogo } from '@/types/novedad'
import type { CameraProfile } from './constants'

type NovedadCatalogoSeed = Omit<
  NovedadCatalogo,
  'createdAt' | 'updatedAt' | 'createdBy' | 'deleted'
>

export const CATALOGO_NOVEDADES_SEED: Record<string, NovedadCatalogoSeed> = {
  conteo_pasajeros: {
    codigo: 'conteo_pasajeros',
    nombre: 'Conteo de Pasajeros',
    descripcion:
      'Detecta y cuenta el cruce de personas a traves de una linea virtual, registrando entradas y salidas del vehiculo.',
    categoria: 'operativa',
    perfilesCompatibles: ['cabina', 'puerta', 'pasillo'],
    planMinimo: 'basico',
    paramsSchema: {
      type: 'object',
      properties: {
        lineaVirtual: {
          type: 'object',
          properties: {
            x1: { type: 'number', minimum: 0, maximum: 1 },
            y1: { type: 'number', minimum: 0, maximum: 1 },
            x2: { type: 'number', minimum: 0, maximum: 1 },
            y2: { type: 'number', minimum: 0, maximum: 1 },
            orientacion: { type: 'string', enum: ['horizontal', 'vertical', 'diagonal'] },
          },
          required: ['x1', 'y1', 'x2', 'y2', 'orientacion'],
        },
      },
      required: ['lineaVirtual'],
    },
    esTecnica: false,
    generaPDF: false,
    icono: 'Users',
    activa: true,
  },

  pasajero_en_cabina: {
    codigo: 'pasajero_en_cabina',
    nombre: 'Pasajero en Cabina',
    descripcion:
      'Detecta la presencia de pasajeros en la zona de la cabina del conductor, generando alertas cuando se detecta una persona no autorizada.',
    categoria: 'seguridad_pasajero',
    perfilesCompatibles: ['cabina'],
    planMinimo: 'basico',
    paramsSchema: {
      type: 'object',
      properties: {
        zonaPoligono: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              x: { type: 'number', minimum: 0, maximum: 1 },
              y: { type: 'number', minimum: 0, maximum: 1 },
            },
            required: ['x', 'y'],
          },
          minItems: 3,
          maxItems: 10,
        },
        tiempoMinimoSeg: {
          type: 'number',
          minimum: 1,
          maximum: 60,
          default: 5,
          description: 'Segundos minimos de permanencia para generar alerta',
        },
        cantidadMaxima: {
          type: 'number',
          minimum: 0,
          maximum: 5,
          default: 0,
          description: 'Numero maximo de personas permitidas (0 = ninguna)',
        },
      },
      required: ['zonaPoligono'],
    },
    esTecnica: false,
    generaPDF: true,
    icono: 'UserX',
    activa: true,
  },

  sobrecupo: {
    codigo: 'sobrecupo',
    nombre: 'Sobrecupo / Pasajeros de Pie',
    descripcion:
      'Detecta cuando hay pasajeros de pie en el pasillo del vehiculo, permitiendo monitorear el nivel de ocupacion y generar alertas de sobrecupo.',
    categoria: 'operativa',
    perfilesCompatibles: ['pasillo'],
    planMinimo: 'profesional',
    paramsSchema: {
      type: 'object',
      properties: {
        zonaPoligono: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              x: { type: 'number', minimum: 0, maximum: 1 },
              y: { type: 'number', minimum: 0, maximum: 1 },
            },
            required: ['x', 'y'],
          },
          minItems: 3,
          maxItems: 10,
        },
        cantidadMaxima: {
          type: 'number',
          minimum: 0,
          maximum: 50,
          default: 0,
          description: 'Numero maximo de personas de pie permitidas (0 = ninguna)',
        },
        tiempoMinimoSeg: {
          type: 'number',
          minimum: 5,
          maximum: 300,
          default: 10,
          description: 'Segundos minimos de deteccion para generar alerta',
        },
      },
      required: ['zonaPoligono'],
    },
    esTecnica: false,
    generaPDF: true,
    icono: 'UsersRound',
    activa: true,
  },

  conductor_sin_cinturon: {
    codigo: 'conductor_sin_cinturon',
    nombre: 'Conductor sin Cinturon',
    descripcion:
      'Detecta cuando el conductor no tiene puesto el cinturon de seguridad mientras el vehiculo esta en movimiento.',
    categoria: 'seguridad_conductor',
    perfilesCompatibles: ['cabina'],
    planMinimo: 'profesional',
    paramsSchema: {
      type: 'object',
      properties: {
        zonaPoligono: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              x: { type: 'number', minimum: 0, maximum: 1 },
              y: { type: 'number', minimum: 0, maximum: 1 },
            },
            required: ['x', 'y'],
          },
          minItems: 3,
          maxItems: 10,
        },
        tiempoMinimoSeg: {
          type: 'number',
          minimum: 5,
          maximum: 120,
          default: 10,
          description: 'Segundos minimos sin cinturon para generar alerta',
        },
      },
      required: ['zonaPoligono'],
    },
    esTecnica: false,
    generaPDF: true,
    icono: 'ShieldAlert',
    activa: true,
  },

  conductor_fumando: {
    codigo: 'conductor_fumando',
    nombre: 'Conductor Fumando',
    descripcion:
      'Detecta cuando el conductor esta fumando dentro del vehiculo, una practica prohibida que pone en riesgo la seguridad.',
    categoria: 'seguridad_conductor',
    perfilesCompatibles: ['cabina'],
    planMinimo: 'profesional',
    paramsSchema: {
      type: 'object',
      properties: {
        zonaPoligono: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              x: { type: 'number', minimum: 0, maximum: 1 },
              y: { type: 'number', minimum: 0, maximum: 1 },
            },
            required: ['x', 'y'],
          },
          minItems: 3,
          maxItems: 10,
        },
      },
      required: ['zonaPoligono'],
    },
    esTecnica: false,
    generaPDF: true,
    icono: 'Cigarette',
    activa: true,
  },
}

/**
 * Get all novedades as an array for seeding
 */
export function getCatalogoNovedadesList(): Array<NovedadCatalogoSeed & { id: string }> {
  return Object.entries(CATALOGO_NOVEDADES_SEED).map(([id, novedad]) => ({
    id,
    ...novedad,
  }))
}

/**
 * Get novedad by code
 */
export function getNovedadByCodigo(codigo: string): NovedadCatalogoSeed | undefined {
  return CATALOGO_NOVEDADES_SEED[codigo]
}

/**
 * Get novedades filtered by camera profile
 */
export function getNovedadesByPerfil(
  perfil: CameraProfile
): Array<NovedadCatalogoSeed & { id: string }> {
  return getCatalogoNovedadesList().filter((n) => n.perfilesCompatibles.includes(perfil))
}

/**
 * Get novedades filtered by minimum plan
 */
export function getNovedadesByPlan(
  plan: 'basico' | 'profesional' | 'premium'
): Array<NovedadCatalogoSeed & { id: string }> {
  const planHierarchy = { basico: 0, profesional: 1, premium: 2 }
  const maxLevel = planHierarchy[plan]

  return getCatalogoNovedadesList().filter((n) => planHierarchy[n.planMinimo] <= maxLevel)
}

/**
 * Get novedades that generate PDF reports
 */
export function getNovedadesConPDF(): Array<NovedadCatalogoSeed & { id: string }> {
  return getCatalogoNovedadesList().filter((n) => n.generaPDF)
}

/**
 * Validate that all required novedades are present
 */
export function validateCatalogoCompleteness(): boolean {
  const requiredCodes = [
    'conteo_pasajeros',
    'pasajero_en_cabina',
    'sobrecupo',
    'conductor_sin_cinturon',
    'conductor_fumando',
  ]

  return requiredCodes.every((code) => code in CATALOGO_NOVEDADES_SEED)
}
