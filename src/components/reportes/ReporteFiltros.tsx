import { useState } from 'react'
import { Filter, Calendar, Bus, FileText, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import type { Entity } from '@/types/firestore'
import type { Sucursal } from '@/types/cliente'
import type { BusConDetalles } from '@/types/bus'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import { cn } from '@/lib/utils'

type ReporteTipo = 'novedades' | 'conteo' | 'consolidado'

interface ReporteFiltrosProps {
  sucursales: Entity<Sucursal>[]
  buses: BusConDetalles[]
  onGenerar: (filtros: ReporteFiltrosData) => void
  isGenerando?: boolean
  className?: string
}

export interface ReporteFiltrosData {
  tipo: ReporteTipo
  fechaInicio: Date
  fechaFin: Date
  sucursalId?: string
  busIds: string[]
}

const TIPO_OPTIONS: { value: ReporteTipo; label: string; description: string }[] = [
  { value: 'novedades', label: 'Reporte de Novedades', description: 'Eventos detectados por tipo' },
  { value: 'conteo', label: 'Reporte de Conteo', description: 'Entradas y salidas por bus' },
  {
    value: 'consolidado',
    label: 'Reporte Consolidado',
    description: 'Resumen general de la operación',
  },
]

export function ReporteFiltros({
  sucursales,
  buses,
  onGenerar,
  isGenerando = false,
  className,
}: ReporteFiltrosProps) {
  const [tipo, setTipo] = useState<ReporteTipo>('novedades')
  const [fechaInicio, setFechaInicio] = useState<Date>(subDays(new Date(), 7))
  const [fechaFin, setFechaFin] = useState<Date>(new Date())
  const [sucursalId, setSucursalId] = useState<string>('')
  const [selectedBuses, setSelectedBuses] = useState<string[]>([])

  // Filter buses by sucursal
  const filteredBuses = sucursalId ? buses.filter((b) => b.sucursalId === sucursalId) : buses

  const handleToggleBus = (busId: string) => {
    setSelectedBuses((prev) =>
      prev.includes(busId) ? prev.filter((id) => id !== busId) : [...prev, busId]
    )
  }

  const handleSelectAllBuses = () => {
    if (selectedBuses.length === filteredBuses.length) {
      setSelectedBuses([])
    } else {
      setSelectedBuses(filteredBuses.map((b) => b.id))
    }
  }

  const handleGenerar = () => {
    onGenerar({
      tipo,
      fechaInicio: startOfDay(fechaInicio),
      fechaFin: endOfDay(fechaFin),
      sucursalId: sucursalId || undefined,
      busIds: selectedBuses,
    })
  }

  const isValid = fechaInicio <= fechaFin

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Generar Reporte
        </CardTitle>
        <CardDescription>Configura los filtros para generar el reporte</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tipo de reporte */}
        <div className="space-y-2">
          <Label>Tipo de Reporte</Label>
          <Select
            value={tipo}
            onValueChange={(v) => {
              setTipo(v as ReporteTipo)
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIPO_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  <div className="flex flex-col">
                    <span>{opt.label}</span>
                    <span className="text-xs text-muted-foreground">{opt.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Rango de fechas */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Fecha Inicio
            </Label>
            <Input
              type="date"
              value={format(fechaInicio, 'yyyy-MM-dd')}
              onChange={(e) => {
                setFechaInicio(new Date(e.target.value))
              }}
              max={format(fechaFin, 'yyyy-MM-dd')}
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Fecha Fin
            </Label>
            <Input
              type="date"
              value={format(fechaFin, 'yyyy-MM-dd')}
              onChange={(e) => {
                setFechaFin(new Date(e.target.value))
              }}
              min={format(fechaInicio, 'yyyy-MM-dd')}
              max={format(new Date(), 'yyyy-MM-dd')}
            />
          </div>
        </div>

        {/* Sucursal filter */}
        <div className="space-y-2">
          <Label>Sucursal (Opcional)</Label>
          <Select
            value={sucursalId}
            onValueChange={(v) => {
              setSucursalId(v)
              setSelectedBuses([])
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todas las sucursales" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas las sucursales</SelectItem>
              {sucursales.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.nombre} - {s.ciudad}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Bus selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Bus className="h-4 w-4" />
              Buses ({selectedBuses.length} de {filteredBuses.length})
            </Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleSelectAllBuses}
              disabled={filteredBuses.length === 0}
            >
              {selectedBuses.length === filteredBuses.length ? 'Deseleccionar' : 'Seleccionar'}{' '}
              todos
            </Button>
          </div>

          {filteredBuses.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay buses disponibles</p>
          ) : (
            <div className="max-h-40 space-y-2 overflow-auto rounded-lg border p-3">
              {filteredBuses.map((bus) => (
                <div key={bus.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`bus-${bus.id}`}
                    checked={selectedBuses.includes(bus.id)}
                    onCheckedChange={() => {
                      handleToggleBus(bus.id)
                    }}
                  />
                  <Label
                    htmlFor={`bus-${bus.id}`}
                    className="flex-1 cursor-pointer text-sm font-normal"
                  >
                    <span className="font-mono">{bus.placa}</span>
                    {bus.rutaTexto && (
                      <span className="ml-2 text-muted-foreground">- {bus.rutaTexto}</span>
                    )}
                  </Label>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button className="flex-1" onClick={handleGenerar} disabled={!isValid || isGenerando}>
            {isGenerando ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Generar Reporte
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
