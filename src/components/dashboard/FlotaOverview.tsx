import { Bus, Wifi, WifiOff, Wrench, Power } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { BusState } from '@/config/constants'

interface FlotaOverviewProps {
  stats: {
    total: number
    activos: number
    inactivos: number
    mantenimiento: number
    sinConexion: number
  }
  className?: string
}

const STATUS_CONFIG: Record<
  BusState,
  {
    label: string
    icon: typeof Bus
    colorClass: string
    bgClass: string
  }
> = {
  activo: {
    label: 'Activos',
    icon: Wifi,
    colorClass: 'text-green-600',
    bgClass: 'bg-green-100',
  },
  inactivo: {
    label: 'Inactivos',
    icon: Power,
    colorClass: 'text-gray-500',
    bgClass: 'bg-gray-100',
  },
  mantenimiento: {
    label: 'Mantenimiento',
    icon: Wrench,
    colorClass: 'text-amber-600',
    bgClass: 'bg-amber-100',
  },
  sin_conexion: {
    label: 'Sin conexion',
    icon: WifiOff,
    colorClass: 'text-red-600',
    bgClass: 'bg-red-100',
  },
}

export function FlotaOverview({ stats, className }: FlotaOverviewProps) {
  const statusData: { key: BusState; count: number }[] = [
    { key: 'activo', count: stats.activos },
    { key: 'inactivo', count: stats.inactivos },
    { key: 'mantenimiento', count: stats.mantenimiento },
    { key: 'sin_conexion', count: stats.sinConexion },
  ]

  // Calculate percentage for progress bar
  const activePercentage = stats.total > 0 ? (stats.activos / stats.total) * 100 : 0

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bus className="h-5 w-5" />
              Estado de la Flota
            </CardTitle>
            <CardDescription>Resumen de vehiculos conectados</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">vehiculos</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Conectividad</span>
            <span className="font-medium">{activePercentage.toFixed(0)}% activos</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <div className="flex h-full">
              <div
                className="bg-green-500 transition-all"
                style={{ width: `${String((stats.activos / stats.total) * 100)}%` }}
              />
              <div
                className="bg-amber-500 transition-all"
                style={{ width: `${String((stats.mantenimiento / stats.total) * 100)}%` }}
              />
              <div
                className="bg-red-500 transition-all"
                style={{ width: `${String((stats.sinConexion / stats.total) * 100)}%` }}
              />
              <div
                className="bg-gray-300 transition-all"
                style={{ width: `${String((stats.inactivos / stats.total) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Status breakdown */}
        <div className="grid grid-cols-2 gap-3">
          {statusData.map(({ key, count }) => {
            const config = STATUS_CONFIG[key]
            const Icon = config.icon
            return (
              <div key={key} className="flex items-center gap-3 rounded-lg border p-3">
                <div className={cn('rounded-lg p-2', config.bgClass)}>
                  <Icon className={cn('h-4 w-4', config.colorClass)} />
                </div>
                <div>
                  <div className="text-lg font-semibold">{count}</div>
                  <div className="text-xs text-muted-foreground">{config.label}</div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
