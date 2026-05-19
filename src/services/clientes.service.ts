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

  let q = query(
    collection(db, COLLECTION),
    where('deleted', '!=', true),
    orderBy(orderField),
    limit(pageLimit + 1)
  )

  if (startAfterId) {
    const startDoc = await getDoc(doc(db, COLLECTION, startAfterId))
    if (startDoc.exists()) {
      q = query(q, startAfter(startDoc))
    }
  }

  const snapshot = await getDocs(q)
  const docs = snapshot.docs.slice(0, pageLimit)
  const hasMore = snapshot.docs.length > pageLimit

  const data: Entity<Cliente>[] = docs
    .map((docSnap) => {
      const docData = docSnap.data() as FirestoreDocData
      const parsed = clienteFirestoreSchema.safeParse(docData)
      if (!parsed.success) return null
      return {
        id: docSnap.id,
        ...parsed.data,
        createdAt: docData.createdAt,
        updatedAt: docData.updatedAt,
      }
    })
    .filter((item): item is Entity<Cliente> => item !== null)

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
 * Soft delete de cliente
 */
export async function deleteCliente(clienteId: string): Promise<void> {
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
    activa: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy,
  })
  return docRef.id
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
