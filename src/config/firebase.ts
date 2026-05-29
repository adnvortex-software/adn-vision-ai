import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { getStorage, type FirebaseStorage } from 'firebase/storage'
import { env } from './env'

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
}

// Inicializar solo si no existe ya una app
const app: FirebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : (getApps()[0] as FirebaseApp)

// Secondary app for creating users without affecting current session
let secondaryApp: FirebaseApp | null = null
function getSecondaryApp(): FirebaseApp {
  if (!secondaryApp) {
    try {
      secondaryApp = getApp('secondary')
    } catch {
      secondaryApp = initializeApp(firebaseConfig, 'secondary')
    }
  }
  return secondaryApp
}

const auth: Auth = getAuth(app)
const db: Firestore = getFirestore(app)
const storage: FirebaseStorage = getStorage(app)

export { app, auth, db, storage, getSecondaryApp }
