import {
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  type User,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '@/config/firebase'
import { usuarioFirestoreSchema, type UsuarioFirestore } from '@/schemas/auth.schema'
import type { Usuario } from '@/types/auth'
import type { FirestoreDocData } from '@/types/firestore'
import { env } from '@/config/env'

// Mock users for development
const MOCK_USERS: Record<string, { password: string; usuario: Usuario }> = {
  'admin@adnlynx.com': {
    password: 'admin123',
    usuario: {
      uid: 'mock-admin-uid',
      email: 'admin@adnlynx.com',
      nombre: 'Admin Demo',
      rol: 'super_admin',
      clienteId: null,
      sucursalIds: null,
      propietarioId: null,
      activo: true,
      createdAt: null,
      updatedAt: null,
      createdBy: 'system',
    },
  },
  'operador@adnlynx.com': {
    password: 'operador123',
    usuario: {
      uid: 'mock-ops-uid',
      email: 'operador@adnlynx.com',
      nombre: 'Operador Demo',
      rol: 'ops_admin',
      clienteId: null,
      sucursalIds: null,
      propietarioId: null,
      activo: true,
      createdAt: null,
      updatedAt: null,
      createdBy: 'system',
    },
  },
  'analista@adnlynx.com': {
    password: 'analista123',
    usuario: {
      uid: 'mock-analyst-uid',
      email: 'analista@adnlynx.com',
      nombre: 'Analista Demo',
      rol: 'analyst',
      clienteId: null,
      sucursalIds: null,
      propietarioId: null,
      activo: true,
      createdAt: null,
      updatedAt: null,
      createdBy: 'system',
    },
  },
  'cliente@transportes.com': {
    password: 'cliente123',
    usuario: {
      uid: 'mock-client-uid',
      email: 'cliente@transportes.com',
      nombre: 'Cliente Demo',
      rol: 'client_admin',
      clienteId: 'client-1',
      sucursalIds: ['suc-1', 'suc-2'],
      propietarioId: null,
      activo: true,
      createdAt: null,
      updatedAt: null,
      createdBy: 'system',
    },
  },
}

// Mock auth state
let mockCurrentUser: { email: string; uid: string } | null = null
const mockAuthListeners: Array<(user: { email: string; uid: string } | null) => void> = []

function notifyMockAuthListeners() {
  mockAuthListeners.forEach((listener) => {
    listener(mockCurrentUser)
  })
}

/**
 * Inicia sesión con email y contraseña
 */
export async function login(
  email: string,
  password: string
): Promise<User | { email: string; uid: string }> {
  if (env.VITE_MOCK_AUTH) {
    const mockUser = MOCK_USERS[email.toLowerCase()]
    if (mockUser?.password !== password) {
      throw new Error('Credenciales inválidas')
    }
    mockCurrentUser = { email: mockUser.usuario.email, uid: mockUser.usuario.uid }
    // Delay to simulate network
    await new Promise((resolve) => setTimeout(resolve, 500))
    notifyMockAuthListeners()
    return mockCurrentUser
  }

  const result = await signInWithEmailAndPassword(auth, email, password)
  return result.user
}

/**
 * Cierra la sesión actual
 */
export async function logout(): Promise<void> {
  if (env.VITE_MOCK_AUTH) {
    mockCurrentUser = null
    await new Promise((resolve) => setTimeout(resolve, 300))
    notifyMockAuthListeners()
    return
  }

  await signOut(auth)
}

/**
 * Envía email para restablecer contraseña
 */
export async function resetPassword(email: string): Promise<void> {
  if (env.VITE_MOCK_AUTH) {
    // Simulate sending email
    await new Promise((resolve) => setTimeout(resolve, 500))
    // Mock mode: simulate sending email
    console.warn(`[Mock] Password reset email would be sent to ${email}`)
    return
  }

  await sendPasswordResetEmail(auth, email)
}

/**
 * Obtiene los datos del usuario desde Firestore
 */
export async function getUsuario(uid: string): Promise<Usuario | null> {
  if (env.VITE_MOCK_AUTH) {
    // Find mock user by uid
    const mockEntry = Object.values(MOCK_USERS).find((entry) => entry.usuario.uid === uid)
    return mockEntry?.usuario ?? null
  }

  const docRef = doc(db, 'usuarios', uid)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) {
    return null
  }

  const data = docSnap.data() as FirestoreDocData
  const parsed = usuarioFirestoreSchema.safeParse(data)

  if (!parsed.success) {
    console.error('Error validando usuario de Firestore:', parsed.error)
    return null
  }

  return {
    ...parsed.data,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  }
}

/**
 * Crea o actualiza datos del usuario en Firestore
 */
export async function upsertUsuario(uid: string, data: Partial<UsuarioFirestore>): Promise<void> {
  if (env.VITE_MOCK_AUTH) {
    // Mock mode: simulate upsert
    console.warn(`[Mock] Would upsert user ${uid}:`, data)
    return
  }

  const docRef = doc(db, 'usuarios', uid)
  const docSnap = await getDoc(docRef)

  if (docSnap.exists()) {
    await setDoc(
      docRef,
      {
        ...data,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    )
  } else {
    await setDoc(docRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }
}

/**
 * Suscribe a cambios en el estado de autenticación
 */
export function subscribeToAuthState(callback: (user: User | null) => void): () => void {
  if (env.VITE_MOCK_AUTH) {
    // Add to mock listeners
    const mockCallback = (user: { email: string; uid: string } | null) => {
      callback(user as unknown as User | null)
    }
    mockAuthListeners.push(mockCallback)

    // Call immediately with current state
    setTimeout(() => {
      mockCallback(mockCurrentUser)
    }, 100)

    // Return unsubscribe function
    return () => {
      const index = mockAuthListeners.indexOf(mockCallback)
      if (index > -1) {
        mockAuthListeners.splice(index, 1)
      }
    }
  }

  return onAuthStateChanged(auth, callback)
}

/**
 * Obtiene el usuario actualmente autenticado
 */
export function getCurrentUser(): User | { email: string; uid: string } | null {
  if (env.VITE_MOCK_AUTH) {
    return mockCurrentUser
  }
  return auth.currentUser
}

/**
 * Get list of mock users (for development login screen)
 */
export function getMockUsers(): Array<{
  email: string
  password: string
  rol: string
  nombre: string
}> {
  if (!env.VITE_MOCK_AUTH) return []
  return Object.entries(MOCK_USERS).map(([email, data]) => ({
    email,
    password: data.password,
    rol: data.usuario.rol,
    nombre: data.usuario.nombre,
  }))
}
