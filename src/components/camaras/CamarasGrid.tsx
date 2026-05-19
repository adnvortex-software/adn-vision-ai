import { Video, Settings, Power, PowerOff, ImageOff, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PerfilCamaraBadge } from './PerfilCamaraSelect'
import { cn } from '@/lib/utils'
import type { Camara } from '@/types/bus'
import type { Entity } from '@/types/firestore'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Timestamp } from 'firebase/firestore'

interface CamarasGridProps {
  camaras: Entity<Camara>[]
  isLoading?: boolean
  onEdit?: (camara: Entity<Camara>) => void
  onToggle?: (camara: Entity<Camara>) => void
  onCapture?: (camara: Entity<Camara>) => void
  className?: string
}

function formatLastCapture(timestamp: Timestamp | null): string {
  if (!timestamp) return 'Sin capturas'
  try {
    const date = timestamp.toDate()
    return formatDistanceToNow(date, { addSuffix: true, locale: es })
  } catch {
    return 'Sin capturas'
  }
}

export function CamarasGrid({
  camaras,
  isLoading = false,
  onEdit,
  onToggle,
  onCapture,
  className,
}: CamarasGridProps) {
  if (isLoading) {
    return (
      <div className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-3', className)}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 w-24 rounded bg-muted" />
            </CardHeader>
            <CardContent>
              <div className="aspect-video rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (camaras.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <Video className="h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-medium">Sin camaras configuradas</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Agrega una camara para comenzar a monitorear el vehiculo.
        </p>
      </div>
    )
  }

  return (
    <div className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-3', className)}>
      {camaras.map((camara) => (
        <CamaraCard
          key={camara.id}
          camara={camara}
          onEdit={onEdit}
          onToggle={onToggle}
          onCapture={onCapture}
        />
      ))}
    </div>
  )
}

interface CamaraCardProps {
  camara: Entity<Camara>
  onEdit?: (camara: Entity<Camara>) => void
  onToggle?: (camara: Entity<Camara>) => void
  onCapture?: (camara: Entity<Camara>) => void
}

function CamaraCard({ camara, onEdit, onToggle, onCapture }: CamaraCardProps) {
  return (
    <Card className={cn('overflow-hidden', !camara.habilitada && 'opacity-60')}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">{camara.nombre}</CardTitle>
            <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
              CH {camara.canal}
            </span>
          </div>
          <PerfilCamaraBadge perfil={camara.perfil} size="sm" />
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Screenshot preview */}
        <div className="relative aspect-video overflow-hidden rounded-md bg-muted">
          {camara.ultimoScreenshot ? (
            <img
              src={camara.ultimoScreenshot}
              alt={`Vista de ${camara.nombre}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <ImageOff className="h-8 w-8 text-muted-foreground/50" />
            </div>
          )}

          {/* Status overlay */}
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                camara.habilitada ? 'bg-green-500/80 text-white' : 'bg-gray-500/80 text-white'
              )}
            >
              {camara.habilitada ? (
                <>
                  <Power className="h-3 w-3" />
                  Activa
                </>
              ) : (
                <>
                  <PowerOff className="h-3 w-3" />
                  Deshabilitada
                </>
              )}
            </span>
          </div>
        </div>

        {/* Last capture time */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>Ultima captura: {formatLastCapture(camara.ultimoScreenshotAt)}</span>
        </div>

        {/* Inference config */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>
            {camara.resolucionInferenciaW}x{camara.resolucionInferenciaH}
          </span>
          <span>@</span>
          <span>{camara.fpsInferencia} FPS</span>
        </div>

        {/* Actions */}
        {(onEdit ?? onToggle ?? onCapture) && (
          <div className="flex gap-2 pt-2">
            {onCapture && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => {
                  onCapture(camara)
                }}
                disabled={!camara.habilitada}
              >
                Capturar
              </Button>
            )}
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  onEdit(camara)
                }}
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}
            {onToggle && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  onToggle(camara)
                }}
              >
                {camara.habilitada ? (
                  <PowerOff className="h-4 w-4" />
                ) : (
                  <Power className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
