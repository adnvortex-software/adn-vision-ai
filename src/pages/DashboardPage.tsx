import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Timestamp } from 'firebase/firestore'
import { Bus, AlertTriangle, Users, Activity, Search, X, Filter, RefreshCw } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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

// Mock data for demonstration
const mockBuses: BusConDetalles[] = [
  {
    id: 'bus-1',
    placa: 'ABC123',
    clienteId: 'client-1',
    sucursalId: 'suc-1',
    propietarioId: null,
    tipoVehiculo: 'bus',
    rutaTexto: 'Ruta 1',
    conductorAsignadoId: null,
    ztIpRouter: '172.23.1.100',
    subnetLan: '192.168.1.0/24',
    estado: 'activo',
    lastHeartbeat: null,
    numCamarasConfiguradas: 4,
    activo: true,
    createdAt: null,
    updatedAt: null,
    createdBy: 'system',
    deleted: false,
    clienteNombre: 'Transportes ABC',
    sucursalNombre: 'Terminal Norte',
    conductorNombre: undefined,
    novedadesHoy: 3,
    conteoDia: { entradas: 120, salidas: 85, aforo: 35 },
  },
  {
    id: 'bus-2',
    placa: 'DEF456',
    clienteId: 'client-1',
    sucursalId: 'suc-1',
    propietarioId: null,
    tipoVehiculo: 'buseta',
    rutaTexto: 'Ruta 2',
    conductorAsignadoId: null,
    ztIpRouter: '172.23.1.101',
    subnetLan: '192.168.2.0/24',
    estado: 'activo',
    lastHeartbeat: null,
    numCamarasConfiguradas: 4,
    activo: true,
    createdAt: null,
    updatedAt: null,
    createdBy: 'system',
    deleted: false,
    clienteNombre: 'Transportes ABC',
    sucursalNombre: 'Terminal Norte',
    conductorNombre: undefined,
    novedadesHoy: 1,
    conteoDia: { entradas: 95, salidas: 90, aforo: 5 },
  },
  {
    id: 'bus-3',
    placa: 'GHI789',
    clienteId: 'client-1',
    sucursalId: 'suc-2',
    propietarioId: null,
    tipoVehiculo: 'bus',
    rutaTexto: 'Ruta 3',
    conductorAsignadoId: null,
    ztIpRouter: '172.23.1.102',
    subnetLan: '192.168.3.0/24',
    estado: 'sin_conexion',
    lastHeartbeat: null,
    numCamarasConfiguradas: 4,
    activo: true,
    createdAt: null,
    updatedAt: null,
    createdBy: 'system',
    deleted: false,
    clienteNombre: 'Transportes ABC',
    sucursalNombre: 'Terminal Sur',
    conductorNombre: undefined,
    novedadesHoy: 0,
    conteoDia: undefined,
  },
  {
    id: 'bus-4',
    placa: 'JKL012',
    clienteId: 'client-1',
    sucursalId: 'suc-1',
    propietarioId: null,
    tipoVehiculo: 'van',
    rutaTexto: 'Ruta 4',
    conductorAsignadoId: null,
    ztIpRouter: '172.23.1.103',
    subnetLan: '192.168.4.0/24',
    estado: 'mantenimiento',
    lastHeartbeat: null,
    numCamarasConfiguradas: 2,
    activo: true,
    createdAt: null,
    updatedAt: null,
    createdBy: 'system',
    deleted: false,
    clienteNombre: 'Transportes ABC',
    sucursalNombre: 'Terminal Norte',
    conductorNombre: undefined,
    novedadesHoy: 0,
    conteoDia: undefined,
  },
]

// Mock timestamp for demo data
const mockTimestamp = Timestamp.now()

const mockEventos: EventoConDetalles[] = [
  {
    id: 'ev-1',
    tipoNovedad: 'pasajero_en_cabina',
    busId: 'bus-1',
    clienteId: 'client-1',
    sucursalId: 'suc-1',
    camaraId: 'cam-1',
    timestamp: mockTimestamp,
    screenshotUrl: null,
    videoClipUrl: null,
    datos: {},
    estado: 'nuevo',
    revisadoPor: null,
    revisadoAt: null,
    notas: null,
    reportePdfUrl: null,
    createdAt: null,
    updatedAt: null,
    createdBy: 'system',
    deleted: false,
    busPlaca: 'ABC123',
    camaraNombre: 'Cabina',
    novedadNombre: 'Pasajero en Cabina',
    novedadCategoria: 'seguridad_pasajero',
  },
  {
    id: 'ev-2',
    tipoNovedad: 'conductor_sin_cinturon',
    busId: 'bus-1',
    clienteId: 'client-1',
    sucursalId: 'suc-1',
    camaraId: 'cam-1',
    timestamp: mockTimestamp,
    screenshotUrl: null,
    videoClipUrl: null,
    datos: {},
    estado: 'revisado',
    revisadoPor: 'user-1',
    revisadoAt: null,
    notas: 'Verificado',
    reportePdfUrl: null,
    createdAt: null,
    updatedAt: null,
    createdBy: 'system',
    deleted: false,
    busPlaca: 'ABC123',
    camaraNombre: 'Cabina',
    novedadNombre: 'Conductor sin Cinturon',
    novedadCategoria: 'seguridad_conductor',
  },
  {
    id: 'ev-3',
    tipoNovedad: 'sobrecupo',
    busId: 'bus-2',
    clienteId: 'client-1',
    sucursalId: 'suc-1',
    camaraId: 'cam-2',
    timestamp: mockTimestamp,
    screenshotUrl: null,
    videoClipUrl: null,
    datos: {},
    estado: 'nuevo',
    revisadoPor: null,
    revisadoAt: null,
    notas: null,
    reportePdfUrl: null,
    createdAt: null,
    updatedAt: null,
    createdBy: 'system',
    deleted: false,
    busPlaca: 'DEF456',
    camaraNombre: 'Pasillo',
    novedadNombre: 'Sobrecupo',
    novedadCategoria: 'operativa',
  },
]

// Mock chart data - novedades last 7 days
const mockChartData = [
  { name: 'Lun', operativas: 4, seguridad: 2, tecnicas: 1 },
  { name: 'Mar', operativas: 3, seguridad: 1, tecnicas: 0 },
  { name: 'Mie', operativas: 5, seguridad: 3, tecnicas: 2 },
  { name: 'Jue', operativas: 2, seguridad: 2, tecnicas: 1 },
  { name: 'Vie', operativas: 6, seguridad: 4, tecnicas: 0 },
  { name: 'Sab', operativas: 1, seguridad: 0, tecnicas: 0 },
  { name: 'Dom', operativas: 0, seguridad: 0, tecnicas: 0 },
]

// Mock clientes for filter
const mockClientes = [
  { id: 'client-1', nombre: 'Transportes ABC' },
  { id: 'client-2', nombre: 'Buses del Norte' },
]

// Mock sucursales
const mockSucursales = [
  { id: 'suc-1', nombre: 'Terminal Norte', clienteId: 'client-1' },
  { id: 'suc-2', nombre: 'Terminal Sur', clienteId: 'client-1' },
]

export default function DashboardPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Filters from store
  const { clienteId, sucursalId, setClienteId, setSucursalId, clearLocationFilters } =
    useLocationFilters()
  const estadoBus = useFiltersStore((s) => s.estadoBus)
  const setEstadoBus = useFiltersStore((s) => s.setEstadoBus)
  const searchQuery = useFiltersStore((s) => s.searchQuery)
  const setSearchQuery = useFiltersStore((s) => s.setSearchQuery)

  // Filter sucursales based on selected cliente
  const filteredSucursales = useMemo(() => {
    if (!clienteId) return mockSucursales
    return mockSucursales.filter((s) => s.clienteId === clienteId)
  }, [clienteId])

  // Filter buses based on filters
  const filteredBuses = useMemo(() => {
    let result = mockBuses

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
  }, [clienteId, sucursalId, estadoBus, searchQuery])

  // Calculate KPIs from filtered buses
  const kpis = useMemo(() => {
    const activos = filteredBuses.filter((b) => b.estado === 'activo').length
    const total = filteredBuses.length
    const novedadesHoy = filteredBuses.reduce((sum, b) => sum + (b.novedadesHoy ?? 0), 0)
    const pasajerosHoy = filteredBuses.reduce((sum, b) => sum + (b.conteoDia?.entradas ?? 0), 0)
    const alertasCriticas = mockEventos.filter((e) => e.estado === 'nuevo').length

    return { activos, total, novedadesHoy, pasajerosHoy, alertasCriticas }
  }, [filteredBuses])

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

  const handleRefresh = () => {
    setIsRefreshing(true)
    // Simulate refresh
    setTimeout(() => {
      setIsRefreshing(false)
    }, 1000)
  }

  const handleClearFilters = () => {
    clearLocationFilters()
    setEstadoBus(null)
    setSearchQuery('')
  }

  return (
    <div className="container mx-auto space-y-6 py-6">
      <PageHeader
        title={t('dashboard.title')}
        description="Vision general del estado de la flota y novedades"
        actions={
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
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
                  {mockClientes.map((c) => (
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
                  {filteredSucursales.map((s) => (
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

            {/* Search filter */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Buscar placa</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="ABC123..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                  }}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <KPIGrid columns={4}>
        <KPICard
          title={t('dashboard.busesActivos')}
          value={`${String(kpis.activos)} / ${String(kpis.total)}`}
          description="Buses conectados"
          icon={Bus}
          trend={{ value: 10, label: 'vs ayer' }}
          variant={kpis.activos === kpis.total ? 'success' : 'default'}
        />
        <KPICard
          title={t('dashboard.novedadesHoy')}
          value={kpis.novedadesHoy}
          description="Ultimas 24 horas"
          icon={AlertTriangle}
          trend={{ value: -5, label: 'vs ayer', isPositive: true }}
          variant={kpis.novedadesHoy > 10 ? 'warning' : 'default'}
        />
        <KPICard
          title={t('dashboard.pasajerosHoy')}
          value={kpis.pasajerosHoy.toLocaleString('es-CO')}
          description="Conteo acumulado"
          icon={Users}
          trend={{ value: 8, label: 'vs ayer' }}
        />
        <KPICard
          title={t('dashboard.alertasCriticas')}
          value={kpis.alertasCriticas}
          description="Requieren atencion"
          icon={Activity}
          variant={kpis.alertasCriticas > 0 ? 'danger' : 'success'}
        />
      </KPIGrid>

      {/* Chart - Novedades last 7 days */}
      <Card>
        <CardHeader>
          <CardTitle>Novedades Ultimos 7 Dias</CardTitle>
          <CardDescription>Eventos detectados por categoria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                />
                <Legend />
                <Bar
                  dataKey="operativas"
                  name="Operativas"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="seguridad"
                  name="Seguridad"
                  fill="hsl(25 95% 53%)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="tecnicas"
                  name="Tecnicas"
                  fill="hsl(220 14% 46%)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Two column layout: Flota Overview + Novedades Recientes */}
      <div className="grid gap-6 lg:grid-cols-2">
        <FlotaOverview stats={flotaStats} />
        <NovedadesRecientes
          eventos={mockEventos}
          onVerTodos={() => {
            navigate('/novedades')
          }}
          onVerEvento={(evento) => {
            navigate(`/novedades/${evento.id}`)
          }}
        />
      </div>

      {/* Buses en vivo table */}
      <BusesEnVivoTable
        buses={filteredBuses}
        onVerBus={(bus) => {
          navigate(`/buses/${bus.id}`)
        }}
      />
    </div>
  )
}
