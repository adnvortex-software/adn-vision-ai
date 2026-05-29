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
import { eventoFirestoreSchema, novedadCatalogoSchema } from '@/schemas/novedad.schema'
import type {
  NovedadCatalogo,
  NovedadConfig,
  Evento,
  CreateNovedadConfigData,
  Conteo,
  ConteoDiario,
} from '@/types/novedad'
import type { Entity, PaginatedQuery, PaginatedResult, FirestoreDocData } from '@/types/firestore'
import type { EventState } from '@/config/constants'

const BUSES_COLLECTION = 'buses'
const CAMARAS_SUBCOLLECTION = 'camaras'
const NOVEDADES_CONFIG_SUBCOLLECTION = 'novedadesConfig'
const EVENTOS_COLLECTION = 'eventos'
const CONTEOS_COLLECTION = 'conteos'
const CONTEOS_DIARIOS_COLLECTION = 'conteosDiarios'
const CATALOGO_COLLECTION = 'novedadesCatalogo'

// ============ CATÁLOGO DE NOVEDADES ============

/**
 * Lista todas las novedades del catálogo
 */
export async function listNovedadesCatalogo(): Promise<Entity<NovedadCatalogo>[]> {
  const q = query(
    collection(db, CATALOGO_COLLECTION),
    where('activa', '==', true),
    orderBy('nombre')
  )

  const snapshot = await getDocs(q)
  const catalogo: Entity<NovedadCatalogo>[] = []

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data() as FirestoreDocData
    const parsed = novedadCatalogoSchema.safeParse(data)
    if (!parsed.success) continue
    catalogo.push({
      id: docSnap.id,
      ...parsed.data,
      createdBy: typeof data.createdBy === 'string' ? data.createdBy : 'system',
      deleted: typeof data.deleted === 'boolean' ? data.deleted : false,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    })
  }

  return catalogo
}

/**
 * Obtiene una novedad del catálogo por código
 */
export async function getNovedadCatalogoByCodigo(
  codigo: string
): Promise<Entity<NovedadCatalogo> | null> {
  const q = query(collection(db, CATALOGO_COLLECTION), where('codigo', '==', codigo), limit(1))

  const snapshot = await getDocs(q)
  if (snapshot.empty) return null

  const docSnap = snapshot.docs[0]
  if (!docSnap) return null

  const data = docSnap.data() as FirestoreDocData
  const parsed = novedadCatalogoSchema.safeParse(data)

  if (!parsed.success) return null

  return {
    id: docSnap.id,
    ...parsed.data,
    createdBy: typeof data.createdBy === 'string' ? data.createdBy : 'system',
    deleted: typeof data.deleted === 'boolean' ? data.deleted : false,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  }
}

// ============ CONFIGURACIÓN DE NOVEDADES ============

/**
 * Lista configuraciones de novedades de una cámara
 */
export async function listNovedadesConfig(
  busId: string,
  camaraId: string
): Promise<Entity<NovedadConfig>[]> {
  const q = query(
    collection(
      db,
      BUSES_COLLECTION,
      busId,
      CAMARAS_SUBCOLLECTION,
      camaraId,
      NOVEDADES_CONFIG_SUBCOLLECTION
    ),
    where('activa', '==', true),
    orderBy('tipoNovedad')
  )

  const snapshot = await getDocs(q)

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  })) as Entity<NovedadConfig>[]
}

/**
 * Crea configuración de novedad para una cámara
 */
export async function createNovedadConfig(
  busId: string,
  camaraId: string,
  data: CreateNovedadConfigData,
  createdBy: string
): Promise<string> {
  // Verificar que no exista ya esta configuración
  const existing = await listNovedadesConfig(busId, camaraId)
  const exists = existing.some((n) => n.tipoNovedad === data.tipoNovedad)
  if (exists) {
    throw new Error('Esta novedad ya está configurada para esta cámara')
  }

  const docRef = await addDoc(
    collection(
      db,
      BUSES_COLLECTION,
      busId,
      CAMARAS_SUBCOLLECTION,
      camaraId,
      NOVEDADES_CONFIG_SUBCOLLECTION
    ),
    {
      tipoNovedad: data.tipoNovedad,
      params: data.params,
      activa: true,
      deleted: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy,
    }
  )

  return docRef.id
}

/**
 * Actualiza configuración de novedad
 */
export async function updateNovedadConfig(
  busId: string,
  camaraId: string,
  configId: string,
  data: Partial<NovedadConfig>
): Promise<void> {
  const docRef = doc(
    db,
    BUSES_COLLECTION,
    busId,
    CAMARAS_SUBCOLLECTION,
    camaraId,
    NOVEDADES_CONFIG_SUBCOLLECTION,
    configId
  )

  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

/**
 * Elimina (soft delete) configuración de novedad
 */
export async function deleteNovedadConfig(
  busId: string,
  camaraId: string,
  configId: string
): Promise<void> {
  const docRef = doc(
    db,
    BUSES_COLLECTION,
    busId,
    CAMARAS_SUBCOLLECTION,
    camaraId,
    NOVEDADES_CONFIG_SUBCOLLECTION,
    configId
  )

  await updateDoc(docRef, {
    deleted: true,
    activa: false,
    updatedAt: serverTimestamp(),
  })
}

// ============ EVENTOS ============

/**
 * Lista eventos con paginación y filtros
 */
export async function listEventos(
  options: PaginatedQuery & {
    clienteId?: string
    busId?: string
    tipoNovedad?: string
    estado?: EventState
    fechaDesde?: Date
    fechaHasta?: Date
  } = {}
): Promise<PaginatedResult<Entity<Evento>>> {
  const {
    limit: pageLimit = 20,
    startAfter: startAfterId,
    clienteId,
    busId,
    tipoNovedad,
    estado,
    fechaDesde,
    fechaHasta,
  } = options

  // Build query - avoid composite index by not using orderBy with date filters
  // We'll sort in JavaScript after fetching
  const hasDateFilters = fechaDesde !== undefined || fechaHasta !== undefined

  let q = hasDateFilters
    ? query(
        collection(db, EVENTOS_COLLECTION),
        limit(pageLimit * 3) // Fetch more to filter by date in JS
      )
    : query(collection(db, EVENTOS_COLLECTION), orderBy('timestamp', 'desc'), limit(pageLimit + 1))

  if (clienteId) {
    q = query(q, where('clienteId', '==', clienteId))
  }

  if (busId) {
    q = query(q, where('busId', '==', busId))
  }

  if (tipoNovedad) {
    q = query(q, where('tipoNovedad', '==', tipoNovedad))
  }

  if (estado) {
    q = query(q, where('estado', '==', estado))
  }

  // Only apply date filters in Firestore if no other filters that would require composite index
  // Otherwise filter in JavaScript
  if (!hasDateFilters && startAfterId) {
    const startDoc = await getDoc(doc(db, EVENTOS_COLLECTION, startAfterId))
    if (startDoc.exists()) {
      q = query(q, startAfter(startDoc))
    }
  }

  const snapshot = await getDocs(q)

  const data: Entity<Evento>[] = []
  for (const docSnap of snapshot.docs) {
    const docData = docSnap.data() as FirestoreDocData
    const parsed = eventoFirestoreSchema.safeParse(docData)
    if (!parsed.success) continue

    const evento: Entity<Evento> = {
      id: docSnap.id,
      ...parsed.data,
      timestamp: (docData as unknown as { timestamp: unknown }).timestamp as Evento['timestamp'],
      revisadoAt: ((docData as { revisadoAt?: unknown }).revisadoAt ??
        null) as Evento['revisadoAt'],
      createdAt: docData.createdAt,
      updatedAt: docData.updatedAt,
    }

    // Filter by date in JavaScript if needed
    if (hasDateFilters && 'toDate' in evento.timestamp) {
      const eventDate = evento.timestamp.toDate()
      if (fechaDesde && eventDate < fechaDesde) continue
      if (fechaHasta && eventDate > fechaHasta) continue
    }

    data.push(evento)
  }

  // Sort by timestamp descending
  data.sort((a, b) => {
    const aTime = 'toMillis' in a.timestamp ? a.timestamp.toMillis() : 0
    const bTime = 'toMillis' in b.timestamp ? b.timestamp.toMillis() : 0
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
 * Obtiene un evento por ID
 */
export async function getEvento(eventoId: string): Promise<Entity<Evento> | null> {
  const docRef = doc(db, EVENTOS_COLLECTION, eventoId)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) {
    return null
  }

  const data = docSnap.data() as FirestoreDocData
  const parsed = eventoFirestoreSchema.safeParse(data)

  if (!parsed.success) {
    console.error('Error validando evento:', parsed.error)
    return null
  }

  return {
    id: docSnap.id,
    ...parsed.data,
    timestamp: (data as unknown as { timestamp: unknown }).timestamp as Evento['timestamp'],
    revisadoAt: ((data as { revisadoAt?: unknown }).revisadoAt ?? null) as Evento['revisadoAt'],
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  }
}

/**
 * Actualiza estado de un evento
 */
export async function updateEventoEstado(
  eventoId: string,
  estado: EventState,
  revisadoPor: string,
  notas?: string
): Promise<void> {
  const docRef = doc(db, EVENTOS_COLLECTION, eventoId)

  await updateDoc(docRef, {
    estado,
    revisadoPor,
    revisadoAt: serverTimestamp(),
    notas: notas ?? null,
    updatedAt: serverTimestamp(),
  })
}

/**
 * Suscribe a eventos en tiempo real
 */
export function subscribeToEventos(
  callback: (eventos: Entity<Evento>[]) => void,
  options: {
    clienteId?: string
    busId?: string
    limit?: number
  } = {}
): Unsubscribe {
  const { clienteId, busId, limit: eventLimit = 50 } = options

  let q = query(collection(db, EVENTOS_COLLECTION), orderBy('timestamp', 'desc'), limit(eventLimit))

  if (clienteId) {
    q = query(q, where('clienteId', '==', clienteId))
  }

  if (busId) {
    q = query(q, where('busId', '==', busId))
  }

  return onSnapshot(q, (snapshot) => {
    const eventos: Entity<Evento>[] = []
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data() as FirestoreDocData
      const parsed = eventoFirestoreSchema.safeParse(data)
      if (!parsed.success) continue
      eventos.push({
        id: docSnap.id,
        ...parsed.data,
        timestamp: (data as unknown as { timestamp: unknown }).timestamp as Evento['timestamp'],
        revisadoAt: ((data as unknown as { revisadoAt?: unknown }).revisadoAt ??
          null) as Evento['revisadoAt'],
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      })
    }
    callback(eventos)
  })
}

// ============ CONTEOS ============

/**
 * Obtiene conteo actual de un bus
 */
export async function getConteoActual(busId: string): Promise<Conteo | null> {
  const docRef = doc(db, CONTEOS_COLLECTION, busId)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) {
    return null
  }

  return docSnap.data() as Conteo
}

/**
 * Lista todos los conteos actuales (tiempo real)
 */
export async function listAllConteos(
  options: {
    clienteId?: string | null
    limit?: number
  } = {}
): Promise<Conteo[]> {
  try {
    const q = query(collection(db, CONTEOS_COLLECTION), limit(options.limit ?? 500))

    const snapshot = await getDocs(q)
    let results = snapshot.docs.map((docSnap) => docSnap.data() as Conteo)

    // Filter by clienteId in memory
    if (options.clienteId) {
      results = results.filter((c) => c.clienteId === options.clienteId)
    }

    return results
  } catch (error) {
    console.error('[listAllConteos] Error:', error)
    return []
  }
}

/**
 * Suscribe a conteo en tiempo real de un bus
 */
export function subscribeToConteo(
  busId: string,
  callback: (conteo: Conteo | null) => void
): Unsubscribe {
  const docRef = doc(db, CONTEOS_COLLECTION, busId)

  return onSnapshot(docRef, (docSnap) => {
    if (!docSnap.exists()) {
      callback(null)
      return
    }
    callback(docSnap.data() as Conteo)
  })
}

/**
 * Obtiene conteo diario histórico
 */
export async function getConteoDiario(busId: string, fecha: string): Promise<ConteoDiario | null> {
  const docId = `${busId}_${fecha}`
  const docRef = doc(db, CONTEOS_DIARIOS_COLLECTION, docId)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) {
    return null
  }

  return docSnap.data() as ConteoDiario
}

/**
 * Lista conteos diarios de un bus en un rango de fechas
 */
export async function listConteosDiarios(
  busId: string,
  fechaDesde: string,
  fechaHasta: string
): Promise<ConteoDiario[]> {
  const q = query(
    collection(db, CONTEOS_DIARIOS_COLLECTION),
    where('busId', '==', busId),
    where('fecha', '>=', fechaDesde),
    where('fecha', '<=', fechaHasta),
    orderBy('fecha')
  )

  const snapshot = await getDocs(q)

  return snapshot.docs.map((docSnap) => docSnap.data() as ConteoDiario)
}

/**
 * Lista todos los conteos diarios en un rango de fechas
 * Opcionalmente filtra por clienteId
 */
export async function listAllConteosDiarios(options: {
  fechaDesde: string
  fechaHasta: string
  clienteId?: string | null
  limit?: number
}): Promise<ConteoDiario[]> {
  try {
    let q = query(
      collection(db, CONTEOS_DIARIOS_COLLECTION),
      where('fecha', '>=', options.fechaDesde),
      where('fecha', '<=', options.fechaHasta),
      orderBy('fecha')
    )

    if (options.limit) {
      q = query(q, limit(options.limit))
    }

    const snapshot = await getDocs(q)
    let results = snapshot.docs.map((docSnap) => docSnap.data() as ConteoDiario)

    // Filter by clienteId in memory (to avoid composite index)
    if (options.clienteId) {
      results = results.filter((c) => c.clienteId === options.clienteId)
    }

    return results
  } catch (error) {
    console.error('[listAllConteosDiarios] Error:', error)
    return []
  }
}
