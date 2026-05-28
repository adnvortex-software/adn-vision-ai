import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
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
  const { limit: pageLimit = 20, clienteId, rol, activo } = options

  // Simple query - filter and sort in JavaScript to avoid composite index requirements
  const q = query(collection(db, COLLECTION))

  const snapshot = await getDocs(q)

  const usuarios: Entity<Usuario>[] = []

  for (const docSnap of snapshot.docs) {
    const docData = docSnap.data() as FirestoreDocData
    const parsed = usuarioFirestoreSchema.safeParse(docData)
    if (!parsed.success) {
      console.warn('Failed to parse usuario:', docSnap.id, parsed.error.errors)
      continue
    }
    const item: Entity<Usuario> = {
      id: docSnap.id,
      ...parsed.data,
      createdAt: docData.createdAt,
      updatedAt: docData.updatedAt,
    }
    // Filter by activo (default to showing active users)
    const activoFilter = activo ?? true
    if (item.activo !== activoFilter) continue
    // Filter by clienteId if provided
    if (clienteId && item.clienteId !== clienteId) continue
    // Filter by rol if provided
    if (rol && item.rol !== rol) continue
    // Exclude deleted users
    if (item.deleted) continue
    usuarios.push(item)
  }

  usuarios.sort((a, b) => a.nombre.localeCompare(b.nombre))
  let data = usuarios

  const hasMore = data.length > pageLimit
  data = data.slice(0, pageLimit)

  return {
    data,
    hasMore,
    lastDoc: data[data.length - 1]?.id,
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
    where('sucursalIds', 'array-contains', sucursalId),
    orderBy('nombre')
  )

  const snapshot = await getDocs(q)
  const usuarios: Entity<Usuario>[] = []

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data() as FirestoreDocData
    const parsed = usuarioFirestoreSchema.safeParse(data)
    if (!parsed.success) continue
    usuarios.push({
      id: docSnap.id,
      ...parsed.data,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    })
  }

  return usuarios
}

/**
 * Lista usuarios por rol
 */
export async function listUsuariosByRol(rol: Role): Promise<Entity<Usuario>[]> {
  const q = query(
    collection(db, COLLECTION),
    where('activo', '==', true),
    where('rol', '==', rol),
    orderBy('nombre')
  )

  const snapshot = await getDocs(q)
  const usuarios: Entity<Usuario>[] = []

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data() as FirestoreDocData
    const parsed = usuarioFirestoreSchema.safeParse(data)
    if (!parsed.success) continue
    usuarios.push({
      id: docSnap.id,
      ...parsed.data,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    })
  }

  return usuarios
}

/**
 * Crea una invitacion de usuario
 * Esto crea un documento en la coleccion 'invitaciones' que sera procesado
 * por una Cloud Function para crear el usuario en Firebase Auth
 */
export async function createUsuarioInvitation(
  data: CreateUsuarioData,
  createdBy: string
): Promise<string> {
  // Verificar si ya existe un usuario con este email
  const existingUser = await getUsuarioByEmail(data.email)
  if (existingUser) {
    throw new Error('Ya existe un usuario con este email')
  }

  // Verificar si ya existe una invitacion pendiente
  const invitacionesQuery = query(
    collection(db, 'invitaciones'),
    where('email', '==', data.email.toLowerCase()),
    where('estado', '==', 'pendiente'),
    limit(1)
  )
  const existingInvitation = await getDocs(invitacionesQuery)
  if (!existingInvitation.empty) {
    throw new Error('Ya existe una invitacion pendiente para este email')
  }

  // Crear la invitacion
  const docRef = await addDoc(collection(db, 'invitaciones'), {
    email: data.email.toLowerCase(),
    nombre: data.nombre,
    rol: data.rol,
    clienteId: data.clienteId ?? null,
    sucursalIds: data.sucursalIds ?? null,
    propietarioId: data.propietarioId ?? null,
    estado: 'pendiente',
    createdAt: serverTimestamp(),
    createdBy,
  })

  return docRef.id
}
