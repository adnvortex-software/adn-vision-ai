import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '@/config/firebase'

const COLLECTION = 'conteos'

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
