import { Video, Users, DoorOpen, Car, MapPin, HelpCircle } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CAMERA_PROFILES, type CameraProfile } from '@/config/constants'
import { cn } from '@/lib/utils'

interface PerfilCamaraSelectProps {
  value?: CameraProfile
  onValueChange: (value: CameraProfile) => void
  disabled?: boolean
  className?: string
}

const PROFILE_CONFIG: Record<
  CameraProfile,
  {
    label: string
    description: string
    icon: typeof Video
  }
> = {
  cabina: {
    label: 'Cabina',
    description: 'Vista del conductor',
    icon: Users,
  },
  puerta: {
    label: 'Puerta',
    description: 'Entrada/salida pasajeros',
    icon: DoorOpen,
  },
  pasillo: {
    label: 'Pasillo',
    description: 'Interior del vehiculo',
    icon: Users,
  },
  frontal: {
    label: 'Frontal',
    description: 'Vista hacia la calle',
    icon: Car,
  },
  exterior: {
    label: 'Exterior',
    description: 'Vista lateral/trasera',
    icon: MapPin,
  },
  otro: {
    label: 'Otro',
    description: 'Otro tipo de vista',
    icon: HelpCircle,
  },
}

export function PerfilCamaraSelect({
  value,
  onValueChange,
  disabled = false,
  className,
}: PerfilCamaraSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={cn('w-full', className)}>
        <SelectValue placeholder="Seleccionar perfil">
          {value && (
            <div className="flex items-center gap-2">
              {(() => {
                const Icon = PROFILE_CONFIG[value].icon
                return <Icon className="h-4 w-4" />
              })()}
              <span>{PROFILE_CONFIG[value].label}</span>
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {CAMERA_PROFILES.map((profile) => {
          const config = PROFILE_CONFIG[profile]
          const Icon = config.icon
          return (
            <SelectItem key={profile} value={profile}>
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <div className="flex flex-col">
                  <span>{config.label}</span>
                  <span className="text-xs text-muted-foreground">{config.description}</span>
                </div>
              </div>
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}

interface PerfilCamaraBadgeProps {
  perfil: CameraProfile
  size?: 'sm' | 'md'
  className?: string
}

export function PerfilCamaraBadge({ perfil, size = 'md', className }: PerfilCamaraBadgeProps) {
  const config = PROFILE_CONFIG[perfil]
  const Icon = config.icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-secondary-foreground',
        size === 'sm' && 'text-xs',
        size === 'md' && 'text-sm',
        className
      )}
    >
      <Icon className={cn(size === 'sm' ? 'h-3 w-3' : 'h-4 w-4')} />
      {config.label}
    </span>
  )
}
