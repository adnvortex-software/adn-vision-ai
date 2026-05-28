import { LogOut, Settings, User, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { Usuario } from '@/types/auth'

interface UserMenuProps {
  usuario: Usuario
  onLogout: () => void
  onProfileClick?: () => void
  onSettingsClick?: () => void
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    super_admin: 'Super Admin',
    ops_admin: 'Admin Operaciones',
    analyst: 'Analista',
    support: 'Soporte',
    client_admin: 'Admin Cliente',
    client_viewer: 'Visor Cliente',
  }
  return labels[role] ?? role
}

export function UserMenu({ usuario, onLogout, onProfileClick, onSettingsClick }: UserMenuProps) {
  const fotoUrl = (usuario as { fotoUrl?: string }).fotoUrl

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage src={fotoUrl ?? undefined} alt={usuario.nombre} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getInitials(usuario.nombre)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{usuario.nombre}</p>
            <p className="text-xs leading-none text-muted-foreground">{usuario.email}</p>
            <div className="flex items-center gap-1 pt-1">
              <Shield className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{getRoleLabel(usuario.rol)}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {onProfileClick && (
            <DropdownMenuItem onClick={onProfileClick}>
              <User className="mr-2 h-4 w-4" />
              Mi Perfil
            </DropdownMenuItem>
          )}
          {onSettingsClick && (
            <DropdownMenuItem onClick={onSettingsClick}>
              <Settings className="mr-2 h-4 w-4" />
              Configuración
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout} className="text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar Sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
