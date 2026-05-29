import { AlertTriangle, Clock, ChevronRight, Bus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EventoEstadoBadge } from '@/components/novedades/NovedadesEventosTable'
import type { EventoConDetalles } from '@/types/novedad'
import { formatDistanceToNow } from 'date-fns'
import { es, enUS } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface NovedadesRecientesProps {
  eventos: EventoConDetalles[]
  isLoading?: boolean
  onVerTodos?: () => void
  onVerEvento?: (evento: EventoConDetalles) => void
  className?: string
}

export function NovedadesRecientes({
  eventos,
  isLoading = false,
  onVerTodos,
  onVerEvento,
  className,
}: NovedadesRecientesProps) {
  const { t, i18n } = useTranslation()
  const dateLocale = i18n.language.startsWith('en') ? enUS : es

  const formatTimestamp = (timestamp: unknown): string => {
    try {
      if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp) {
        const date = (timestamp as { toDate: () => Date }).toDate()
        return formatDistanceToNow(date, { addSuffix: true, locale: dateLocale })
      }
      return '-'
    } catch {
      return '-'
    }
  }

  if (isLoading) {
    return (
      <Card className={cn(className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            {t('dashboard.recentNovelties')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex animate-pulse items-center gap-3">
                <div className="h-10 w-10 rounded bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-muted" />
                  <div className="h-3 w-1/2 rounded bg-muted" />
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
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            {t('dashboard.recentNovelties')}
          </CardTitle>
          <CardDescription>{t('dashboard.lastAlertsDetected')}</CardDescription>
        </div>
        {onVerTodos && eventos.length > 0 && (
          <Button variant="ghost" size="sm" onClick={onVerTodos}>
            {t('common.seeAll')}
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {eventos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground/30" />
            <p className="mt-4 text-sm font-medium">{t('dashboard.noRecentNovelties')}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t('dashboard.alertsWillAppearHere')}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {eventos.slice(0, 5).map((evento) => (
              <div
                key={evento.id}
                className={cn(
                  'flex items-center gap-3 rounded-lg border p-3 transition-colors',
                  onVerEvento && 'cursor-pointer hover:bg-muted/50'
                )}
                onClick={() => onVerEvento?.(evento)}
              >
                {/* Screenshot thumbnail */}
                <div className="h-12 w-16 shrink-0 overflow-hidden rounded bg-muted">
                  {evento.screenshotUrl ? (
                    <img
                      src={evento.screenshotUrl}
                      alt={t('dashboard.capture')}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <AlertTriangle className="h-4 w-4 text-muted-foreground/50" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">
                      {evento.novedadNombre ?? evento.tipoNovedad}
                    </span>
                    <EventoEstadoBadge estado={evento.estado} size="sm" />
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Bus className="h-3 w-3" />
                      {evento.busPlaca ?? '-'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTimestamp(evento.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
