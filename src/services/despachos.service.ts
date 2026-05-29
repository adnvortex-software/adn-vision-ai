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
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db } from '@/config/firebase'
import { despachoFirestoreSchema } from '@/schemas/despacho.schema'
import type { Despacho, CreateDespachoData, DespachoState } from '@/types/despacho'
import type { Entity, PaginatedQuery, PaginatedResult, FirestoreDocData } from '@/types/firestore'

const COLLECTION = 'despachos'

/**
 * Lista despachos con paginación y filtros
 */
export async function listDespachos(
  options: PaginatedQuery & {
    clienteId?: string
    busId?: string
    estado?: DespachoState
    fechaDesde?: Date
    fechaHasta?: Date
  } = {}
): Promise<PaginatedResult<Entity<Despacho>>> {
  const { limit: pageLimit = 50, clienteId, busId, estado, fechaDesde, fechaHasta } = options

  // Build query - avoid composite index by not combining deleted filter with date filters
  // We'll filter dates in JavaScript
  const hasDateFilters = fechaDesde !== undefined || fechaHasta !== undefined

  let q = query(
    collection(db, COLLECTION),
    where('deleted', '==', false),
    limit(hasDateFilters ? pageLimit * 5 : pageLimit + 1) // Fetch more if filtering dates in JS
  )

  if (clienteId) {
    q = query(q, where('clienteId', '==', clienteId))
  }

  if (busId) {
    q = query(q, where('busId', '==', busId))
  }

  if (estado) {
    q = query(q, where('estado', '==', estado))
  }

  // Don't apply date filters in Firestore - will filter in JS to avoid composite index

  const snapshot = await getDocs(q)

  const data: Entity<Despacho>[] = []
  for (const docSnap of snapshot.docs) {
    const docData = docSnap.data() as FirestoreDocData
    const parsed = despachoFirestoreSchema.safeParse(docData)
    if (!parsed.success) {
      console.warn('Failed to parse despacho:', docSnap.id, parsed.error.errors)
      continue
    }

    const despacho: Entity<Despacho> = {
      id: docSnap.id,
      ...parsed.data,
      fechaHora: docData.fechaHora as Despacho['fechaHora'],
      iniciadoAt: (docData.iniciadoAt ?? null) as Despacho['iniciadoAt'],
      completadoAt: (docData.completadoAt ?? null) as Despacho['completadoAt'],
      canceladoAt: (docData.canceladoAt ?? null) as Despacho['canceladoAt'],
      createdAt: docData.createdAt,
      updatedAt: docData.updatedAt,
    }

    // Filter by date in JavaScript if needed
    if (hasDateFilters && 'toDate' in despacho.fechaHora) {
      const despachoDate = despacho.fechaHora.toDate()
      if (fechaDesde && despachoDate < fechaDesde) continue
      if (fechaHasta && despachoDate > fechaHasta) continue
    }

    data.push(despacho)
  }

  // Sort by fechaHora descending
  data.sort((a, b) => {
    const aTime = 'toMillis' in a.fechaHora ? a.fechaHora.toMillis() : 0
    const bTime = 'toMillis' in b.fechaHora ? b.fechaHora.toMillis() : 0
    return bTime - aTime
  })

  // Apply pagination
  const paginatedData = data.slice(0, pageLimit)
  const hasMore = data.length > pageLimit

  return {
    data: paginatedData,
    hasMore,
    lastDoc: paginatedData[paginatedData.length - 1]?.id,
  }
}

/**
 * Obtiene un despacho por ID
 */
export async function getDespacho(id: string): Promise<Entity<Despacho> | null> {
  const docRef = doc(db, COLLECTION, id)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) {
    return null
  }

  const data = docSnap.data() as FirestoreDocData
  const parsed = despachoFirestoreSchema.safeParse(data)

  if (!parsed.success) {
    console.error('Error validando despacho:', parsed.error)
    return null
  }

  return {
    id: docSnap.id,
    ...parsed.data,
    fechaHora: data.fechaHora as Despacho['fechaHora'],
    iniciadoAt: (data.iniciadoAt ?? null) as Despacho['iniciadoAt'],
    completadoAt: (data.completadoAt ?? null) as Despacho['completadoAt'],
    canceladoAt: (data.canceladoAt ?? null) as Despacho['canceladoAt'],
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  }
}

/**
 * Crea un nuevo despacho
 */
export async function createDespacho(
  data: CreateDespachoData,
  despachador: { id: string; nombre: string }
): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTION), {
    fechaHora: Timestamp.fromDate(data.fechaHora),
    busId: data.busId,
    placa: data.placa,
    tipoVehiculo: data.tipoVehiculo,
    numeroInterno: data.numeroInterno ?? null,
    conductor: data.conductor,
    ruta: data.ruta,
    clienteId: data.clienteId,
    clienteNombre: data.clienteNombre,
    despachadorId: despachador.id,
    despachadorNombre: despachador.nombre,
    estado: 'pendiente',
    iniciadoAt: null,
    completadoAt: null,
    canceladoAt: null,
    motivoCancelacion: null,
    deleted: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: despachador.id,
  })

  return docRef.id
}

/**
 * Actualiza el estado de un despacho
 */
export async function updateDespachoEstado(
  id: string,
  estado: DespachoState,
  motivoCancelacion?: string
): Promise<void> {
  const docRef = doc(db, COLLECTION, id)

  const updateData: Record<string, unknown> = {
    estado,
    updatedAt: serverTimestamp(),
  }

  // Set timestamp based on state
  if (estado === 'en_curso') {
    updateData.iniciadoAt = serverTimestamp()
  } else if (estado === 'completado') {
    updateData.completadoAt = serverTimestamp()
  } else if (estado === 'cancelado') {
    updateData.canceladoAt = serverTimestamp()
    updateData.motivoCancelacion = motivoCancelacion ?? null
  }

  await updateDoc(docRef, updateData)
}

/**
 * Elimina (soft delete) un despacho
 */
export async function deleteDespacho(id: string): Promise<void> {
  const docRef = doc(db, COLLECTION, id)
  await updateDoc(docRef, {
    deleted: true,
    updatedAt: serverTimestamp(),
  })
}

/**
 * Lista despachos de hoy para un cliente
 */
export async function listDespachosHoy(clienteId?: string): Promise<Entity<Despacho>[]> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  let q = query(
    collection(db, COLLECTION),
    where('deleted', '==', false),
    where('fechaHora', '>=', Timestamp.fromDate(today)),
    where('fechaHora', '<', Timestamp.fromDate(tomorrow)),
    orderBy('fechaHora', 'desc')
  )

  if (clienteId) {
    q = query(q, where('clienteId', '==', clienteId))
  }

  const snapshot = await getDocs(q)

  const data: Entity<Despacho>[] = []
  for (const docSnap of snapshot.docs) {
    const docData = docSnap.data() as FirestoreDocData
    const parsed = despachoFirestoreSchema.safeParse(docData)
    if (!parsed.success) continue
    data.push({
      id: docSnap.id,
      ...parsed.data,
      fechaHora: docData.fechaHora as Despacho['fechaHora'],
      iniciadoAt: (docData.iniciadoAt ?? null) as Despacho['iniciadoAt'],
      completadoAt: (docData.completadoAt ?? null) as Despacho['completadoAt'],
      canceladoAt: (docData.canceladoAt ?? null) as Despacho['canceladoAt'],
      createdAt: docData.createdAt,
      updatedAt: docData.updatedAt,
    })
  }

  return data
}
