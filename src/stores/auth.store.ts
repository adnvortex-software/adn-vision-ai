import { create } from 'zustand'
import { type User } from 'firebase/auth'
import type { Usuario } from '@/types/auth'
import type { Role } from '@/config/constants'

interface AuthState {
  // Estado de autenticación
  firebaseUser: User | null
  usuario: Usuario | null
  isLoading: boolean
  isAuthenticated: boolean
  error: string | null

  // Acciones
  setFirebaseUser: (user: User | null) => void
  setUsuario: (usuario: Usuario | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void

  // Helpers computados
  getRole: () => Role | null
  getClienteId: () => string | null
  getSucursalIds: () => string[] | null
  isInternal: () => boolean
  isClient: () => boolean
}

const initialState = {
  firebaseUser: null,
  usuario: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  ...initialState,

  setFirebaseUser: (user) => {
    set({
      firebaseUser: user,
      isAuthenticated: !!user,
      isLoading: false,
    })
  },

  setUsuario: (usuario) => {
    set({
      usuario,
      isLoading: false,
    })
  },

  setLoading: (isLoading) => {
    set({ isLoading })
  },

  setError: (error) => {
    set({ error })
  },

  reset: () => {
    set(initialState)
  },

  // Helpers computados
  getRole: () => {
    const { usuario } = get()
    return usuario?.rol ?? null
  },

  getClienteId: () => {
    const { usuario } = get()
    return usuario?.clienteId ?? null
  },

  getSucursalIds: () => {
    const { usuario } = get()
    return usuario?.sucursalIds ?? null
  },

  isInternal: () => {
    const role = get().getRole()
    return (
      role === 'super_admin' || role === 'ops_admin' || role === 'analyst' || role === 'support'
    )
  },

  isClient: () => {
    const role = get().getRole()
    return role === 'client_admin' || role === 'client_viewer'
  },
}))
