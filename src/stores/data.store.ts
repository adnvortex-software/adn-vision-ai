import { create } from 'zustand'
import { listClientes } from '@/services/clientes.service'
import { listBuses, subscribeToBuses } from '@/services/buses.service'
import { listUsuarios } from '@/services/usuarios.service'
import { useAuthStore } from '@/stores/auth.store'
import { isClientRole } from '@/lib/permissions'
import type { Entity } from '@/types/firestore'
import type { Cliente } from '@/types/cliente'
import type { BusConDetalles } from '@/types/bus'
import type { Usuario } from '@/types/auth'
import type { Unsubscribe } from 'firebase/firestore'

// Helper to get clienteId filter for client users
function getClienteIdFilter(): string | undefined {
  const usuario = useAuthStore.getState().usuario
  if (!usuario?.rol) return undefined
  if (isClientRole(usuario.rol)) {
    return usuario.clienteId ?? undefined
  }
  return undefined
}

interface DataState {
  // Clientes
  clientes: Entity<Cliente>[]
  clientesLoading: boolean
  clientesLoaded: boolean
  clientesError: string | null

  // Buses
  buses: BusConDetalles[]
  busesLoading: boolean
  busesLoaded: boolean
  busesError: string | null
  busesUnsubscribe: Unsubscribe | null

  // Usuarios
  usuarios: Entity<Usuario>[]
  usuariosLoading: boolean
  usuariosLoaded: boolean
  usuariosError: string | null

  // Actions
  loadClientes: (force?: boolean) => Promise<void>
  loadBuses: (force?: boolean) => Promise<void>
  subscribeBuses: () => void
  unsubscribeBuses: () => void
  loadUsuarios: (force?: boolean) => Promise<void>
  refreshAll: () => Promise<void>
  clearCache: () => void

  // Helpers
  getClienteById: (id: string) => Entity<Cliente> | undefined
  getBusById: (id: string) => BusConDetalles | undefined
  getUsuarioById: (id: string) => Entity<Usuario> | undefined
}

export const useDataStore = create<DataState>((set, get) => ({
  // Initial state
  clientes: [],
  clientesLoading: false,
  clientesLoaded: false,
  clientesError: null,

  buses: [],
  busesLoading: false,
  busesLoaded: false,
  busesError: null,
  busesUnsubscribe: null,

  usuarios: [],
  usuariosLoading: false,
  usuariosLoaded: false,
  usuariosError: null,

  // Load clientes
  loadClientes: async (force = false) => {
    const state = get()
    if (state.clientesLoaded && !force) return
    if (state.clientesLoading) return

    set({ clientesLoading: true, clientesError: null })
    try {
      const result = await listClientes({ limit: 500 })
      set({
        clientes: result.data,
        clientesLoading: false,
        clientesLoaded: true,
      })
    } catch (error) {
      set({
        clientesError: error instanceof Error ? error.message : 'Error loading clientes',
        clientesLoading: false,
      })
    }
  },

  // Load buses (filtered by clienteId for client users)
  loadBuses: async (force = false) => {
    const state = get()
    if (state.busesLoaded && !force) return
    if (state.busesLoading) return

    set({ busesLoading: true, busesError: null })
    try {
      // Filter by clienteId for client users
      const clienteId = getClienteIdFilter()
      const result = await listBuses({ limit: 500, clienteId })
      // Enrich with client names
      const clientes = get().clientes
      const enrichedBuses: BusConDetalles[] = result.data.map((bus) => {
        const cliente = clientes.find((c) => c.id === bus.clienteId)
        return {
          ...bus,
          clienteNombre: cliente?.nombre ?? 'Sin cliente',
        }
      })
      set({
        buses: enrichedBuses,
        busesLoading: false,
        busesLoaded: true,
      })
    } catch (error) {
      set({
        busesError: error instanceof Error ? error.message : 'Error loading buses',
        busesLoading: false,
      })
    }
  },

  // Subscribe to real-time bus updates (filtered by clienteId for client users)
  subscribeBuses: () => {
    const state = get()
    if (state.busesUnsubscribe) return // Already subscribed

    // Filter by clienteId for client users
    const clienteId = getClienteIdFilter()
    const unsubscribe = subscribeToBuses(
      (buses) => {
        const clientes = get().clientes
        const enrichedBuses: BusConDetalles[] = buses.map((bus) => {
          const cliente = clientes.find((c) => c.id === bus.clienteId)
          return {
            ...bus,
            clienteNombre: cliente?.nombre ?? 'Sin cliente',
          }
        })
        set({ buses: enrichedBuses, busesLoaded: true })
      },
      { clienteId }
    )

    set({ busesUnsubscribe: unsubscribe })
  },

  // Unsubscribe from bus updates
  unsubscribeBuses: () => {
    const state = get()
    if (state.busesUnsubscribe) {
      state.busesUnsubscribe()
      set({ busesUnsubscribe: null })
    }
  },

  // Load usuarios
  loadUsuarios: async (force = false) => {
    const state = get()
    if (state.usuariosLoaded && !force) return
    if (state.usuariosLoading) return

    set({ usuariosLoading: true, usuariosError: null })
    try {
      const result = await listUsuarios({ limit: 500 })
      set({
        usuarios: result.data,
        usuariosLoading: false,
        usuariosLoaded: true,
      })
    } catch (error) {
      set({
        usuariosError: error instanceof Error ? error.message : 'Error loading usuarios',
        usuariosLoading: false,
      })
    }
  },

  // Refresh all data
  refreshAll: async () => {
    const state = get()
    state.unsubscribeBuses()
    set({
      clientesLoaded: false,
      busesLoaded: false,
      usuariosLoaded: false,
    })
    await state.loadClientes(true)
    await state.loadBuses(true)
    await state.loadUsuarios(true)
  },

  // Clear all cached data
  clearCache: () => {
    const state = get()
    state.unsubscribeBuses()
    set({
      clientes: [],
      clientesLoaded: false,
      clientesError: null,
      buses: [],
      busesLoaded: false,
      busesError: null,
      usuarios: [],
      usuariosLoaded: false,
      usuariosError: null,
    })
  },

  // Helper to get cliente by ID
  getClienteById: (id: string) => {
    return get().clientes.find((c) => c.id === id)
  },

  // Helper to get bus by ID
  getBusById: (id: string) => {
    return get().buses.find((b) => b.id === id)
  },

  // Helper to get usuario by ID
  getUsuarioById: (id: string) => {
    return get().usuarios.find((u) => u.id === id)
  },
}))
