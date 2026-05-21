import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Bus,
  AlertTriangle,
  Users,
  Activity,
  Search,
  X,
  Filter,
  RefreshCw,
  Loader2,
} from 'lucide-react'
// Recharts imports reserved for future charts
// import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  KPICard,
  KPIGrid,
  FlotaOverview,
  NovedadesRecientes,
  BusesEnVivoTable,
} from '@/components/dashboard'
import { useFiltersStore, useLocationFilters } from '@/stores/filters.store'
import { BUS_STATES } from '@/config/constants'
import type { BusState } from '@/config/constants'
import type { BusConDetalles } from '@/types/bus'
import type { EventoConDetalles } from '@/types/novedad'
import type { Cliente, Sucursal } from '@/types/cliente'
import type { Entity } from '@/types/firestore'
import { listBuses, subscribeToBuses } from '@/services/buses.service'
import { listClientes, listSucursales } from '@/services/clientes.service'
import { listEventos } from '@/services/novedades.service'
import { useToast } from '@/hooks/use-toast'

export default function DashboardPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Data from Firebase
  const [buses, setBuses] = useState<BusConDetalles[]>([])
  const [clientes, setClientes] = useState<Entity<Cliente>[]>([])
  const [sucursales, setSucursales] = useState<Entity<Sucursal>[]>([])
  const [eventos, setEventos] = useState<EventoConDetalles[]>([])

  // Filters from store
  const { clienteId, sucursalId, setClienteId, setSucursalId, clearLocationFilters } =
    useLocationFilters()
  const estadoBus = useFiltersStore((s) => s.estadoBus)
  const setEstadoBus = useFiltersStore((s) => s.setEstadoBus)
  const searchQuery = useFiltersStore((s) => s.searchQuery)
  const setSearchQuery = useFiltersStore((s) => s.setSearchQuery)

  // Load initial data
  useEffect(() => {
    async function loadData() {
      try {
        const [busesResult, clientesResult, eventosResult] = await Promise.all([
          listBuses({ limit: 100 }),
          listClientes({ limit: 100 }),
          listEventos({ limit: 20 }),
        ])

        // Convert buses to BusConDetalles
        const busesConDetalles: BusConDetalles[] = busesResult.data.map((bus) => ({
          ...bus,
          clienteNombre: '',
          sucursalNombre: '',
          novedadesHoy: 0,
          conteoDia: undefined,
        }))
        setBuses(busesConDetalles)
        setClientes(clientesResult.data)

        // Convert eventos to EventoConDetalles
        const eventosConDetalles: EventoConDetalles[] = eventosResult.data.map((evento) => ({
          ...evento,
          busPlaca: busesResult.data.find((b) => b.id === evento.busId)?.placa ?? evento.busId,
          camaraNombre: evento.camaraId,
          novedadNombre: evento.tipoNovedad,
          novedadCategoria: 'operativa' as const,
        }))
        setEventos(eventosConDetalles)
      } catch (error) {
        console.error('Error loading dashboard data:', error)
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los datos del dashboard',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }
    void loadData()
  }, [toast])

  // Load sucursales when cliente changes
  useEffect(() => {
    async function loadSucursales() {
      if (!clienteId) {
        setSucursales([])
        return
      }
      try {
        const sucursalesData = await listSucursales(clienteId)
        setSucursales(sucursalesData)
      } catch (error) {
        console.error('Error loading sucursales:', error)
      }
    }
    void loadSucursales()
  }, [clienteId])

  // Subscribe to real-time bus updates
  useEffect(() => {
    const unsubscribe = subscribeToBuses((updatedBuses) => {
      const busesConDetalles: BusConDetalles[] = updatedBuses.map((bus) => ({
        ...bus,
        clienteNombre: '',
        sucursalNombre: '',
        novedadesHoy: 0,
        conteoDia: undefined,
      }))
      setBuses(busesConDetalles)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  // Filter buses based on filters
  const filteredBuses = useMemo(() => {
    let result = buses

    if (clienteId) {
      result = result.filter((b) => b.clienteId === clienteId)
    }
    if (sucursalId) {
      result = result.filter((b) => b.sucursalId === sucursalId)
    }
    if (estadoBus) {
      result = result.filter((b) => b.estado === estadoBus)
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (b) => b.placa.toLowerCase().includes(query) || b.rutaTexto?.toLowerCase().includes(query)
      )
    }

    return result
  }, [buses, clienteId, sucursalId, estadoBus, searchQuery])

  // Calculate KPIs from filtered buses
  const kpis = useMemo(() => {
    const activos = filteredBuses.filter((b) => b.estado === 'activo').length
    const total = filteredBuses.length
    const novedadesHoy = eventos.filter((e) => e.estado === 'nuevo').length
    const pasajerosHoy = filteredBuses.reduce((sum, b) => sum + (b.conteoDia?.entradas ?? 0), 0)
    const alertasCriticas = eventos.filter((e) => e.estado === 'nuevo').length

    return { activos, total, novedadesHoy, pasajerosHoy, alertasCriticas }
  }, [filteredBuses, eventos])

  // Calculate flota stats
  const flotaStats = useMemo(() => {
    const total = filteredBuses.length
    const activos = filteredBuses.filter((b) => b.estado === 'activo').length
    const inactivos = filteredBuses.filter((b) => b.estado === 'inactivo').length
    const mantenimiento = filteredBuses.filter((b) => b.estado === 'mantenimiento').length
    const sinConexion = filteredBuses.filter((b) => b.estado === 'sin_conexion').length

    return { total, activos, inactivos, mantenimiento, sinConexion }
  }, [filteredBuses])

  const hasActiveFilters =
    clienteId !== null || sucursalId !== null || estadoBus !== null || searchQuery !== ''

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      const [busesResult, eventosResult] = await Promise.all([
        listBuses({ limit: 100 }),
        listEventos({ limit: 20 }),
      ])
      const busesConDetalles: BusConDetalles[] = busesResult.data.map((bus) => ({
        ...bus,
        clienteNombre: '',
        sucursalNombre: '',
        novedadesHoy: 0,
        conteoDia: undefined,
      }))
      setBuses(busesConDetalles)

      const eventosConDetalles: EventoConDetalles[] = eventosResult.data.map((evento) => ({
        ...evento,
        busPlaca: busesResult.data.find((b) => b.id === evento.busId)?.placa ?? evento.busId,
        camaraNombre: evento.camaraId,
        novedadNombre: evento.tipoNovedad,
        novedadCategoria: 'operativa' as const,
      }))
      setEventos(eventosConDetalles)
    } catch (error) {
      console.error('Error refreshing:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleClearFilters = () => {
    clearLocationFilters()
    setEstadoBus(null)
    setSearchQuery('')
  }

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container mx-auto space-y-6 py-6">
      <PageHeader
        title={t('dashboard.title')}
        description="Vision general del estado de la flota y novedades"
        actions={
          <Button variant="outline" onClick={() => void handleRefresh()} disabled={isRefreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        }
      />

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="h-4 w-4" />
              Filtros
            </CardTitle>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                <X className="mr-1 h-4 w-4" />
                Limpiar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Cliente filter */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Cliente</label>
              <Select
                value={clienteId ?? 'all'}
                onValueChange={(v) => {
                  setClienteId(v === 'all' ? null : v)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los clientes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los clientes</SelectItem>
                  {clientes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sucursal filter */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Sucursal</label>
              <Select
                value={sucursalId ?? 'all'}
                onValueChange={(v) => {
                  setSucursalId(v === 'all' ? null : v)
                }}
                disabled={!clienteId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas las sucursales" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las sucursales</SelectItem>
                  {sucursales.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Estado filter */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Estado</label>
              <Select
                value={estadoBus ?? 'all'}
                onValueChange={(v) => {
                  setEstadoBus(v === 'all' ? null : (v as BusState))
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  {BUS_STATES.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Placa o ruta..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <KPIGrid>
        <KPICard
          title="Buses Activos"
          value={kpis.activos}
          description={`de ${String(kpis.total)} totales`}
          icon={Bus}
          trend={
            kpis.total > 0
              ? { value: Math.round((kpis.activos / kpis.total) * 100), isPositive: true }
              : undefined
          }
        />
        <KPICard
          title="Novedades Hoy"
          value={kpis.novedadesHoy}
          description="pendientes de revision"
          icon={AlertTriangle}
          variant={kpis.novedadesHoy > 5 ? 'warning' : 'default'}
        />
        <KPICard
          title="Pasajeros Hoy"
          value={kpis.pasajerosHoy}
          description="entradas registradas"
          icon={Users}
        />
        <KPICard
          title="Alertas Criticas"
          value={kpis.alertasCriticas}
          description="requieren atencion"
          icon={Activity}
          variant={kpis.alertasCriticas > 0 ? 'danger' : 'default'}
        />
      </KPIGrid>

      {/* Main content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Flota Overview */}
        <FlotaOverview stats={flotaStats} className="lg:col-span-1" />

        {/* Novedades Recientes */}
        <NovedadesRecientes
          className="lg:col-span-2"
          eventos={eventos.slice(0, 5)}
          onVerTodos={() => {
            navigate('/novedades')
          }}
          onVerEvento={(evento) => {
            navigate(`/novedades/${evento.id}`)
          }}
        />
      </div>

      {/* Buses Table */}
      <BusesEnVivoTable
        buses={filteredBuses.slice(0, 10)}
        onVerBus={(bus) => {
          navigate(`/buses/${bus.id}`)
        }}
      />
    </div>
  )
}
