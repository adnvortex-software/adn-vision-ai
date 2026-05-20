import { type ColumnDef } from '@tanstack/react-table'
import { useMemo } from 'react'
import {
  User,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  Shield,
  Building2,
  UserX,
  UserCheck,
  Mail,
} from 'lucide-react'
import { DataTable } from '@/components/common/DataTable'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { RoleBadge } from './UsuarioForm'
import type { Usuario } from '@/types/auth'
import type { Entity } from '@/types/firestore'
import { cn } from '@/lib/utils'

// Extended user type with related data
export interface UsuarioConDetalles extends Entity<Usuario> {
  clienteNombre?: string
  sucursalesNombres?: string[]
}

interface UsuariosTableProps {
  usuarios: UsuarioConDetalles[]
  isLoading?: boolean
  onView?: (usuario: UsuarioConDetalles) => void
  onEdit?: (usuario: UsuarioConDetalles) => void
  onDelete?: (usuario: UsuarioConDetalles) => void
  onToggleActive?: (usuario: UsuarioConDetalles) => void
  onChangeRole?: (usuario: UsuarioConDetalles) => void
  onResendInvite?: (usuario: UsuarioConDetalles) => void
  /** Current user ID to prevent self-modification */
  currentUserId?: string
}

export function UsuariosTable({
  usuarios,
  isLoading = false,
  onView,
  onEdit,
  onDelete,
  onToggleActive,
  onChangeRole,
  onResendInvite,
  currentUserId,
}: UsuariosTableProps) {
  const columns: ColumnDef<UsuarioConDetalles>[] = useMemo(
    () => [
      {
        accessorKey: 'nombre',
        header: 'Usuario',
        cell: ({ row }) => {
          const usuario = row.original
          return (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{usuario.nombre}</span>
                  {usuario.id === currentUserId && (
                    <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                      Tu
                    </span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">{usuario.email}</div>
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: 'rol',
        header: 'Rol',
        cell: ({ row }) => {
          return <RoleBadge rol={row.original.rol} />
        },
      },
      {
        accessorKey: 'clienteNombre',
        header: 'Cliente',
        cell: ({ row }) => {
          const cliente = row.original.clienteNombre
          if (!cliente) {
            return <span className="text-sm text-muted-foreground">Interno</span>
          }
          return (
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{cliente}</span>
            </div>
          )
        },
      },
      {
        accessorKey: 'sucursalesNombres',
        header: 'Sucursales',
        cell: ({ row }) => {
          const sucursales = row.original.sucursalesNombres
          if (!sucursales || sucursales.length === 0) {
            return <span className="text-sm text-muted-foreground">Todas</span>
          }
          if (sucursales.length === 1) {
            return <span className="text-sm">{sucursales[0]}</span>
          }
          return (
            <span className="text-sm">
              {sucursales[0]}{' '}
              <span className="text-muted-foreground">+{sucursales.length - 1}</span>
            </span>
          )
        },
      },
      {
        accessorKey: 'activo',
        header: 'Estado',
        cell: ({ row }) => {
          const activo = row.original.activo
          return (
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
              )}
            >
              {activo ? 'Activo' : 'Inactivo'}
            </span>
          )
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const usuario = row.original
          const isSelf = usuario.id === currentUserId

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <span className="sr-only">Abrir menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                {onView && (
                  <DropdownMenuItem
                    onClick={() => {
                      onView(usuario)
                    }}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Ver detalles
                  </DropdownMenuItem>
                )}
                {onEdit && !isSelf && (
                  <DropdownMenuItem
                    onClick={() => {
                      onEdit(usuario)
                    }}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                )}
                {onChangeRole && !isSelf && (
                  <DropdownMenuItem
                    onClick={() => {
                      onChangeRole(usuario)
                    }}
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    Cambiar rol
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {onResendInvite && (
                  <DropdownMenuItem
                    onClick={() => {
                      onResendInvite(usuario)
                    }}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Reenviar invitacion
                  </DropdownMenuItem>
                )}
                {onToggleActive && !isSelf && (
                  <DropdownMenuItem
                    onClick={() => {
                      onToggleActive(usuario)
                    }}
                  >
                    {usuario.activo ? (
                      <>
                        <UserX className="mr-2 h-4 w-4" />
                        Desactivar
                      </>
                    ) : (
                      <>
                        <UserCheck className="mr-2 h-4 w-4" />
                        Activar
                      </>
                    )}
                  </DropdownMenuItem>
                )}
                {onDelete && !isSelf && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        onDelete(usuario)
                      }}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    [onView, onEdit, onDelete, onToggleActive, onChangeRole, onResendInvite, currentUserId]
  )

  return (
    <DataTable
      columns={columns}
      data={usuarios}
      isLoading={isLoading}
      searchColumn="nombre"
      searchPlaceholder="Buscar usuario..."
      emptyMessage="No hay usuarios"
      emptyDescription="Crea un nuevo usuario para comenzar"
    />
  )
}
