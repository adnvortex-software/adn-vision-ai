import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarIcon, Users, LogIn, LogOut, Clock } from 'lucide-react'
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
import { cn } from '@/lib/utils'
import type { BusConDetalles } from '@/types/bus'

interface ContadorEvento {
  id: string
  tipo: 'entrada' | 'salida'
  cantidad: number
  timestamp: Date
  camaraId: string
  camaraNombre: string
}

interface BusContadorModalProps {
  bus: BusConDetalles | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Mock data for demonstration
function generateMockData(busId: string): ContadorEvento[] {
  const eventos: ContadorEvento[] = []
  const now = new Date()
  const camaras = ['Puerta Frontal', 'Puerta Trasera']

  // Generate events for the last 7 days
  for (let day = 0; day < 7; day++) {
    const date = new Date(now)
    date.setDate(date.getDate() - day)

    // Generate 10-20 events per day
    const numEvents = Math.floor(Math.random() * 10) + 10

    for (let i = 0; i < numEvents; i++) {
      const hour = Math.floor(Math.random() * 14) + 5 // 5am to 7pm
      const minute = Math.floor(Math.random() * 60)
      const eventDate = new Date(date)
      eventDate.setHours(hour, minute, 0, 0)

      eventos.push({
        id: `${busId}-${String(day)}-${String(i)}`,
        tipo: Math.random() > 0.45 ? 'entrada' : 'salida',
        cantidad: Math.floor(Math.random() * 3) + 1,
        timestamp: eventDate,
        camaraId: `cam-${String(Math.floor(Math.random() * 2))}`,
        camaraNombre: camaras[Math.floor(Math.random() * camaras.length)] ?? 'Camara',
      })
    }
  }

  // Sort by timestamp descending
  return eventos.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
}

export function BusContadorModal({ bus, open, onOpenChange }: BusContadorModalProps) {
  const [fechaInicio, setFechaInicio] = useState<Date | undefined>(undefined)
  const [fechaFin, setFechaFin] = useState<Date | undefined>(undefined)
  const [horaInicio, setHoraInicio] = useState<string>('')
  const [horaFin, setHoraFin] = useState<string>('')

  // Generate mock data when bus changes
  const allEventos = useMemo(() => {
    if (!bus) return []
    return generateMockData(bus.id)
  }, [bus])

  // Filter events based on date/time range
  const eventosFiltrados = useMemo(() => {
    let filtered = [...allEventos]

    if (fechaInicio) {
      const startDate = new Date(fechaInicio)
      if (horaInicio) {
        const [hours, minutes] = horaInicio.split(':').map(Number)
        startDate.setHours(hours ?? 0, minutes ?? 0, 0, 0)
      } else {
        startDate.setHours(0, 0, 0, 0)
      }
      filtered = filtered.filter((e) => e.timestamp >= startDate)
    }

    if (fechaFin) {
      const endDate = new Date(fechaFin)
      if (horaFin) {
        const [hours, minutes] = horaFin.split(':').map(Number)
        endDate.setHours(hours ?? 23, minutes ?? 59, 59, 999)
      } else {
        endDate.setHours(23, 59, 59, 999)
      }
      filtered = filtered.filter((e) => e.timestamp <= endDate)
    }

    return filtered
  }, [allEventos, fechaInicio, fechaFin, horaInicio, horaFin])

  // Calculate totals
  const totales = useMemo(() => {
    const entradas = eventosFiltrados
      .filter((e) => e.tipo === 'entrada')
      .reduce((sum, e) => sum + e.cantidad, 0)
    const salidas = eventosFiltrados
      .filter((e) => e.tipo === 'salida')
      .reduce((sum, e) => sum + e.cantidad, 0)
    return {
      entradas,
      salidas,
      pasajeros: Math.max(0, entradas - salidas),
    }
  }, [eventosFiltrados])

  const clearFilters = () => {
    setFechaInicio(undefined)
    setFechaFin(undefined)
    setHoraInicio('')
    setHoraFin('')
  }

  if (!bus) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Contador de Pasajeros - {bus.placa}
          </DialogTitle>
          <DialogDescription>
            Visualiza las entradas y salidas de pasajeros del vehiculo
          </DialogDescription>
        </DialogHeader>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
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
            <h4 className="text-sm font-medium">Filtrar por fecha y hora</h4>
            {(fechaInicio !== undefined ||
              fechaFin !== undefined ||
              horaInicio !== '' ||
              horaFin !== '') && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Limpiar filtros
              </Button>
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {/* Fecha Inicio */}
            <div className="space-y-2">
              <Label>Desde</Label>
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
                    <Calendar
                      mode="single"
                      selected={fechaInicio}
                      onSelect={setFechaInicio}
                      initialFocus
                    />
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
              <Label>Hasta</Label>
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
                    <Calendar
                      mode="single"
                      selected={fechaFin}
                      onSelect={setFechaFin}
                      initialFocus
                    />
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
        </div>

        {/* History */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Historico de eventos ({eventosFiltrados.length})</h4>
          <div className="max-h-64 overflow-y-auto rounded-lg border">
            {eventosFiltrados.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No hay eventos en el rango seleccionado
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted/80 backdrop-blur">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Fecha/Hora</th>
                    <th className="px-3 py-2 text-left font-medium">Tipo</th>
                    <th className="px-3 py-2 text-left font-medium">Cantidad</th>
                    <th className="px-3 py-2 text-left font-medium">Camara</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {eventosFiltrados.map((evento) => (
                    <tr key={evento.id} className="hover:bg-muted/50">
                      <td className="px-3 py-2 text-muted-foreground">
                        {format(evento.timestamp, 'dd/MM/yyyy HH:mm', { locale: es })}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                            evento.tipo === 'entrada'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
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
                      <td className="px-3 py-2 font-medium">{evento.cantidad}</td>
                      <td className="px-3 py-2 text-muted-foreground">{evento.camaraNombre}</td>
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
