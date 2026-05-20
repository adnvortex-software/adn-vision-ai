import { AlertTriangle, Users, Shield, Wrench, ShoppingBag } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { NoveltyCategory, CameraProfile } from '@/config/constants'
import type { NovedadCatalogo } from '@/types/novedad'
import type { Entity } from '@/types/firestore'
import { cn } from '@/lib/utils'

interface NovedadCatalogoSelectProps {
  value?: string
  onValueChange: (value: string) => void
  catalogo: Entity<NovedadCatalogo>[]
  disabled?: boolean
  filterByCategory?: NoveltyCategory
  filterByPerfil?: CameraProfile
  className?: string
}

const CATEGORY_CONFIG: Record<
  NoveltyCategory,
  {
    label: string
    icon: typeof AlertTriangle
    colorClass: string
  }
> = {
  operativa: {
    label: 'Operativa',
    icon: AlertTriangle,
    colorClass: 'text-blue-600',
  },
  seguridad_conductor: {
    label: 'Seguridad Conductor',
    icon: Shield,
    colorClass: 'text-red-600',
  },
  seguridad_pasajero: {
    label: 'Seguridad Pasajero',
    icon: Users,
    colorClass: 'text-amber-600',
  },
  tecnica: {
    label: 'Tecnica',
    icon: Wrench,
    colorClass: 'text-gray-600',
  },
  comercial: {
    label: 'Comercial',
    icon: ShoppingBag,
    colorClass: 'text-green-600',
  },
}

export function NovedadCatalogoSelect({
  value,
  onValueChange,
  catalogo,
  disabled = false,
  filterByCategory,
  filterByPerfil,
  className,
}: NovedadCatalogoSelectProps) {
  // Filter and group by category
  const filteredCatalogo = catalogo.filter((item) => {
    if (!item.activa) return false
    if (filterByCategory && item.categoria !== filterByCategory) return false
    if (filterByPerfil && !item.perfilesCompatibles.includes(filterByPerfil)) return false
    return true
  })

  const groupedByCategory = filteredCatalogo.reduce<Record<string, Entity<NovedadCatalogo>[]>>(
    (acc, item) => {
      const category = item.categoria
      acc[category] ??= []
      acc[category].push(item)
      return acc
    },
    {}
  )

  const selectedItem = catalogo.find((item) => item.codigo === value)

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={cn('w-full', className)}>
        <SelectValue placeholder="Seleccionar tipo de novedad">
          {selectedItem && (
            <div className="flex items-center gap-2">
              <NovedadIcon categoria={selectedItem.categoria} size="sm" />
              <span>{selectedItem.nombre}</span>
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {Object.entries(groupedByCategory).map(([category, items]) => {
          const config = CATEGORY_CONFIG[category as NoveltyCategory]
          return (
            <SelectGroup key={category}>
              <SelectLabel className="flex items-center gap-2">
                <config.icon className={cn('h-4 w-4', config.colorClass)} />
                {config.label}
              </SelectLabel>
              {items.map((item) => (
                <SelectItem key={item.codigo} value={item.codigo}>
                  <div className="flex flex-col">
                    <span>{item.nombre}</span>
                    <span className="text-xs text-muted-foreground">{item.descripcion}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          )
        })}
        {filteredCatalogo.length === 0 && (
          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
            No hay novedades disponibles
          </div>
        )}
      </SelectContent>
    </Select>
  )
}

interface NovedadIconProps {
  categoria: NoveltyCategory
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function NovedadIcon({ categoria, size = 'md', className }: NovedadIconProps) {
  const config = CATEGORY_CONFIG[categoria]
  const Icon = config.icon

  const sizeClass = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  }[size]

  return <Icon className={cn(sizeClass, config.colorClass, className)} />
}

interface NovedadCategoriaBadgeProps {
  categoria: NoveltyCategory
  className?: string
}

export function NovedadCategoriaBadge({ categoria, className }: NovedadCategoriaBadgeProps) {
  const config = CATEGORY_CONFIG[categoria]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        config.colorClass,
        config.colorClass.replace('text-', 'bg-').replace('-600', '-100'),
        className
      )}
    >
      <config.icon className="h-3 w-3" />
      {config.label}
    </span>
  )
}
