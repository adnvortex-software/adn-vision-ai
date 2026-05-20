import { Bus, Users, AlertTriangle, Clock, Wifi } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BusStatusIndicator, StatusDot } from '@/components/buses/BusStatusIndicator'
import type { BusConDetalles } from '@/types/bus'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import type { Timestamp } from 'firebase/firestore'

interface BusesEnVivoTableProps {
  buses: BusConDetalles[]
  isLoading?: boolean
  onVerBus?: (bus: BusConDetalles) => void
  className?: string
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

export function BusesEnVivoTable({
  buses,
  isLoading = false,
  onVerBus,
  className,
}: BusesEnVivoTableProps) {
  // Sort buses: active first, then by novedades count
  const sortedBuses = [...buses].sort((a, b) => {
    // Activos first
    if (a.estado === 'activo' && b.estado !== 'activo') return -1
    if (a.estado !== 'activo' && b.estado === 'activo') return 1
    // Then by novedades count
    return (b.novedadesHoy ?? 0) - (a.novedadesHoy ?? 0)
  })

  if (isLoading) {
    return (
      <Card className={cn(className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5 text-green-500" />
            Buses en Vivo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex animate-pulse items-center gap-4 border-b pb-3">
                <div className="h-8 w-8 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-20 rounded bg-muted" />
                  <div className="h-3 w-32 rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wifi className="h-5 w-5 text-green-500" />
          Buses en Vivo
        </CardTitle>
        <CardDescription>Estado actual de la flota</CardDescription>
      </CardHeader>
      <CardContent>
        {buses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Bus className="h-12 w-12 text-muted-foreground/30" />
            <p className="mt-4 text-sm font-medium">Sin buses configurados</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Los buses apareceran aqui cuando esten conectados
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedBuses.slice(0, 10).map((bus) => (
              <div
                key={bus.id}
                className={cn(
                  'flex items-center gap-4 rounded-lg border p-3 transition-colors',
                  onVerBus && 'cursor-pointer hover:bg-muted/50'
                )}
                onClick={() => onVerBus?.(bus)}
              >
                {/* Status indicator */}
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <StatusDot estado={bus.estado} pulse={bus.estado === 'activo'} />
                </div>

                {/* Bus info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold">{bus.placa}</span>
                    <BusStatusIndicator estado={bus.estado} size="sm" showLabel={false} />
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{bus.sucursalNombre ?? '-'}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatLastHeartbeat(bus.lastHeartbeat)}
                    </span>
                  </div>
                </div>

                {/* Conteo del dia */}
                {bus.conteoDia && (
                  <div className="hidden text-right sm:block">
                    <div className="flex items-center gap-1 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{bus.conteoDia.aforo}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      +{bus.conteoDia.entradas} / -{bus.conteoDia.salidas}
                    </div>
                  </div>
                )}

                {/* Novedades count */}
                {bus.novedadesHoy !== undefined && bus.novedadesHoy > 0 && (
                  <div className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1">
                    <AlertTriangle className="h-3 w-3 text-amber-600" />
                    <span className="text-xs font-medium text-amber-700">{bus.novedadesHoy}</span>
                  </div>
                )}
              </div>
            ))}

            {buses.length > 10 && (
              <div className="pt-2 text-center">
                <Button variant="ghost" size="sm">
                  Ver todos ({buses.length})
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
