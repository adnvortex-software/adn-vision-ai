import { Bus as BusIcon, MapPin, User, Video, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BusStatusIndicator, StatusDot } from './BusStatusIndicator'
import { cn } from '@/lib/utils'
import type { BusConDetalles } from '@/types/bus'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Timestamp } from 'firebase/firestore'

interface BusCardProps {
  bus: BusConDetalles
  onView?: () => void
  onEdit?: () => void
  className?: string
}

const VEHICLE_TYPE_LABELS: Record<string, string> = {
  bus: 'Bus',
  buseta: 'Buseta',
  van: 'Van',
  microbus: 'Microbus',
  otro: 'Otro',
}

function formatLastHeartbeat(timestamp: Timestamp | null): string {
  if (!timestamp) return 'Sin datos'
  try {
    const date = timestamp.toDate()
    return formatDistanceToNow(date, { addSuffix: true, locale: es })
  } catch {
    return 'Sin datos'
  }
}

export function BusCard({ bus, onView, onEdit, className }: BusCardProps) {
  return (
    <Card className={cn('overflow-hidden transition-shadow hover:shadow-md', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <BusIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{bus.placa}</h3>
                <StatusDot estado={bus.estado} pulse={bus.estado === 'activo'} />
              </div>
              <p className="text-sm text-muted-foreground">
                {VEHICLE_TYPE_LABELS[bus.tipoVehiculo] ?? bus.tipoVehiculo}
                {bus.rutaTexto && ` - ${bus.rutaTexto}`}
              </p>
            </div>
          </div>
          <BusStatusIndicator estado={bus.estado} size="sm" />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Detalles */}
        <div className="grid gap-2 text-sm">
          {bus.sucursalNombre && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{bus.sucursalNombre}</span>
            </div>
          )}
          {bus.conductorNombre && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{bus.conductorNombre}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Video className="h-4 w-4" />
            <span>{bus.numCamarasConfiguradas} camaras</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Ultimo ping: {formatLastHeartbeat(bus.lastHeartbeat)}</span>
          </div>
        </div>

        {/* Conteo del dia */}
        {bus.conteoDia && (
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Conteo del dia</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-lg font-bold text-green-600">{bus.conteoDia.entradas}</p>
                <p className="text-xs text-muted-foreground">Entradas</p>
              </div>
              <div>
                <p className="text-lg font-bold text-red-600">{bus.conteoDia.salidas}</p>
                <p className="text-xs text-muted-foreground">Salidas</p>
              </div>
              <div>
                <p className="text-lg font-bold text-primary">{bus.conteoDia.aforo}</p>
                <p className="text-xs text-muted-foreground">Aforo</p>
              </div>
            </div>
          </div>
        )}

        {/* Novedades */}
        {bus.novedadesHoy !== undefined && bus.novedadesHoy > 0 && (
          <div className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2">
            <span className="text-sm font-medium text-amber-700">Novedades hoy</span>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-sm font-bold text-amber-700">
              {bus.novedadesHoy}
            </span>
          </div>
        )}

        {/* Acciones */}
        {(onView ?? onEdit) && (
          <div className="flex gap-2 pt-2">
            {onView && (
              <Button variant="outline" size="sm" className="flex-1" onClick={onView}>
                Ver detalles
              </Button>
            )}
            {onEdit && (
              <Button variant="outline" size="sm" className="flex-1" onClick={onEdit}>
                Editar
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
