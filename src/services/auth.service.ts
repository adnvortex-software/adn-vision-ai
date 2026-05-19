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

/**
 * Inicia sesión con email y contraseña
 */
export async function login(email: string, password: string): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email, password)
  return result.user
}

/**
 * Cierra la sesión actual
 */
export async function logout(): Promise<void> {
  await signOut(auth)
}

/**
 * Envía email para restablecer contraseña
 */
export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email)
}

/**
 * Obtiene los datos del usuario desde Firestore
 */
export async function getUsuario(uid: string): Promise<Usuario | null> {
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
  return onAuthStateChanged(auth, callback)
}

/**
 * Obtiene el usuario actualmente autenticado
 */
export function getCurrentUser(): User | null {
  return auth.currentUser
}
