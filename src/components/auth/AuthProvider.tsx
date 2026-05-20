import { useEffect, type ReactNode } from 'react'
import { subscribeToAuthState, getUsuario } from '@/services/auth.service'
import { useAuthStore } from '@/stores/auth.store'

interface AuthProviderProps {
  children: ReactNode
}

/**
 * AuthProvider initializes and manages the auth state.
 * It subscribes to Firebase auth state changes (or mock auth in development)
 * and updates the Zustand auth store accordingly.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const { setFirebaseUser, setUsuario, setLoading, setError } = useAuthStore()

  useEffect(() => {
    // Start in loading state
    setLoading(true)

    const unsubscribe = subscribeToAuthState((user) => {
      if (user) {
        // User is signed in
        setFirebaseUser(user)

        // Fetch user data from Firestore (or mock)
        getUsuario(user.uid)
          .then((usuarioData) => {
            setUsuario(usuarioData)
            setLoading(false)
          })
          .catch((err: unknown) => {
            console.error('Error fetching user data:', err)
            setError('Error al cargar datos del usuario')
            setLoading(false)
          })
      } else {
        // User is signed out
        setFirebaseUser(null)
        setUsuario(null)
        setLoading(false)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [setFirebaseUser, setUsuario, setLoading, setError])

  return <>{children}</>
}
