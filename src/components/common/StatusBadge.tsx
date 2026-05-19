import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { BusState, EventState } from '@/config/constants'

type StatusType = BusState | EventState | 'active' | 'inactive' | 'warning'

interface StatusConfig {
  label: string
  variant: 'default' | 'secondary' | 'destructive' | 'outline'
  className?: string
}

const STATUS_CONFIG: Record<StatusType, StatusConfig> = {
  // Bus states
  activo: {
    label: 'Activo',
    variant: 'default',
    className: 'bg-green-500 hover:bg-green-500/80',
  },
  inactivo: {
    label: 'Inactivo',
    variant: 'secondary',
  },
  mantenimiento: {
    label: 'Mantenimiento',
    variant: 'outline',
    className: 'border-yellow-500 text-yellow-600',
  },
  sin_conexion: {
    label: 'Sin conexión',
    variant: 'destructive',
  },

  // Event states
  nuevo: {
    label: 'Nuevo',
    variant: 'default',
    className: 'bg-blue-500 hover:bg-blue-500/80',
  },
  revisado: {
    label: 'Revisado',
    variant: 'outline',
    className: 'border-yellow-500 text-yellow-600',
  },
  resuelto: {
    label: 'Resuelto',
    variant: 'default',
    className: 'bg-green-500 hover:bg-green-500/80',
  },
  descartado: {
    label: 'Descartado',
    variant: 'secondary',
  },

  // Generic states
  active: {
    label: 'Activo',
    variant: 'default',
    className: 'bg-green-500 hover:bg-green-500/80',
  },
  inactive: {
    label: 'Inactivo',
    variant: 'secondary',
  },
  warning: {
    label: 'Advertencia',
    variant: 'outline',
    className: 'border-yellow-500 text-yellow-600',
  },
}

interface StatusBadgeProps {
  status: StatusType
  label?: string
  className?: string
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]

  return (
    <Badge variant={config.variant} className={cn(config.className, className)}>
      {label ?? config.label}
    </Badge>
  )
}

interface ConnectionStatusProps {
  isOnline: boolean
  lastSeen?: Date
  className?: string
}

export function ConnectionStatus({ isOnline, lastSeen, className }: ConnectionStatusProps) {
  if (isOnline) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
        </span>
        <span className="text-sm text-green-600">En línea</span>
      </div>
    )
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="relative flex h-2 w-2">
        <span className="relative inline-flex h-2 w-2 rounded-full bg-gray-400" />
      </span>
      <span className="text-sm text-muted-foreground">
        {lastSeen ? `Visto: ${lastSeen.toLocaleString()}` : 'Desconectado'}
      </span>
    </div>
  )
}
