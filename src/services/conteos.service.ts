import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '@/config/firebase'
import { format } from 'date-fns'

const COLLECTION = 'conteos'
const CONTEOS_DIARIOS_COLLECTION = 'conteosDiarios'

// Raw Firestore data types
interface ConteoResumenFirestore {
  busId?: string
  clienteId?: string
  entradasDia?: number
  salidasDia?: number
  aforoActual?: number
  fechaOperativa?: string
  updatedAt?: Timestamp | null
}

interface ConteoEventoFirestore {
  tipo?: string
  camaraId?: string
  trackId?: number
  aforoTrasEvento?: number
  timestamp?: Timestamp
}

export interface ConteoResumen {
  busId: string
  clienteId: string
  entradasDia: number
  salidasDia: number
  aforoActual: number
  fechaOperativa: string
  updatedAt: Timestamp | null
}

export interface ConteoEvento {
  id: string
  tipo: 'entrada' | 'salida'
  camaraId: string
  trackId: number
  aforoTrasEvento: number
  timestamp: Timestamp
}

/**
 * Lista todos los conteos actuales de todos los buses
 */
export async function listAllConteos(): Promise<ConteoResumen[]> {
  const snapshot = await getDocs(collection(db, COLLECTION))

  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data() as ConteoResumenFirestore
    return {
      busId: data.busId ?? docSnap.id,
      clienteId: data.clienteId ?? '',
      entradasDia: data.entradasDia ?? 0,
      salidasDia: data.salidasDia ?? 0,
      aforoActual: data.aforoActual ?? 0,
      fechaOperativa: data.fechaOperativa ?? '',
      updatedAt: data.updatedAt ?? null,
    }
  })
}

/**
 * Obtiene el resumen de conteo de un bus
 */
export async function getConteoResumen(busId: string): Promise<ConteoResumen | null> {
  const docRef = doc(db, COLLECTION, busId)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) {
    return null
  }

  const data = docSnap.data() as ConteoResumenFirestore
  return {
    busId: data.busId ?? busId,
    clienteId: data.clienteId ?? '',
    entradasDia: data.entradasDia ?? 0,
    salidasDia: data.salidasDia ?? 0,
    aforoActual: data.aforoActual ?? 0,
    fechaOperativa: data.fechaOperativa ?? '',
    updatedAt: data.updatedAt ?? null,
  }
}

/**
 * Suscribe a cambios en el conteo de un bus (tiempo real)
 */
export function subscribeToConteo(
  busId: string,
  callback: (conteo: ConteoResumen | null) => void
): Unsubscribe {
  const docRef = doc(db, COLLECTION, busId)

  return onSnapshot(docRef, (docSnap) => {
    if (!docSnap.exists()) {
      callback(null)
      return
    }

    const data = docSnap.data() as ConteoResumenFirestore
    callback({
      busId: data.busId ?? busId,
      clienteId: data.clienteId ?? '',
      entradasDia: data.entradasDia ?? 0,
      salidasDia: data.salidasDia ?? 0,
      aforoActual: data.aforoActual ?? 0,
      fechaOperativa: data.fechaOperativa ?? '',
      updatedAt: data.updatedAt ?? null,
    })
  })
}

/**
 * Obtiene los eventos de conteo de un bus
 */
export async function getConteoEventos(
  busId: string,
  options?: {
    fechaInicio?: Date
    fechaFin?: Date
    limite?: number
  }
): Promise<ConteoEvento[]> {
  const eventosRef = collection(db, COLLECTION, busId, 'eventos')

  let q = query(eventosRef, orderBy('timestamp', 'desc'))

  if (options?.fechaInicio) {
    q = query(q, where('timestamp', '>=', Timestamp.fromDate(options.fechaInicio)))
  }

  if (options?.fechaFin) {
    q = query(q, where('timestamp', '<=', Timestamp.fromDate(options.fechaFin)))
  }

  if (options?.limite) {
    q = query(q, limit(options.limite))
  } else {
    q = query(q, limit(500)) // Default limit
  }

  const snapshot = await getDocs(q)

  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data() as ConteoEventoFirestore
    return {
      id: docSnap.id,
      tipo: (data.tipo ?? 'entrada') as 'entrada' | 'salida',
      camaraId: data.camaraId ?? '',
      trackId: data.trackId ?? 0,
      aforoTrasEvento: data.aforoTrasEvento ?? 0,
      timestamp: data.timestamp as Timestamp,
    }
  })
}

/**
 * Suscribe a eventos de conteo en tiempo real
 */
export function subscribeToConteoEventos(
  busId: string,
  callback: (eventos: ConteoEvento[]) => void,
  limite: number = 100
): Unsubscribe {
  const eventosRef = collection(db, COLLECTION, busId, 'eventos')
  const q = query(eventosRef, orderBy('timestamp', 'desc'), limit(limite))

  return onSnapshot(q, (snapshot) => {
    const eventos = snapshot.docs.map((docSnap) => {
      const data = docSnap.data() as ConteoEventoFirestore
      return {
        id: docSnap.id,
        tipo: (data.tipo ?? 'entrada') as 'entrada' | 'salida',
        camaraId: data.camaraId ?? '',
        trackId: data.trackId ?? 0,
        aforoTrasEvento: data.aforoTrasEvento ?? 0,
        timestamp: data.timestamp as Timestamp,
      }
    })
    callback(eventos)
  })
}

// ============ BACKFILL FUNCTIONS ============

export interface ConteoDiario {
  busId: string
  clienteId: string
  fecha: string
  totalEntradas: number
  totalSalidas: number
  aforoMaximoDia: number
  franjasHorarias: Record<string, { entradas: number; salidas: number }>
}

export interface BackfillProgress {
  busId: string
  totalEventos: number
  diasProcesados: number
  fechas: string[]
  status: 'pending' | 'processing' | 'completed' | 'error'
  error?: string
}

/**
 * Obtiene TODOS los eventos de un bus (sin límite, para backfill)
 */
export async function getAllConteoEventos(busId: string): Promise<ConteoEvento[]> {
  const eventosRef = collection(db, COLLECTION, busId, 'eventos')
  const q = query(eventosRef, orderBy('timestamp', 'asc'))
  const snapshot = await getDocs(q)

  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data() as ConteoEventoFirestore
    return {
      id: docSnap.id,
      tipo: (data.tipo ?? 'entrada') as 'entrada' | 'salida',
      camaraId: data.camaraId ?? '',
      trackId: data.trackId ?? 0,
      aforoTrasEvento: data.aforoTrasEvento ?? 0,
      timestamp: data.timestamp as Timestamp,
    }
  })
}

/**
 * Agrupa eventos por fecha y calcula totales
 */
export function aggregateEventosByDate(
  eventos: ConteoEvento[],
  busId: string,
  clienteId: string
): Map<string, ConteoDiario> {
  const dailyData = new Map<string, ConteoDiario>()

  for (const evento of eventos) {
    const date = evento.timestamp.toDate()
    const fecha = format(date, 'yyyy-MM-dd')
    const hora = format(date, 'HH') // Hora para franjas horarias

    if (!dailyData.has(fecha)) {
      dailyData.set(fecha, {
        busId,
        clienteId,
        fecha,
        totalEntradas: 0,
        totalSalidas: 0,
        aforoMaximoDia: 0,
        franjasHorarias: {},
      })
    }

    const dayData = dailyData.get(fecha)
    if (!dayData) continue

    // Actualizar totales
    if (evento.tipo === 'entrada') {
      dayData.totalEntradas++
    } else {
      dayData.totalSalidas++
    }

    // Actualizar aforo máximo
    if (evento.aforoTrasEvento > dayData.aforoMaximoDia) {
      dayData.aforoMaximoDia = evento.aforoTrasEvento
    }

    // Actualizar franjas horarias
    dayData.franjasHorarias[hora] ??= { entradas: 0, salidas: 0 }
    if (evento.tipo === 'entrada') {
      dayData.franjasHorarias[hora].entradas++
    } else {
      dayData.franjasHorarias[hora].salidas++
    }
  }

  return dailyData
}

/**
 * Escribe un ConteoDiario en Firestore
 */
export async function writeConteoDiario(data: ConteoDiario): Promise<void> {
  const docId = `${data.busId}_${data.fecha}`
  const docRef = doc(db, CONTEOS_DIARIOS_COLLECTION, docId)
  await setDoc(docRef, data)
}

/**
 * Ejecuta backfill para un bus específico
 */
export async function backfillBusConteos(
  busId: string,
  clienteId: string,
  onProgress?: (msg: string) => void
): Promise<BackfillProgress> {
  const progress: BackfillProgress = {
    busId,
    totalEventos: 0,
    diasProcesados: 0,
    fechas: [],
    status: 'processing',
  }

  try {
    onProgress?.(`[${busId}] Obteniendo eventos...`)

    // Obtener todos los eventos
    const eventos = await getAllConteoEventos(busId)
    progress.totalEventos = eventos.length

    if (eventos.length === 0) {
      progress.status = 'completed'
      onProgress?.(`[${busId}] Sin eventos para procesar`)
      return progress
    }

    onProgress?.(`[${busId}] ${String(eventos.length)} eventos encontrados. Agrupando por fecha...`)

    // Agrupar por fecha
    const dailyData = aggregateEventosByDate(eventos, busId, clienteId)

    onProgress?.(
      `[${busId}] ${String(dailyData.size)} días encontrados. Escribiendo a conteosDiarios...`
    )

    // Escribir cada día
    for (const [fecha, data] of dailyData) {
      await writeConteoDiario(data)
      progress.diasProcesados++
      progress.fechas.push(fecha)
      onProgress?.(
        `[${busId}] Día ${fecha}: ${String(data.totalEntradas)} entradas, ${String(data.totalSalidas)} salidas`
      )
    }

    progress.status = 'completed'
    onProgress?.(
      `[${busId}] Backfill completado: ${String(progress.diasProcesados)} días procesados`
    )

    return progress
  } catch (error) {
    progress.status = 'error'
    progress.error = error instanceof Error ? error.message : 'Error desconocido'
    onProgress?.(`[${busId}] Error: ${progress.error}`)
    return progress
  }
}

/**
 * Obtiene lista de buses que tienen conteos
 */
export async function listBusesWithConteos(): Promise<Array<{ busId: string; clienteId: string }>> {
  const snapshot = await getDocs(collection(db, COLLECTION))

  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data() as ConteoResumenFirestore
    return {
      busId: docSnap.id,
      clienteId: data.clienteId ?? '',
    }
  })
}

/**
 * Ejecuta backfill para TODOS los buses
 */
export async function backfillAllConteos(
  onProgress?: (msg: string) => void
): Promise<BackfillProgress[]> {
  onProgress?.('Iniciando backfill de todos los buses...')

  const buses = await listBusesWithConteos()
  onProgress?.(`${String(buses.length)} buses encontrados con conteos`)

  const results: BackfillProgress[] = []

  for (const bus of buses) {
    const result = await backfillBusConteos(bus.busId, bus.clienteId, onProgress)
    results.push(result)
  }

  const totalDias = results.reduce((sum, r) => sum + r.diasProcesados, 0)
  const totalEventos = results.reduce((sum, r) => sum + r.totalEventos, 0)

  onProgress?.(
    `Backfill completado: ${String(results.length)} buses, ${String(totalDias)} días, ${String(totalEventos)} eventos`
  )

  return results
}

/**
 * Lee conteos diarios para el dashboard (reemplaza listAllConteos para histórico)
 */
export async function getConteosDiariosForDashboard(options: {
  fechaDesde: string
  fechaHasta: string
  clienteId?: string
}): Promise<ConteoDiario[]> {
  const q = query(
    collection(db, CONTEOS_DIARIOS_COLLECTION),
    where('fecha', '>=', options.fechaDesde),
    where('fecha', '<=', options.fechaHasta),
    orderBy('fecha')
  )

  const snapshot = await getDocs(q)
  let results = snapshot.docs.map((docSnap) => docSnap.data() as ConteoDiario)

  // Filtrar por clienteId en memoria si se especifica
  if (options.clienteId) {
    results = results.filter((c) => c.clienteId === options.clienteId)
  }

  return results
}
