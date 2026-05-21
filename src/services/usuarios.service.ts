import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/config/firebase'
import { usuarioFirestoreSchema } from '@/schemas/auth.schema'
import type { Usuario, CreateUsuarioData, UpdateUsuarioData } from '@/types/auth'
import type { Entity, PaginatedQuery, PaginatedResult, FirestoreDocData } from '@/types/firestore'
import type { Role } from '@/config/constants'

const COLLECTION = 'usuarios'

/**
 * Obtiene un usuario por UID
 */
export async function getUsuarioById(uid: string): Promise<Entity<Usuario> | null> {
  const docRef = doc(db, COLLECTION, uid)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) {
    return null
  }

  const data = docSnap.data() as FirestoreDocData
  const parsed = usuarioFirestoreSchema.safeParse(data)

  if (!parsed.success) {
    console.error('Error validando usuario:', parsed.error)
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
 * Obtiene un usuario por email
 */
export async function getUsuarioByEmail(email: string): Promise<Entity<Usuario> | null> {
  const q = query(
    collection(db, COLLECTION),
    where('email', '==', email.toLowerCase()),
    where('activo', '==', true),
    limit(1)
  )

  const snapshot = await getDocs(q)
  if (snapshot.empty) return null

  const docSnap = snapshot.docs[0]
  if (!docSnap) return null

  const data = docSnap.data() as FirestoreDocData
  const parsed = usuarioFirestoreSchema.safeParse(data)

  if (!parsed.success) return null

  return {
    id: docSnap.id,
    ...parsed.data,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  }
}

/**
 * Lista usuarios con paginación y filtros
 */
export async function listUsuarios(
  options: PaginatedQuery & {
    clienteId?: string
    rol?: Role
    activo?: boolean
  } = {}
): Promise<PaginatedResult<Entity<Usuario>>> {
  const { limit: pageLimit = 20, startAfter: startAfterId, clienteId, rol, activo } = options

  // Use provided activo filter, default to true if not specified
  const activoFilter = activo ?? true

  let q = query(
    collection(db, COLLECTION),
    where('activo', '==', activoFilter),
    orderBy('nombre'),
    limit(pageLimit + 1)
  )

  if (clienteId) {
    q = query(q, where('clienteId', '==', clienteId))
  }

  if (rol) {
    q = query(q, where('rol', '==', rol))
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

  const data = docs
    .map((docSnap) => {
      const docData = docSnap.data() as FirestoreDocData
      const parsed = usuarioFirestoreSchema.safeParse(docData)
      if (!parsed.success) return null
      return {
        id: docSnap.id,
        ...parsed.data,
        createdAt: docData.createdAt,
        updatedAt: docData.updatedAt,
      }
    })
    .filter((item): item is Entity<Usuario> => item !== null)

  return {
    data,
    hasMore,
    lastDoc: docs[docs.length - 1]?.id,
  }
}

/**
 * Crea un nuevo usuario en Firestore
 * Nota: El usuario ya debe existir en Firebase Auth (creado via Admin SDK o Cloud Functions)
 */
export async function createUsuario(
  uid: string,
  data: CreateUsuarioData,
  createdBy: string
): Promise<void> {
  const docRef = doc(db, COLLECTION, uid)

  await setDoc(docRef, {
    uid,
    email: data.email.toLowerCase(),
    nombre: data.nombre,
    rol: data.rol,
    clienteId: data.clienteId ?? null,
    sucursalIds: data.sucursalIds ?? null,
    propietarioId: data.propietarioId ?? null,
    activo: true,
    deleted: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy,
  })
}

/**
 * Actualiza un usuario
 */
export async function updateUsuario(uid: string, data: UpdateUsuarioData): Promise<void> {
  const docRef = doc(db, COLLECTION, uid)

  const updateData: Record<string, unknown> = {
    ...data,
    updatedAt: serverTimestamp(),
  }

  await updateDoc(docRef, updateData)
}

/**
 * Soft delete de usuario
 */
export async function deleteUsuario(uid: string): Promise<void> {
  const docRef = doc(db, COLLECTION, uid)
  await updateDoc(docRef, {
    deleted: true,
    activo: false,
    updatedAt: serverTimestamp(),
  })
}

/**
 * Activa o desactiva un usuario
 */
export async function toggleUsuarioActivo(uid: string, activo: boolean): Promise<void> {
  const docRef = doc(db, COLLECTION, uid)
  await updateDoc(docRef, {
    activo,
    updatedAt: serverTimestamp(),
  })
}

/**
 * Actualiza las sucursales asignadas a un usuario
 */
export async function updateUsuarioSucursales(uid: string, sucursalIds: string[]): Promise<void> {
  const docRef = doc(db, COLLECTION, uid)
  await updateDoc(docRef, {
    sucursalIds,
    updatedAt: serverTimestamp(),
  })
}

/**
 * Lista usuarios de una sucursal específica
 */
export async function listUsuariosBySucursal(sucursalId: string): Promise<Entity<Usuario>[]> {
  const q = query(
    collection(db, COLLECTION),
    where('activo', '==', true),
    where('activo', '==', true),
    where('sucursalIds', 'array-contains', sucursalId),
    orderBy('nombre')
  )

  const snapshot = await getDocs(q)

  const usuarios = snapshot.docs
    .map((docSnap) => {
      const data = docSnap.data() as FirestoreDocData
      const parsed = usuarioFirestoreSchema.safeParse(data)
      if (!parsed.success) return null
      return {
        id: docSnap.id,
        ...parsed.data,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      }
    })
    .filter((item): item is Entity<Usuario> => item !== null)
  return usuarios
}

/**
 * Lista usuarios por rol
 */
export async function listUsuariosByRol(rol: Role): Promise<Entity<Usuario>[]> {
  const q = query(
    collection(db, COLLECTION),
    where('activo', '==', true),
    where('activo', '==', true),
    where('rol', '==', rol),
    orderBy('nombre')
  )

  const snapshot = await getDocs(q)

  const usuarios = snapshot.docs
    .map((docSnap) => {
      const data = docSnap.data() as FirestoreDocData
      const parsed = usuarioFirestoreSchema.safeParse(data)
      if (!parsed.success) return null
      return {
        id: docSnap.id,
        ...parsed.data,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      }
    })
    .filter((item): item is Entity<Usuario> => item !== null)
  return usuarios
}
