import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Bus,
  AlertTriangle,
  Building2,
  ClipboardList,
  Calendar,
  RefreshCw,
  Loader2,
  TrendingUp,
  Filter,
} from 'lucide-react'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import { es, enUS } from 'date-fns/locale'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
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
  NovedadesRecientes,
  PassengerChart,
  CLIENT_COLORS,
  NovedadesChart,
  FlotaDonutChart,
  DespachosChart,
} from '@/components/dashboard'
import type { BusConDetalles } from '@/types/bus'
import type { EventoConDetalles } from '@/types/novedad'
import type { Cliente } from '@/types/cliente'
import type { Despacho } from '@/types/despacho'
import type { Entity } from '@/types/firestore'
import { listBuses } from '@/services/buses.service'
import { listClientes } from '@/services/clientes.service'
import { listEventos } from '@/services/novedades.service'
import { listDespachos } from '@/services/despachos.service'
import { getConteosDiariosForDashboard, type ConteoDiario } from '@/services/conteos.service'
import { useToast } from '@/hooks/use-toast'
import { useAuthStore } from '@/stores/auth.store'

type DateRange = '7d' | '14d' | '30d' | 'today'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const { toast } = useToast()
  const { usuario } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange>('7d')

  // Get locale for date-fns
  const dateLocale = i18n.language.startsWith('en') ? enUS : es

  // Data from Firebase
  const [allBuses, setAllBuses] = useState<BusConDetalles[]>([])
  const [clientes, setClientes] = useState<Entity<Cliente>[]>([])
  const [allEventos, setAllEventos] = useState<EventoConDetalles[]>([])
  const [allDespachos, setAllDespachos] = useState<Entity<Despacho>[]>([])
  const [allConteos, setAllConteos] = useState<ConteoDiario[]>([])

  // Client filter
  const isClient = usuario?.rol === 'client_admin' || usuario?.rol === 'client_viewer'
  const canFilterByClient = !isClient // superuser, admin can filter
  const userClienteId = usuario?.clienteId ?? null
  const [selectedClienteId, setSelectedClienteId] = useState<string | null>(
    isClient ? userClienteId : null
  )

  // Filtered data based on selected client
  const buses = useMemo(() => {
    if (!selectedClienteId) return allBuses
    return allBuses.filter((b) => b.clienteId === selectedClienteId)
  }, [allBuses, selectedClienteId])

  const eventos = useMemo(() => {
    if (!selectedClienteId) return allEventos
    const clientBusIds = buses.map((b) => b.id)
    return allEventos.filter((e) => clientBusIds.includes(e.busId))
  }, [allEventos, selectedClienteId, buses])

  const despachos = useMemo(() => {
    if (!selectedClienteId) return allDespachos
    return allDespachos.filter((d) => d.clienteId === selectedClienteId)
  }, [allDespachos, selectedClienteId])

  const conteos = useMemo(() => {
    if (!selectedClienteId) return allConteos
    return allConteos.filter((c) => c.clienteId === selectedClienteId)
  }, [allConteos, selectedClienteId])

  // Get date range
  const getDateRange = useCallback((range: DateRange) => {
    const now = new Date()
    switch (range) {
      case 'today':
        return { start: startOfDay(now), end: endOfDay(now), days: 1 }
      case '7d':
        return { start: startOfDay(subDays(now, 6)), end: endOfDay(now), days: 7 }
      case '14d':
        return { start: startOfDay(subDays(now, 13)), end: endOfDay(now), days: 14 }
      case '30d':
        return { start: startOfDay(subDays(now, 29)), end: endOfDay(now), days: 30 }
    }
  }, [])

  // Load data
  const loadData = useCallback(async () => {
    try {
      const { start, end } = getDateRange(dateRange)
      const fechaDesde = format(start, 'yyyy-MM-dd')
      const fechaHasta = format(end, 'yyyy-MM-dd')

      const [busesResult, clientesResult, eventosResult, despachosResult, conteosResult] =
        await Promise.all([
          listBuses({ limit: 500 }),
          listClientes({ limit: 100 }),
          listEventos({ limit: 500, fechaDesde: start, fechaHasta: end }),
          listDespachos({ limit: 500, fechaDesde: start, fechaHasta: end }),
          getConteosDiariosForDashboard({ fechaDesde, fechaHasta }),
        ])

      // Map buses with client names
      const busesConDetalles: BusConDetalles[] = busesResult.data.map((bus) => {
        const cliente = clientesResult.data.find((c) => c.id === bus.clienteId)
        return {
          ...bus,
          clienteNombre: cliente?.nombre ?? '',
          sucursalNombre: '',
          novedadesHoy: 0,
          conteoDia: undefined,
        }
      })
      setAllBuses(busesConDetalles)
      setClientes(clientesResult.data)

      // Map eventos with bus names
      const eventosConDetalles: EventoConDetalles[] = eventosResult.data.map((evento) => ({
        ...evento,
        busPlaca: busesResult.data.find((b) => b.id === evento.busId)?.placa ?? evento.busId,
        camaraNombre: evento.camaraId,
        novedadNombre: evento.tipoNovedad,
        novedadCategoria: 'operativa' as const,
      }))
      setAllEventos(eventosConDetalles)
      setAllDespachos(despachosResult.data)
      setAllConteos(conteosResult)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      toast({
        title: t('common.error'),
        description: t('errors.generic'),
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [dateRange, getDateRange, toast, t])

  useEffect(() => {
    void loadData()
  }, [loadData])

  // Set client filter for client users
  useEffect(() => {
    if (isClient && userClienteId) {
      setSelectedClienteId(userClienteId)
    }
  }, [isClient, userClienteId])

  const handleRefresh = () => {
    setIsRefreshing(true)
    void loadData()
  }

  // Calculate KPIs
  const kpis = useMemo(() => {
    const busesActivos = buses.filter((b) => b.estado === 'activo').length
    const totalBuses = buses.length
    const totalClientes = clientes.length
    const novedadesNuevas = eventos.filter((e) => e.estado === 'nuevo').length
    const despachosCompletados = despachos.filter((d) => d.estado === 'completado').length
    const despachosPendientes = despachos.filter(
      (d) => d.estado === 'pendiente' || d.estado === 'en_curso'
    ).length

    return {
      busesActivos,
      totalBuses,
      totalClientes,
      novedadesNuevas,
      totalNovedades: eventos.length,
      despachosCompletados,
      despachosPendientes,
      totalDespachos: despachos.length,
    }
  }, [buses, clientes, eventos, despachos])

  // Flota chart data
  const flotaChartData = useMemo(() => {
    const activos = buses.filter((b) => b.estado === 'activo').length
    const inactivos = buses.filter((b) => b.estado === 'inactivo').length
    const mantenimiento = buses.filter((b) => b.estado === 'mantenimiento').length
    const sinConexion = buses.filter((b) => b.estado === 'sin_conexion').length

    return [
      { name: t('buses.estados.activo'), value: activos, color: '#10b981' },
      { name: t('buses.estados.inactivo'), value: inactivos, color: '#6b7280' },
      { name: t('buses.estados.mantenimiento'), value: mantenimiento, color: '#f59e0b' },
      { name: t('buses.estados.sin_conexion'), value: sinConexion, color: '#ef4444' },
    ]
  }, [buses, t])

  // Novedades by type chart data
  const novedadesChartData = useMemo(() => {
    const countByType: Record<string, number> = {}
    eventos.forEach((e) => {
      const tipo = e.tipoNovedad || 'Otro'
      countByType[tipo] = (countByType[tipo] ?? 0) + 1
    })

    return Object.entries(countByType).map(([tipo, cantidad]) => ({
      tipo: tipo.replace(/_/g, ' '),
      cantidad,
    }))
  }, [eventos])

  // Passenger data from conteosDiarios
  const passengerChartData = useMemo(() => {
    const { days } = getDateRange(dateRange)

    if (selectedClienteId) {
      // Single client mode: show average per day
      const data: Record<string, unknown>[] = []
      for (let i = days - 1; i >= 0; i--) {
        const date = subDays(new Date(), i)
        const dateStr = format(date, 'yyyy-MM-dd')
        const dayConteos = conteos.filter((c) => c.fecha === dateStr)
        const totalEntradas = dayConteos.reduce((sum, c) => sum + c.totalEntradas, 0)
        const totalSalidas = dayConteos.reduce((sum, c) => sum + c.totalSalidas, 0)
        const promedio = (totalEntradas + totalSalidas) / 2

        data.push({
          fecha: format(date, 'dd MMM', { locale: dateLocale }),
          promedio: Math.round(promedio),
        })
      }
      return { data, clients: undefined, totalPassengers: undefined }
    } else {
      // Multi-client mode: show one line per client
      const clientsWithData = new Set<string>()
      allConteos.forEach((c) => {
        if (c.clienteId) clientsWithData.add(c.clienteId)
      })

      const clientLines = Array.from(clientsWithData).map((clienteId, index) => {
        const cliente = clientes.find((c) => c.id === clienteId)
        return {
          key: clienteId,
          name: cliente?.nombre ?? clienteId,
          color: CLIENT_COLORS[index % CLIENT_COLORS.length] ?? '#3b82f6',
        }
      })

      const data: Record<string, unknown>[] = []
      for (let i = days - 1; i >= 0; i--) {
        const date = subDays(new Date(), i)
        const dateStr = format(date, 'yyyy-MM-dd')
        const dayData: Record<string, unknown> = {
          fecha: format(date, 'dd MMM', { locale: dateLocale }),
        }

        // Calculate average for each client
        clientLines.forEach((client) => {
          const clientDayConteos = allConteos.filter(
            (c) => c.fecha === dateStr && c.clienteId === client.key
          )
          const totalEntradas = clientDayConteos.reduce((sum, c) => sum + c.totalEntradas, 0)
          const totalSalidas = clientDayConteos.reduce((sum, c) => sum + c.totalSalidas, 0)
          const promedio = (totalEntradas + totalSalidas) / 2
          dayData[client.key] = Math.round(promedio)
        })

        data.push(dayData)
      }

      // Calculate total passengers
      const totalPassengers = allConteos.reduce(
        (sum, c) => sum + (c.totalEntradas + c.totalSalidas) / 2,
        0
      )

      return { data, clients: clientLines, totalPassengers }
    }
  }, [conteos, allConteos, clientes, selectedClienteId, dateRange, getDateRange, dateLocale])

  // Despachos chart data
  const despachosChartData = useMemo(() => {
    const { days } = getDateRange(dateRange)
    const data = []
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i)
      const dateStr = format(date, 'yyyy-MM-dd')

      // Filter despachos for this date
      const dayDespachos = despachos.filter((d) => {
        const despachoDate = 'toDate' in d.fechaHora ? d.fechaHora.toDate() : new Date(d.fechaHora)
        return format(despachoDate, 'yyyy-MM-dd') === dateStr
      })

      data.push({
        fecha: format(date, 'dd MMM', { locale: dateLocale }),
        completados: dayDespachos.filter((d) => d.estado === 'completado').length,
        pendientes: dayDespachos.filter((d) => d.estado === 'pendiente' || d.estado === 'en_curso')
          .length,
        cancelados: dayDespachos.filter((d) => d.estado === 'cancelado').length,
      })
    }
    return data
  }, [despachos, dateRange, getDateRange, dateLocale])

  // Get selected client name
  const selectedClienteName = useMemo(() => {
    if (!selectedClienteId) return t('dashboard.allClients')
    return clientes.find((c) => c.id === selectedClienteId)?.nombre ?? t('clientes.title')
  }, [selectedClienteId, clientes, t])

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
        description={
          selectedClienteId
            ? `${t('common.filter')}: ${selectedClienteName}`
            : t('dashboard.description')
        }
        actions={
          <div className="flex flex-wrap items-center gap-3">
            {/* Client Filter - only for superusers/admins */}
            {canFilterByClient && clientes.length > 0 && (
              <Select
                value={selectedClienteId ?? 'all'}
                onValueChange={(v) => {
                  setSelectedClienteId(v === 'all' ? null : v)
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder={t('dashboard.filterClient')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('dashboard.allClients')}</SelectItem>
                  {clientes.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Date Range Filter */}
            <Select
              value={dateRange}
              onValueChange={(v) => {
                setDateRange(v as DateRange)
              }}
            >
              <SelectTrigger className="w-[160px]" data-tour="date-filter">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">{t('dashboard.today')}</SelectItem>
                <SelectItem value="7d">{t('dashboard.last7days')}</SelectItem>
                <SelectItem value="14d">{t('dashboard.last14days')}</SelectItem>
                <SelectItem value="30d">{t('dashboard.last30days')}</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {t('common.refresh')}
            </Button>
          </div>
        }
      />

      {/* KPIs */}
      <KPIGrid columns={4} data-tour="kpi-grid">
        <KPICard
          title={t('dashboard.activeBuses')}
          value={kpis.busesActivos}
          description={`${t('common.of')} ${String(kpis.totalBuses)} ${t('dashboard.registered')}`}
          icon={Bus}
          variant={kpis.busesActivos > 0 ? 'success' : 'default'}
          trend={
            kpis.totalBuses > 0
              ? { value: Math.round((kpis.busesActivos / kpis.totalBuses) * 100), isPositive: true }
              : undefined
          }
        />
        <KPICard
          title={t('dashboard.novelties')}
          value={kpis.novedadesNuevas}
          description={`${t('common.of')} ${String(kpis.totalNovedades)} ${t('dashboard.inPeriod')}`}
          icon={AlertTriangle}
          variant={kpis.novedadesNuevas > 10 ? 'warning' : 'default'}
        />
        <KPICard
          title={t('dashboard.dispatches')}
          value={kpis.despachosCompletados}
          description={`${String(kpis.despachosPendientes)} ${t('dashboard.pending')}`}
          icon={ClipboardList}
          variant="default"
        />
        {!isClient && !selectedClienteId && (
          <KPICard
            title={t('dashboard.clients')}
            value={kpis.totalClientes}
            description={t('dashboard.activeCompanies')}
            icon={Building2}
          />
        )}
        {(isClient || selectedClienteId) && (
          <KPICard
            title={t('dashboard.operativity')}
            value={`${String(kpis.totalBuses > 0 ? Math.round((kpis.busesActivos / kpis.totalBuses) * 100) : 0)}%`}
            description={t('dashboard.fleetActive')}
            icon={TrendingUp}
            variant={
              kpis.totalBuses > 0 && kpis.busesActivos / kpis.totalBuses > 0.8
                ? 'success'
                : 'warning'
            }
          />
        )}
      </KPIGrid>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div data-tour="passenger-chart">
          <PassengerChart
            data={passengerChartData.data}
            clients={passengerChartData.clients}
            totalPassengers={passengerChartData.totalPassengers}
            title={t('dashboard.passengerCount')}
            description={`${t('dashboard.trendOf')} ${dateRange === 'today' ? t('dashboard.today').toLowerCase() : `${String(getDateRange(dateRange).days)} ${t('common.days')}`}`}
          />
        </div>
        <FlotaDonutChart
          data={flotaChartData}
          total={buses.length}
          title={t('dashboard.fleetStatus')}
          description={t('dashboard.vehicleDistribution')}
        />
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <NovedadesChart
          data={novedadesChartData}
          title={t('dashboard.noveltiesByType')}
          description={t('dashboard.eventsDetected')}
        />
        <DespachosChart
          data={despachosChartData}
          title={t('dashboard.dailyDispatches')}
          description={t('dashboard.operationStatus')}
        />
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <NovedadesRecientes
          eventos={eventos.slice(0, 6)}
          onVerTodos={() => {
            navigate('/novedades')
          }}
          onVerEvento={(evento) => {
            navigate(`/novedades/${evento.id}`)
          }}
        />

        {/* Quick Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              {t('dashboard.periodSummary')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border p-4">
                <div className="text-sm text-muted-foreground">
                  {t('dashboard.totalPassengers')}
                </div>
                <div className="mt-1 text-2xl font-bold text-blue-600">
                  {Math.round(
                    conteos.reduce((sum, c) => sum + (c.totalEntradas + c.totalSalidas) / 2, 0)
                  ).toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">{t('dashboard.inPeriod')}</div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="text-sm text-muted-foreground">{t('dashboard.completionRate')}</div>
                <div className="mt-1 text-2xl font-bold text-emerald-600">
                  {kpis.totalDespachos > 0
                    ? Math.round((kpis.despachosCompletados / kpis.totalDespachos) * 100)
                    : 0}
                  %
                </div>
                <div className="text-xs text-muted-foreground">
                  {t('dashboard.successfulDispatches')}
                </div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="text-sm text-muted-foreground">{t('dashboard.dailyAverage')}</div>
                <div className="mt-1 text-2xl font-bold">
                  {passengerChartData.data.length > 0
                    ? Math.round(
                        conteos.reduce(
                          (sum, c) => sum + (c.totalEntradas + c.totalSalidas) / 2,
                          0
                        ) / passengerChartData.data.length
                      ).toLocaleString()
                    : 0}
                </div>
                <div className="text-xs text-muted-foreground">{t('dashboard.passengersDay')}</div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="text-sm text-muted-foreground">{t('dashboard.noveltiesBus')}</div>
                <div className="mt-1 text-2xl font-bold text-amber-600">
                  {buses.length > 0 ? (eventos.length / buses.length).toFixed(1) : 0}
                </div>
                <div className="text-xs text-muted-foreground">{t('dashboard.periodAverage')}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
