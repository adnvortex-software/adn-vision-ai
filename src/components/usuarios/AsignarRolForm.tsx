import { useState } from 'react'
import { Loader2, Shield, AlertTriangle } from 'lucide-react'
import { INTERNAL_ROLES, CLIENT_ROLES, type Role } from '@/config/constants'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Label } from '@/components/ui/label'
import type { Usuario } from '@/types/auth'
import type { Entity } from '@/types/firestore'
import { RoleBadge } from './UsuarioForm'

// Role display configuration
const ROLE_CONFIG: Record<Role, { label: string; description: string }> = {
  super_admin: { label: 'Super Admin', description: 'Acceso total al sistema' },
  ops_admin: { label: 'Admin Operaciones', description: 'Gestiona operaciones y clientes' },
  analyst: { label: 'Analista', description: 'Visualiza datos y genera reportes' },
  support: { label: 'Soporte', description: 'Atiende casos de soporte' },
  client_admin: { label: 'Admin Cliente', description: 'Administra su empresa' },
  client_viewer: { label: 'Visor Cliente', description: 'Solo visualiza datos' },
}

interface AsignarRolFormProps {
  usuario: Entity<Usuario> | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (userId: string, newRol: Role) => Promise<void>
  isLoading?: boolean
  /** If true, show only client roles (for client admins) */
  clientOnly?: boolean
}

export function AsignarRolForm({
  usuario,
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
  clientOnly = false,
}: AsignarRolFormProps) {
  const [selectedRol, setSelectedRol] = useState<Role | undefined>(usuario?.rol)

  // Reset selection when user changes
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && usuario) {
      setSelectedRol(usuario.rol)
    }
    onOpenChange(newOpen)
  }

  const handleSubmit = async () => {
    if (!usuario || !selectedRol) return
    await onSubmit(usuario.id, selectedRol)
    onOpenChange(false)
  }

  if (!usuario) return null

  const currentIsInternal = INTERNAL_ROLES.includes(usuario.rol as (typeof INTERNAL_ROLES)[number])
  const selectedIsInternal = selectedRol
    ? INTERNAL_ROLES.includes(selectedRol as (typeof INTERNAL_ROLES)[number])
    : false

  // Warning when switching between internal and client roles
  const showWarning =
    selectedRol && selectedRol !== usuario.rol && currentIsInternal !== selectedIsInternal

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Cambiar Rol
          </DialogTitle>
          <DialogDescription>Cambiar el rol de {usuario.nombre}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current role */}
          <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-3">
            <div>
              <Label className="text-xs text-muted-foreground">Rol actual</Label>
              <div className="mt-1">
                <RoleBadge rol={usuario.rol} />
              </div>
            </div>
          </div>

          {/* New role selection */}
          <div className="space-y-2">
            <Label>Nuevo Rol</Label>
            <Select
              value={selectedRol}
              onValueChange={(value) => {
                setSelectedRol(value as Role)
              }}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar rol" />
              </SelectTrigger>
              <SelectContent>
                {!clientOnly && (
                  <SelectGroup>
                    <SelectLabel>Roles Internos</SelectLabel>
                    {INTERNAL_ROLES.map((rol) => (
                      <SelectItem key={rol} value={rol}>
                        <div className="flex flex-col">
                          <span>{ROLE_CONFIG[rol].label}</span>
                          <span className="text-xs text-muted-foreground">
                            {ROLE_CONFIG[rol].description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )}
                <SelectGroup>
                  <SelectLabel>Roles de Cliente</SelectLabel>
                  {CLIENT_ROLES.map((rol) => (
                    <SelectItem key={rol} value={rol}>
                      <div className="flex flex-col">
                        <span>{ROLE_CONFIG[rol].label}</span>
                        <span className="text-xs text-muted-foreground">
                          {ROLE_CONFIG[rol].description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Warning for role type change */}
          {showWarning && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {currentIsInternal && !selectedIsInternal
                  ? 'Cambiar a rol de cliente requerira asignar un cliente al usuario.'
                  : 'Cambiar a rol interno removera la asociacion con el cliente actual.'}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false)
            }}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={() => {
              void handleSubmit()
            }}
            disabled={isLoading || !selectedRol || selectedRol === usuario.rol}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              'Cambiar Rol'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
