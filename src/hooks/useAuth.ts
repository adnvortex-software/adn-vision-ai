import { useEffect, useState, useCallback } from 'react'
import { type User } from 'firebase/auth'
import {
  subscribeToAuthState,
  getUsuario,
  login as loginService,
  logout as logoutService,
  resetPassword as resetPasswordService,
} from '@/services/auth.service'
import type { Usuario } from '@/types/auth'

interface AuthState {
  user: User | null
  usuario: Usuario | null
  isLoading: boolean
  isAuthenticated: boolean
  error: string | null
}

interface UseAuthReturn extends AuthState {
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  clearError: () => void
}

export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>({
    user: null,
    usuario: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  })

  useEffect(() => {
    const unsubscribe = subscribeToAuthState((firebaseUser) => {
      if (firebaseUser) {
        getUsuario(firebaseUser.uid)
          .then((usuarioData) => {
            setState({
              user: firebaseUser,
              usuario: usuarioData,
              isLoading: false,
              isAuthenticated: true,
              error: null,
            })
          })
          .catch((err: unknown) => {
            console.error('Error fetching user data:', err)
            setState({
              user: firebaseUser,
              usuario: null,
              isLoading: false,
              isAuthenticated: true,
              error: 'Error al cargar datos del usuario',
            })
          })
      } else {
        setState({
          user: null,
          usuario: null,
          isLoading: false,
          isAuthenticated: false,
          error: null,
        })
      }
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))
    try {
      await loginService(email, password)
      // Auth state will be updated by the listener
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al iniciar sesión'
      setState((prev) => ({ ...prev, isLoading: false, error: message }))
      throw err
    }
  }, [])

  const logout = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }))
    try {
      await logoutService()
      // Auth state will be updated by the listener
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cerrar sesión'
      setState((prev) => ({ ...prev, isLoading: false, error: message }))
      throw err
    }
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))
    try {
      await resetPasswordService(email)
      setState((prev) => ({ ...prev, isLoading: false }))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al enviar correo de recuperación'
      setState((prev) => ({ ...prev, isLoading: false, error: message }))
      throw err
    }
  }, [])

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }))
  }, [])

  return {
    ...state,
    login,
    logout,
    resetPassword,
    clearError,
  }
}
