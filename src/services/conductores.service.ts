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
  Timestamp,
} from 'firebase/firestore'
import { db } from '@/config/firebase'
import { conductorFirestoreSchema } from '@/schemas/conductor.schema'
import type { Conductor, CreateConductorData } from '@/types/conductor'
import type { Entity, PaginatedQuery, PaginatedResult, FirestoreDocData } from '@/types/firestore'

const COLLECTION = 'conductores'

/**
 * Obtiene un conductor por ID
 */
export async function getConductor(conductorId: string): Promise<Entity<Conductor> | null> {
  const docRef = doc(db, COLLECTION, conductorId)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) {
    return null
  }

  const data = docSnap.data() as FirestoreDocData
  const parsed = conductorFirestoreSchema.safeParse(data)

  if (!parsed.success) {
    console.error('Error validando conductor:', parsed.error)
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
 * Obtiene un conductor por cédula
 */
export async function getConductorByCedula(cedula: string): Promise<Entity<Conductor> | null> {
  const q = query(
    collection(db, COLLECTION),
    where('cedula', '==', cedula),
    where('deleted', '!=', true),
    limit(1)
  )

  const snapshot = await getDocs(q)
  if (snapshot.empty) return null

  const docSnap = snapshot.docs[0]
  if (!docSnap) return null

  const data = docSnap.data() as FirestoreDocData
  const parsed = conductorFirestoreSchema.safeParse(data)

  if (!parsed.success) return null

  return {
    id: docSnap.id,
    ...parsed.data,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  }
}

/**
 * Lista conductores con paginación y filtros
 */
export async function listConductores(
  options: PaginatedQuery & {
    sucursalId?: string
    propietarioId?: string
    activo?: boolean
  } = {}
): Promise<PaginatedResult<Entity<Conductor>>> {
  const {
    limit: pageLimit = 20,
    startAfter: startAfterId,
    sucursalId,
    propietarioId,
    activo,
  } = options

  let q = query(
    collection(db, COLLECTION),
    where('deleted', '!=', true),
    orderBy('nombre'),
    limit(pageLimit + 1)
  )

  if (sucursalId) {
    q = query(q, where('sucursalId', '==', sucursalId))
  }

  if (propietarioId) {
    q = query(q, where('propietarioId', '==', propietarioId))
  }

  if (activo !== undefined) {
    q = query(q, where('activo', '==', activo))
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

  const data: Entity<Conductor>[] = docs
    .map((docSnap) => {
      const docData = docSnap.data() as FirestoreDocData
      const parsed = conductorFirestoreSchema.safeParse(docData)
      if (!parsed.success) return null
      return {
        id: docSnap.id,
        ...parsed.data,
        createdAt: docData.createdAt,
        updatedAt: docData.updatedAt,
      }
    })
    .filter((item): item is Entity<Conductor> => item !== null)

  return {
    data,
    hasMore,
    lastDoc: docs[docs.length - 1]?.id,
  }
}

/**
 * Lista conductores con licencia próxima a vencer
 */
export async function listConductoresLicenciasPorVencer(
  diasAnticipacion: number = 30
): Promise<Entity<Conductor>[]> {
  const fechaLimite = new Date()
  fechaLimite.setDate(fechaLimite.getDate() + diasAnticipacion)

  const q = query(
    collection(db, COLLECTION),
    where('deleted', '!=', true),
    where('activo', '==', true),
    where('fechaVencimientoLicencia', '<=', Timestamp.fromDate(fechaLimite)),
    orderBy('fechaVencimientoLicencia')
  )

  const snapshot = await getDocs(q)

  const conductores: Entity<Conductor>[] = snapshot.docs
    .map((docSnap) => {
      const data = docSnap.data() as FirestoreDocData
      const parsed = conductorFirestoreSchema.safeParse(data)
      if (!parsed.success) return null
      return {
        id: docSnap.id,
        ...parsed.data,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      }
    })
    .filter((item): item is Entity<Conductor> => item !== null)
  return conductores
}

/**
 * Crea un nuevo conductor
 */
export async function createConductor(
  data: CreateConductorData,
  createdBy: string
): Promise<string> {
  // Verificar que la cédula no exista
  const existing = await getConductorByCedula(data.cedula)
  if (existing) {
    throw new Error('Ya existe un conductor con esta cédula')
  }

  const docRef = await addDoc(collection(db, COLLECTION), {
    nombre: data.nombre,
    cedula: data.cedula,
    licencia: data.licencia,
    fechaVencimientoLicencia: Timestamp.fromDate(data.fechaVencimientoLicencia),
    sucursalId: data.sucursalId,
    propietarioId: data.propietarioId ?? null,
    activo: true,
    foto: null,
    deleted: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy,
  })

  return docRef.id
}

/**
 * Actualiza un conductor
 */
export async function updateConductor(
  conductorId: string,
  data: Partial<Conductor> & { fechaVencimientoLicencia?: Date }
): Promise<void> {
  const docRef = doc(db, COLLECTION, conductorId)

  const updateData: Record<string, unknown> = {
    ...data,
    updatedAt: serverTimestamp(),
  }

  // Convertir fecha a Timestamp si se proporciona
  if (data.fechaVencimientoLicencia instanceof Date) {
    updateData.fechaVencimientoLicencia = Timestamp.fromDate(data.fechaVencimientoLicencia)
  }

  await updateDoc(docRef, updateData)
}

/**
 * Soft delete de conductor
 */
export async function deleteConductor(conductorId: string): Promise<void> {
  const docRef = doc(db, COLLECTION, conductorId)
  await updateDoc(docRef, {
    deleted: true,
    activo: false,
    updatedAt: serverTimestamp(),
  })
}

/**
 * Actualiza foto del conductor
 */
export async function updateConductorFoto(
  conductorId: string,
  fotoUrl: string | null
): Promise<void> {
  const docRef = doc(db, COLLECTION, conductorId)
  await updateDoc(docRef, {
    foto: fotoUrl,
    updatedAt: serverTimestamp(),
  })
}

/**
 * Asigna conductor a un bus
 */
export async function asignarConductorABus(conductorId: string, busId: string): Promise<void> {
  // Actualizar bus con el conductor asignado
  const busRef = doc(db, 'buses', busId)
  await updateDoc(busRef, {
    conductorAsignadoId: conductorId,
    updatedAt: serverTimestamp(),
  })
}

/**
 * Desasigna conductor de un bus
 */
export async function desasignarConductorDeBus(busId: string): Promise<void> {
  const busRef = doc(db, 'buses', busId)
  await updateDoc(busRef, {
    conductorAsignadoId: null,
    updatedAt: serverTimestamp(),
  })
}
