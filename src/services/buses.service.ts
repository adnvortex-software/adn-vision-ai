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
    lastHeartbeat:
      ((data as { lastHeartbeat?: unknown }).lastHeartbeat as Bus['lastHeartbeat']) ?? null,
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
    where('activo', '==', true),
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
    lastHeartbeat:
      ((data as { lastHeartbeat?: unknown }).lastHeartbeat as Bus['lastHeartbeat']) ?? null,
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
    estado?: string
  } = {}
): Promise<PaginatedResult<Entity<Bus>>> {
  const { limit: pageLimit = 20, startAfter: startAfterId, clienteId, estado } = options

  // Query all buses and filter in JavaScript to avoid composite index requirements
  let q = query(collection(db, COLLECTION), orderBy('placa'))

  if (startAfterId) {
    const startDoc = await getDoc(doc(db, COLLECTION, startAfterId))
    if (startDoc.exists()) {
      q = query(q, startAfter(startDoc))
    }
  }

  const snapshot = await getDocs(q)

  // Filter in JavaScript to avoid composite index requirements
  const allBuses: Entity<Bus>[] = []
  for (const docSnap of snapshot.docs) {
    const docData = docSnap.data() as FirestoreDocData
    const parsed = busFirestoreSchema.safeParse(docData)
    if (!parsed.success) {
      console.warn('Failed to parse bus:', docSnap.id, parsed.error.errors)
      continue
    }
    const item: Entity<Bus> = {
      id: docSnap.id,
      ...parsed.data,
      lastHeartbeat:
        ((docData as { lastHeartbeat?: unknown }).lastHeartbeat as Bus['lastHeartbeat']) ?? null,
      createdAt: docData.createdAt,
      updatedAt: docData.updatedAt,
    }
    // Filter out deleted/inactive buses
    if (item.deleted) continue
    if (!item.activo) continue
    // Filter by clienteId if provided
    if (clienteId && item.clienteId !== clienteId) continue
    // Filter by estado if provided
    if (estado && item.estado !== estado) continue
    allBuses.push(item)
  }

  // Apply pagination
  const data = allBuses.slice(0, pageLimit)
  const hasMore = allBuses.length > pageLimit

  return {
    data,
    hasMore,
    lastDoc: data[data.length - 1]?.id,
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
 * Verifica si un bus puede ser eliminado (no tiene cámaras configuradas activas)
 */
export async function canDeleteBus(
  busId: string
): Promise<{ canDelete: boolean; reason?: string }> {
  // Verificar si tiene cámaras activas
  const camarasQuery = query(
    collection(db, COLLECTION, busId, 'camaras'),
    where('activa', '==', true),
    limit(1)
  )
  const camarasSnapshot = await getDocs(camarasQuery)

  if (!camarasSnapshot.empty) {
    return {
      canDelete: false,
      reason: 'El bus tiene cámaras configuradas. Elimina las cámaras primero.',
    }
  }

  return { canDelete: true }
}

/**
 * Soft delete de bus (con validación de dependencias)
 */
export async function deleteBus(busId: string): Promise<void> {
  const { canDelete, reason } = await canDeleteBus(busId)
  if (!canDelete) {
    throw new Error(reason)
  }

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
  // Query all buses, filter in JavaScript to avoid composite index requirements
  const q = query(collection(db, COLLECTION), orderBy('placa'))

  return onSnapshot(q, (snapshot) => {
    const buses: Entity<Bus>[] = []
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data() as FirestoreDocData
      const parsed = busFirestoreSchema.safeParse(data)
      if (!parsed.success) {
        console.warn('Failed to parse bus:', docSnap.id, parsed.error.errors)
        continue
      }
      const item: Entity<Bus> = {
        id: docSnap.id,
        ...parsed.data,
        lastHeartbeat:
          ((data as { lastHeartbeat?: unknown }).lastHeartbeat as Bus['lastHeartbeat']) ?? null,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      }
      if (item.deleted) continue
      if (!item.activo) continue
      // Filter by clienteId if provided
      if (options.clienteId && item.clienteId !== options.clienteId) continue
      buses.push(item)
    }
    callback(buses)
  })
}
