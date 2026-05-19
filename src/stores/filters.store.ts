import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { BusState, EventState } from '@/config/constants'

interface DateRange {
  from: Date | null
  to: Date | null
}

interface DashboardFilters {
  // Filtros de cliente/ubicación
  clienteId: string | null
  sucursalId: string | null

  // Filtros de tiempo
  dateRange: DateRange

  // Filtros de bus
  busId: string | null
  estadoBus: BusState | null

  // Filtros de novedades
  tipoNovedad: string | null
  estadoEvento: EventState | null

  // Búsqueda
  searchQuery: string
}

interface FiltersState extends DashboardFilters {
  // Setters individuales
  setClienteId: (clienteId: string | null) => void
  setSucursalId: (sucursalId: string | null) => void
  setDateRange: (dateRange: DateRange) => void
  setBusId: (busId: string | null) => void
  setEstadoBus: (estado: BusState | null) => void
  setTipoNovedad: (tipo: string | null) => void
  setEstadoEvento: (estado: EventState | null) => void
  setSearchQuery: (query: string) => void

  // Acciones batch
  setFilters: (filters: Partial<DashboardFilters>) => void
  resetFilters: () => void
  resetDateRange: () => void
  clearLocationFilters: () => void
}

const initialFilters: DashboardFilters = {
  clienteId: null,
  sucursalId: null,
  dateRange: {
    from: null,
    to: null,
  },
  busId: null,
  estadoBus: null,
  tipoNovedad: null,
  estadoEvento: null,
  searchQuery: '',
}

export const useFiltersStore = create<FiltersState>()(
  persist(
    (set) => ({
      ...initialFilters,

      // Setters individuales
      setClienteId: (clienteId) =>
        set({
          clienteId,
          // Limpiar sucursal si cambia el cliente
          sucursalId: null,
          busId: null,
        }),

      setSucursalId: (sucursalId) =>
        set({
          sucursalId,
          busId: null,
        }),

      setDateRange: (dateRange) => set({ dateRange }),

      setBusId: (busId) => set({ busId }),

      setEstadoBus: (estadoBus) => set({ estadoBus }),

      setTipoNovedad: (tipoNovedad) => set({ tipoNovedad }),

      setEstadoEvento: (estadoEvento) => set({ estadoEvento }),

      setSearchQuery: (searchQuery) => set({ searchQuery }),

      // Acciones batch
      setFilters: (filters) => set((state) => ({ ...state, ...filters })),

      resetFilters: () => set(initialFilters),

      resetDateRange: () =>
        set({
          dateRange: { from: null, to: null },
        }),

      clearLocationFilters: () =>
        set({
          clienteId: null,
          sucursalId: null,
          busId: null,
        }),
    }),
    {
      name: 'adn-lynx-filters',
      // Solo persistir algunos filtros, no la búsqueda ni el rango de fechas
      partialize: (state) => ({
        clienteId: state.clienteId,
        sucursalId: state.sucursalId,
        estadoBus: state.estadoBus,
        estadoEvento: state.estadoEvento,
      }),
    }
  )
)

/**
 * Helper para obtener el rango de fechas como objeto Date
 */
export function useDateRangeFilters() {
  const dateRange = useFiltersStore((state) => state.dateRange)
  const setDateRange = useFiltersStore((state) => state.setDateRange)
  const resetDateRange = useFiltersStore((state) => state.resetDateRange)

  return {
    from: dateRange.from,
    to: dateRange.to,
    setDateRange,
    resetDateRange,
    hasRange: dateRange.from !== null && dateRange.to !== null,
  }
}

/**
 * Helper para obtener filtros de ubicación
 */
export function useLocationFilters() {
  const clienteId = useFiltersStore((state) => state.clienteId)
  const sucursalId = useFiltersStore((state) => state.sucursalId)
  const busId = useFiltersStore((state) => state.busId)
  const setClienteId = useFiltersStore((state) => state.setClienteId)
  const setSucursalId = useFiltersStore((state) => state.setSucursalId)
  const setBusId = useFiltersStore((state) => state.setBusId)
  const clearLocationFilters = useFiltersStore((state) => state.clearLocationFilters)

  return {
    clienteId,
    sucursalId,
    busId,
    setClienteId,
    setSucursalId,
    setBusId,
    clearLocationFilters,
  }
}
