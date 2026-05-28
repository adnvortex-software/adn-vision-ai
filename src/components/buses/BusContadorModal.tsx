import { useState, useEffect, useMemo } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarIcon, Users, LogIn, LogOut, Clock, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import type { BusConDetalles } from '@/types/bus'
import {
  subscribeToConteo,
  subscribeToConteoEventos,
  type ConteoResumen,
  type ConteoEvento,
} from '@/services/conteos.service'

interface BusContadorModalProps {
  bus: BusConDetalles | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BusContadorModal({ bus, open, onOpenChange }: BusContadorModalProps) {
  // Filter mode: 'day' = single day picker, 'range' = date/time range
  const [filterMode, setFilterMode] = useState<'day' | 'range'>('day')

  // Day filter (simple mode)
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(undefined)

  // Range filter (advanced mode)
  const [fechaInicio, setFechaInicio] = useState<Date | undefined>(undefined)
  const [fechaFin, setFechaFin] = useState<Date | undefined>(undefined)
  const [horaInicio, setHoraInicio] = useState<string>('')
  const [horaFin, setHoraFin] = useState<string>('')

  const [isLoading, setIsLoading] = useState(true)
  const [conteoResumen, setConteoResumen] = useState<ConteoResumen | null>(null)
  const [eventos, setEventos] = useState<ConteoEvento[]>([])

  // Subscribe to real-time data when modal opens
  useEffect(() => {
    if (!bus || !open) {
      setIsLoading(true)
      setConteoResumen(null)
      setEventos([])
      return
    }

    setIsLoading(true)

    // Subscribe to conteo resumen (real-time)
    const unsubConteo = subscribeToConteo(bus.id, (conteo) => {
      setConteoResumen(conteo)
      setIsLoading(false)
    })

    // Subscribe to eventos (real-time)
    const unsubEventos = subscribeToConteoEventos(
      bus.id,
      (eventosData) => {
        setEventos(eventosData)
      },
      500
    )

    return () => {
      unsubConteo()
      unsubEventos()
    }
  }, [bus, open])

  // Filter events based on selected mode
  const eventosFiltrados = useMemo(() => {
    let filtered = [...eventos]

    if (filterMode === 'day' && selectedDay) {
      // Filter by single day
      const startOfDay = new Date(selectedDay)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(selectedDay)
      endOfDay.setHours(23, 59, 59, 999)

      filtered = filtered.filter((e) => {
        const eventDate = e.timestamp.toDate()
        return eventDate >= startOfDay && eventDate <= endOfDay
      })
    } else if (filterMode === 'range') {
      // Filter by date/time range
      if (fechaInicio) {
        const startDate = new Date(fechaInicio)
        if (horaInicio) {
          const [hours, minutes] = horaInicio.split(':').map(Number)
          startDate.setHours(hours ?? 0, minutes ?? 0, 0, 0)
        } else {
          startDate.setHours(0, 0, 0, 0)
        }
        filtered = filtered.filter((e) => e.timestamp.toDate() >= startDate)
      }

      if (fechaFin) {
        const endDate = new Date(fechaFin)
        if (horaFin) {
          const [hours, minutes] = horaFin.split(':').map(Number)
          endDate.setHours(hours ?? 23, minutes ?? 59, 59, 999)
        } else {
          endDate.setHours(23, 59, 59, 999)
        }
        filtered = filtered.filter((e) => e.timestamp.toDate() <= endDate)
      }
    }

    return filtered
  }, [eventos, filterMode, selectedDay, fechaInicio, fechaFin, horaInicio, horaFin])

  // Check if any filter is active
  const hasActiveFilter =
    filterMode === 'day'
      ? selectedDay !== undefined
      : fechaInicio !== undefined || fechaFin !== undefined || horaInicio !== '' || horaFin !== ''

  // Calculate totals - use real-time data if no filters, otherwise calculate from filtered events
  const totales = useMemo(() => {
    // If no filters and we have real-time resumen, use it
    if (!hasActiveFilter && conteoResumen) {
      return {
        entradas: conteoResumen.entradasDia,
        salidas: conteoResumen.salidasDia,
        pasajeros: conteoResumen.aforoActual,
      }
    }

    // Otherwise calculate from filtered events
    const entradas = eventosFiltrados.filter((e) => e.tipo === 'entrada').length
    const salidas = eventosFiltrados.filter((e) => e.tipo === 'salida').length
    return {
      entradas,
      salidas,
      pasajeros: Math.max(0, entradas - salidas),
    }
  }, [eventosFiltrados, conteoResumen, hasActiveFilter])

  const clearFilters = () => {
    setSelectedDay(undefined)
    setFechaInicio(undefined)
    setFechaFin(undefined)
    setHoraInicio('')
    setHoraFin('')
  }

  const handleFilterModeChange = (checked: boolean) => {
    // Clear all filters when switching modes
    clearFilters()
    setFilterMode(checked ? 'range' : 'day')
  }

  if (!bus) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Contador de Pasajeros - {bus.placa}
            {bus.numeroInterno !== undefined && (
              <span className="text-muted-foreground">#{bus.numeroInterno}</span>
            )}
          </DialogTitle>
          <DialogDescription>
            Visualiza las entradas y salidas de pasajeros del vehiculo
          </DialogDescription>
        </DialogHeader>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Summary Cards */}
        <div className={cn('grid gap-4 md:grid-cols-3', isLoading && 'opacity-50')}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Entradas</CardTitle>
              <LogIn className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{totales.entradas}</div>
              <p className="text-xs text-muted-foreground">pasajeros que subieron</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Salidas</CardTitle>
              <LogOut className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{totales.salidas}</div>
              <p className="text-xs text-muted-foreground">pasajeros que bajaron</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En el Vehiculo</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{totales.pasajeros}</div>
              <p className="text-xs text-muted-foreground">pasajeros actuales</p>
            </CardContent>
          </Card>
        </div>

        {/* Date/Time Filters */}
        <div className="rounded-lg border p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h4 className="text-sm font-medium">Filtrar eventos</h4>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'text-sm',
                    filterMode === 'day' ? 'font-medium' : 'text-muted-foreground'
                  )}
                >
                  Por dia
                </span>
                <Switch checked={filterMode === 'range'} onCheckedChange={handleFilterModeChange} />
                <span
                  className={cn(
                    'text-sm',
                    filterMode === 'range' ? 'font-medium' : 'text-muted-foreground'
                  )}
                >
                  Por rango
                </span>
              </div>
            </div>
            {hasActiveFilter && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Limpiar filtros
              </Button>
            )}
          </div>

          {/* Day Filter (Simple Mode) */}
          {filterMode === 'day' && (
            <div className="mt-2 space-y-3">
              <Label>Seleccionar dia&nbsp; </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal md:w-64',
                      !selectedDay && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDay ? format(selectedDay, 'PPP', { locale: es }) : 'Selecciona un dia'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={selectedDay} onSelect={setSelectedDay} />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Range Filter (Advanced Mode) */}
          {filterMode === 'range' && (
            <div className="grid gap-4 md:grid-cols-2">
              {/* Fecha Inicio */}
              <div className="space-y-2">
                <Label>Desde&nbsp; </Label>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'flex-1 justify-start text-left font-normal',
                          !fechaInicio && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {fechaInicio ? format(fechaInicio, 'PPP', { locale: es }) : 'Fecha inicio'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={fechaInicio} onSelect={setFechaInicio} />
                    </PopoverContent>
                  </Popover>
                  <div className="relative w-28">
                    <Clock className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="time"
                      value={horaInicio}
                      onChange={(e) => {
                        setHoraInicio(e.target.value)
                      }}
                      className="pl-8"
                      placeholder="00:00"
                    />
                  </div>
                </div>
              </div>

              {/* Fecha Fin */}
              <div className="space-y-2">
                <Label>Hasta&nbsp; </Label>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'flex-1 justify-start text-left font-normal',
                          !fechaFin && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {fechaFin ? format(fechaFin, 'PPP', { locale: es }) : 'Fecha fin'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={fechaFin} onSelect={setFechaFin} />
                    </PopoverContent>
                  </Popover>
                  <div className="relative w-28">
                    <Clock className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="time"
                      value={horaFin}
                      onChange={(e) => {
                        setHoraFin(e.target.value)
                      }}
                      className="pl-8"
                      placeholder="23:59"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* History */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">
            Historico de eventos ({eventosFiltrados.length})
            {conteoResumen?.fechaOperativa && (
              <span className="ml-2 text-xs text-muted-foreground">
                - Fecha operativa: {conteoResumen.fechaOperativa}
              </span>
            )}
          </h4>
          <div className="max-h-64 overflow-y-auto rounded-lg border">
            {eventosFiltrados.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                {isLoading ? 'Cargando eventos...' : 'No hay eventos en el rango seleccionado'}
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted/80 backdrop-blur">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Fecha/Hora</th>
                    <th className="px-3 py-2 text-left font-medium">Tipo</th>
                    <th className="px-3 py-2 text-left font-medium">Aforo</th>
                    <th className="px-3 py-2 text-left font-medium">Camara</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {eventosFiltrados.map((evento) => (
                    <tr key={evento.id} className="hover:bg-muted/50">
                      <td className="px-3 py-2 text-muted-foreground">
                        {format(evento.timestamp.toDate(), 'dd/MM/yyyy HH:mm:ss', { locale: es })}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                            evento.tipo === 'entrada'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                              : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                          )}
                        >
                          {evento.tipo === 'entrada' ? (
                            <LogIn className="h-3 w-3" />
                          ) : (
                            <LogOut className="h-3 w-3" />
                          )}
                          {evento.tipo === 'entrada' ? 'Entrada' : 'Salida'}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-medium">{evento.aforoTrasEvento}</td>
                      <td className="px-3 py-2 text-muted-foreground">{evento.camaraId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
