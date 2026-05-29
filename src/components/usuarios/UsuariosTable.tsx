import { type ColumnDef } from '@tanstack/react-table'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
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
  RotateCcw,
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
  onResetOnboarding?: (usuario: UsuarioConDetalles) => void
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
  onResetOnboarding,
  currentUserId,
}: UsuariosTableProps) {
  const { t } = useTranslation()
  const columns: ColumnDef<UsuarioConDetalles>[] = useMemo(
    () => [
      {
        accessorKey: 'nombre',
        header: t('usuarios.user'),
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
                      {t('usuarios.you')}
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
        header: t('usuarios.rol'),
        cell: ({ row }) => {
          return <RoleBadge rol={row.original.rol} />
        },
      },
      {
        accessorKey: 'clienteNombre',
        header: t('usuarios.cliente'),
        cell: ({ row }) => {
          const cliente = row.original.clienteNombre
          if (!cliente) {
            return <span className="text-sm text-muted-foreground">{t('usuarios.internal')}</span>
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
        header: t('clientes.sucursales'),
        cell: ({ row }) => {
          const sucursales = row.original.sucursalesNombres
          if (!sucursales || sucursales.length === 0) {
            return (
              <span className="text-sm text-muted-foreground">{t('usuarios.allBranches')}</span>
            )
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
        header: t('common.status'),
        cell: ({ row }) => {
          const activo = row.original.activo
          return (
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
              )}
            >
              {activo ? t('common.active') : t('common.inactive')}
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
                  <span className="sr-only">{t('usuarios.openMenu')}</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{t('common.actions')}</DropdownMenuLabel>
                {onView && (
                  <DropdownMenuItem
                    onClick={() => {
                      onView(usuario)
                    }}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    {t('usuarios.viewDetails')}
                  </DropdownMenuItem>
                )}
                {onEdit && !isSelf && (
                  <DropdownMenuItem
                    onClick={() => {
                      onEdit(usuario)
                    }}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    {t('common.edit')}
                  </DropdownMenuItem>
                )}
                {onChangeRole && !isSelf && (
                  <DropdownMenuItem
                    onClick={() => {
                      onChangeRole(usuario)
                    }}
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    {t('usuarios.changeRole')}
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
                    {t('usuarios.resendInvite')}
                  </DropdownMenuItem>
                )}
                {onResetOnboarding && (
                  <DropdownMenuItem
                    onClick={() => {
                      onResetOnboarding(usuario)
                    }}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    {t('usuarios.resetTour')}
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
                        {t('usuarios.deactivate')}
                      </>
                    ) : (
                      <>
                        <UserCheck className="mr-2 h-4 w-4" />
                        {t('usuarios.activate')}
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
                      {t('common.delete')}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    [
      t,
      onView,
      onEdit,
      onDelete,
      onToggleActive,
      onChangeRole,
      onResendInvite,
      onResetOnboarding,
      currentUserId,
    ]
  )

  return (
    <DataTable
      columns={columns}
      data={usuarios}
      isLoading={isLoading}
      searchColumn="nombre"
      searchPlaceholder={t('usuarios.searchUser')}
      emptyMessage={t('usuarios.noUsers')}
      emptyDescription={t('usuarios.createUserToStart')}
    />
  )
}
