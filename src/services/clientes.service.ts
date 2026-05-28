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
} from 'firebase/firestore'
import { db } from '@/config/firebase'
import { clienteFirestoreSchema } from '@/schemas/cliente.schema'
import type { Cliente, Sucursal, Propietario } from '@/types/cliente'
import type { Entity, PaginatedQuery, PaginatedResult, FirestoreDocData } from '@/types/firestore'

const COLLECTION = 'clientes'

/**
 * Obtiene un cliente por ID
 */
export async function getCliente(clienteId: string): Promise<Entity<Cliente> | null> {
  const docRef = doc(db, COLLECTION, clienteId)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) {
    return null
  }

  const data = docSnap.data() as FirestoreDocData
  const parsed = clienteFirestoreSchema.safeParse(data)

  if (!parsed.success) {
    console.error('Error validando cliente:', parsed.error)
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
 * Lista clientes con paginación
 */
export async function listClientes(
  options: PaginatedQuery = {}
): Promise<PaginatedResult<Entity<Cliente>>> {
  const {
    limit: pageLimit = 20,
    startAfter: startAfterId,
    orderBy: orderField = 'nombre',
  } = options

  // Query without deleted filter - we filter in JavaScript to handle documents
  // that might not have the 'activo' or 'deleted' fields set
  let q = query(collection(db, COLLECTION), orderBy(orderField), limit(pageLimit + 1))

  if (startAfterId) {
    const startDoc = await getDoc(doc(db, COLLECTION, startAfterId))
    if (startDoc.exists()) {
      q = query(q, startAfter(startDoc))
    }
  }

  const snapshot = await getDocs(q)
  const docs = snapshot.docs.slice(0, pageLimit)
  const hasMore = snapshot.docs.length > pageLimit

  const data: Entity<Cliente>[] = []
  for (const docSnap of docs) {
    const docData = docSnap.data() as FirestoreDocData
    const parsed = clienteFirestoreSchema.safeParse(docData)
    if (!parsed.success) {
      console.warn('Failed to parse cliente:', docSnap.id, parsed.error.errors)
      continue
    }
    const item: Entity<Cliente> = {
      id: docSnap.id,
      ...parsed.data,
      createdAt: docData.createdAt,
      updatedAt: docData.updatedAt,
    }
    // Filter out deleted/inactive clients
    if (item.deleted) continue
    if (!item.activo) continue
    data.push(item)
  }

  return {
    data,
    hasMore,
    lastDoc: docs[docs.length - 1]?.id,
  }
}

/**
 * Crea un nuevo cliente
 */
export async function createCliente(
  data: Omit<Cliente, 'createdAt' | 'updatedAt' | 'createdBy' | 'activo'>,
  createdBy: string
): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTION), {
    ...data,
    activo: true,
    deleted: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy,
  })
  return docRef.id
}

/**
 * Actualiza un cliente
 */
export async function updateCliente(clienteId: string, data: Partial<Cliente>): Promise<void> {
  const docRef = doc(db, COLLECTION, clienteId)
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

/**
 * Verifica si un cliente puede ser eliminado (no tiene buses asociados)
 */
export async function canDeleteCliente(
  clienteId: string
): Promise<{ canDelete: boolean; reason?: string }> {
  // Verificar si tiene buses activos
  const busesQuery = query(
    collection(db, 'buses'),
    where('clienteId', '==', clienteId),
    where('activo', '==', true),
    limit(1)
  )
  const busesSnapshot = await getDocs(busesQuery)

  if (!busesSnapshot.empty) {
    return {
      canDelete: false,
      reason: 'El cliente tiene buses asociados. Elimina o reasigna los buses primero.',
    }
  }

  return { canDelete: true }
}

/**
 * Soft delete de cliente (con validación de dependencias)
 */
export async function deleteCliente(clienteId: string): Promise<void> {
  // Verificar dependencias
  const { canDelete, reason } = await canDeleteCliente(clienteId)
  if (!canDelete) {
    throw new Error(reason)
  }

  const docRef = doc(db, COLLECTION, clienteId)
  await updateDoc(docRef, {
    deleted: true,
    activo: false,
    updatedAt: serverTimestamp(),
  })
}

// ============ SUCURSALES ============

/**
 * Lista sucursales de un cliente
 */
export async function listSucursales(clienteId: string): Promise<Entity<Sucursal>[]> {
  const q = query(
    collection(db, COLLECTION, clienteId, 'sucursales'),
    where('activa', '==', true),
    orderBy('nombre')
  )

  const snapshot = await getDocs(q)
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  })) as Entity<Sucursal>[]
}

/**
 * Crea una sucursal
 */
export async function createSucursal(
  clienteId: string,
  data: Omit<Sucursal, 'createdAt' | 'updatedAt' | 'createdBy' | 'activa'>,
  createdBy: string
): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTION, clienteId, 'sucursales'), {
    ...data,
    clienteId,
    activa: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy,
  })
  return docRef.id
}

/**
 * Actualiza una sucursal
 */
export async function updateSucursal(
  clienteId: string,
  sucursalId: string,
  data: Partial<Sucursal>
): Promise<void> {
  const docRef = doc(db, COLLECTION, clienteId, 'sucursales', sucursalId)
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

/**
 * Verifica si una sucursal puede ser eliminada
 */
export async function canDeleteSucursal(
  clienteId: string,
  sucursalId: string
): Promise<{ canDelete: boolean; reason?: string }> {
  // Verificar si tiene buses activos
  const busesQuery = query(
    collection(db, 'buses'),
    where('clienteId', '==', clienteId),
    where('sucursalId', '==', sucursalId),
    where('activo', '==', true),
    limit(1)
  )
  const busesSnapshot = await getDocs(busesQuery)

  if (!busesSnapshot.empty) {
    return {
      canDelete: false,
      reason: 'La sucursal tiene buses asociados. Elimina o reasigna los buses primero.',
    }
  }

  return { canDelete: true }
}

/**
 * Soft delete de sucursal
 */
export async function deleteSucursal(clienteId: string, sucursalId: string): Promise<void> {
  const { canDelete, reason } = await canDeleteSucursal(clienteId, sucursalId)
  if (!canDelete) {
    throw new Error(reason)
  }

  const docRef = doc(db, COLLECTION, clienteId, 'sucursales', sucursalId)
  await updateDoc(docRef, {
    activa: false,
    deleted: true,
    updatedAt: serverTimestamp(),
  })
}

// ============ PROPIETARIOS ============

/**
 * Lista propietarios de un cliente
 */
export async function listPropietarios(
  clienteId: string,
  sucursalId?: string
): Promise<Entity<Propietario>[]> {
  let q = query(
    collection(db, COLLECTION, clienteId, 'propietarios'),
    where('activo', '==', true),
    orderBy('nombre')
  )

  if (sucursalId) {
    q = query(q, where('sucursalId', '==', sucursalId))
  }

  const snapshot = await getDocs(q)
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  })) as Entity<Propietario>[]
}

/**
 * Crea un propietario
 */
export async function createPropietario(
  clienteId: string,
  data: Omit<Propietario, 'createdAt' | 'updatedAt' | 'createdBy' | 'activo'>,
  createdBy: string
): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTION, clienteId, 'propietarios'), {
    ...data,
    activo: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy,
  })
  return docRef.id
}

/**
 * Actualiza un propietario
 */
export async function updatePropietario(
  clienteId: string,
  propietarioId: string,
  data: Partial<Propietario>
): Promise<void> {
  const docRef = doc(db, COLLECTION, clienteId, 'propietarios', propietarioId)
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

/**
 * Verifica si un propietario puede ser eliminado
 */
export async function canDeletePropietario(
  clienteId: string,
  propietarioId: string
): Promise<{ canDelete: boolean; reason?: string }> {
  // Verificar si tiene buses activos
  const busesQuery = query(
    collection(db, 'buses'),
    where('clienteId', '==', clienteId),
    where('propietarioId', '==', propietarioId),
    where('activo', '==', true),
    limit(1)
  )
  const busesSnapshot = await getDocs(busesQuery)

  if (!busesSnapshot.empty) {
    return {
      canDelete: false,
      reason: 'El propietario tiene buses asociados. Elimina o reasigna los buses primero.',
    }
  }

  return { canDelete: true }
}

/**
 * Soft delete de propietario
 */
export async function deletePropietario(clienteId: string, propietarioId: string): Promise<void> {
  const { canDelete, reason } = await canDeletePropietario(clienteId, propietarioId)
  if (!canDelete) {
    throw new Error(reason)
  }

  const docRef = doc(db, COLLECTION, clienteId, 'propietarios', propietarioId)
  await updateDoc(docRef, {
    activo: false,
    deleted: true,
    updatedAt: serverTimestamp(),
  })
}
