import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '@/config/firebase'
import { busFirestoreSchema } from '@/schemas/bus.schema'
import type { Bus } from '@/types/bus'
import type { Entity, PaginatedQuery, PaginatedResult, FirestoreDocData } from '@/types/firestore'

const COLLECTION = 'buses'

/**
 * Obtiene un bus por ID
 */
export async function getBus(busId: string): Promise<Entity<Bus> | null> {
  const docRef = doc(db, COLLECTION, busId)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) {
    return null
  }

  const data = docSnap.data() as FirestoreDocData
  const parsed = busFirestoreSchema.safeParse(data)

  if (!parsed.success) {
    console.error('Error validando bus:', parsed.error)
    return null
  }

  return {
    id: docSnap.id,
    ...parsed.data,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  }
}

/**
 * Obtiene un bus por placa
 */
export async function getBusByPlaca(placa: string): Promise<Entity<Bus> | null> {
  const q = query(
    collection(db, COLLECTION),
    where('placa', '==', placa.toUpperCase()),
    where('deleted', '!=', true),
    limit(1)
  )

  const snapshot = await getDocs(q)
  if (snapshot.empty) return null

  const docSnap = snapshot.docs[0]
  if (!docSnap) return null

  const data = docSnap.data() as FirestoreDocData
  const parsed = busFirestoreSchema.safeParse(data)

  if (!parsed.success) return null

  return {
    id: docSnap.id,
    ...parsed.data,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  }
}

/**
 * Lista buses con paginación y filtros
 */
export async function listBuses(
  options: PaginatedQuery & {
    clienteId?: string
    sucursalId?: string
    estado?: string
  } = {}
): Promise<PaginatedResult<Entity<Bus>>> {
  const { limit: pageLimit = 20, startAfter: startAfterId, clienteId, sucursalId, estado } = options

  let q = query(
    collection(db, COLLECTION),
    where('deleted', '!=', true),
    where('activo', '==', true),
    orderBy('placa'),
    limit(pageLimit + 1)
  )

  if (clienteId) {
    q = query(q, where('clienteId', '==', clienteId))
  }

  if (sucursalId) {
    q = query(q, where('sucursalId', '==', sucursalId))
  }

  if (estado) {
    q = query(q, where('estado', '==', estado))
  }

  if (startAfterId) {
    const startDoc = await getDoc(doc(db, COLLECTION, startAfterId))
    if (startDoc.exists()) {
      q = query(q, startAfter(startDoc))
    }
  }

  const snapshot = await getDocs(q)
  const docs = snapshot.docs.slice(0, pageLimit)
  const hasMore = snapshot.docs.length > pageLimit

  const data: Entity<Bus>[] = docs
    .map((docSnap) => {
      const docData = docSnap.data() as FirestoreDocData
      const parsed = busFirestoreSchema.safeParse(docData)
      if (!parsed.success) return null
      return {
        id: docSnap.id,
        ...parsed.data,
        createdAt: docData.createdAt,
        updatedAt: docData.updatedAt,
      }
    })
    .filter((item): item is Entity<Bus> => item !== null)

  return {
    data,
    hasMore,
    lastDoc: docs[docs.length - 1]?.id,
  }
}

/**
 * Crea un nuevo bus
 */
export async function createBus(
  data: Omit<
    Bus,
    | 'createdAt'
    | 'updatedAt'
    | 'createdBy'
    | 'activo'
    | 'estado'
    | 'lastHeartbeat'
    | 'numCamarasConfiguradas'
  >,
  createdBy: string
): Promise<string> {
  // Verificar que la placa no exista
  const existing = await getBusByPlaca(data.placa)
  if (existing) {
    throw new Error('Ya existe un bus con esta placa')
  }

  const docRef = await addDoc(collection(db, COLLECTION), {
    ...data,
    placa: data.placa.toUpperCase(),
    estado: 'sin_conexion',
    lastHeartbeat: null,
    numCamarasConfiguradas: 0,
    activo: true,
    deleted: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy,
  })
  return docRef.id
}

/**
 * Actualiza un bus
 */
export async function updateBus(busId: string, data: Partial<Bus>): Promise<void> {
  const docRef = doc(db, COLLECTION, busId)

  const updateData: Record<string, unknown> = {
    ...data,
    updatedAt: serverTimestamp(),
  }

  // Normalizar placa si se actualiza
  if (data.placa) {
    updateData.placa = data.placa.toUpperCase()
  }

  await updateDoc(docRef, updateData)
}

/**
 * Soft delete de bus
 */
export async function deleteBus(busId: string): Promise<void> {
  const docRef = doc(db, COLLECTION, busId)
  await updateDoc(docRef, {
    deleted: true,
    activo: false,
    updatedAt: serverTimestamp(),
  })
}

/**
 * Suscribe a cambios en tiempo real de buses
 */
export function subscribeToBuses(
  callback: (buses: Entity<Bus>[]) => void,
  options: { clienteId?: string } = {}
): Unsubscribe {
  let q = query(
    collection(db, COLLECTION),
    where('deleted', '!=', true),
    where('activo', '==', true),
    orderBy('placa')
  )

  if (options.clienteId) {
    q = query(q, where('clienteId', '==', options.clienteId))
  }

  return onSnapshot(q, (snapshot) => {
    const buses: Entity<Bus>[] = snapshot.docs
      .map((docSnap) => {
        const data = docSnap.data() as FirestoreDocData
        const parsed = busFirestoreSchema.safeParse(data)
        if (!parsed.success) return null
        return {
          id: docSnap.id,
          ...parsed.data,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        }
      })
      .filter((item): item is Entity<Bus> => item !== null)

    callback(buses)
  })
}
