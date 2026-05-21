import { Wifi, WifiOff, Wrench, Power } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BusState } from '@/config/constants'

interface BusStatusIndicatorProps {
  estado: BusState
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

const STATUS_CONFIG: Record<
  BusState,
  {
    label: string
    icon: typeof Wifi
    colorClass: string
    bgClass: string
  }
> = {
  activo: {
    label: 'Activo',
    icon: Wifi,
    colorClass: 'text-green-600',
    bgClass: 'bg-green-100',
  },
  inactivo: {
    label: 'Inactivo',
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

const SIZE_CONFIG = {
  sm: {
    icon: 'h-3 w-3',
    badge: 'px-2 py-0.5 text-xs',
    dot: 'h-2 w-2',
  },
  md: {
    icon: 'h-4 w-4',
    badge: 'px-2.5 py-1 text-xs',
    dot: 'h-2.5 w-2.5',
  },
  lg: {
    icon: 'h-5 w-5',
    badge: 'px-3 py-1.5 text-sm',
    dot: 'h-3 w-3',
  },
}

export function BusStatusIndicator({
  estado,
  size = 'md',
  showLabel = true,
  className,
}: BusStatusIndicatorProps) {
  const config = STATUS_CONFIG[estado]
  const sizeConfig = SIZE_CONFIG[size]
  const Icon = config.icon

  if (!showLabel) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-full',
          config.bgClass,
          size === 'sm' ? 'p-1' : size === 'md' ? 'p-1.5' : 'p-2',
          className
        )}
        title={config.label}
      >
        <Icon className={cn(sizeConfig.icon, config.colorClass)} />
      </div>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        config.bgClass,
        config.colorClass,
        sizeConfig.badge,
        className
      )}
    >
      <Icon className={sizeConfig.icon} />
      {config.label}
    </span>
  )
}

interface StatusDotProps {
  estado: BusState
  className?: string
  pulse?: boolean
}

export function StatusDot({ estado, className, pulse = false }: StatusDotProps) {
  const config = STATUS_CONFIG[estado]

  return (
    <span
      className={cn(
        'relative inline-flex h-2.5 w-2.5 rounded-full',
        config.colorClass.replace('text-', 'bg-'),
        className
      )}
      title={config.label}
    >
      {pulse && estado === 'activo' && (
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
      )}
    </span>
  )
}
