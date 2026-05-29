import { type ColumnDef } from '@tanstack/react-table'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Building2, MoreHorizontal, Pencil, Trash2, Eye, MapPin, Users } from 'lucide-react'
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
import type { Cliente } from '@/types/cliente'
import type { Entity } from '@/types/firestore'

interface ClientesTableProps {
  clientes: Entity<Cliente>[]
  isLoading?: boolean
  onView?: (cliente: Entity<Cliente>) => void
  onEdit?: (cliente: Entity<Cliente>) => void
  onDelete?: (cliente: Entity<Cliente>) => void
  onManageSucursales?: (cliente: Entity<Cliente>) => void
  onManagePropietarios?: (cliente: Entity<Cliente>) => void
}

const PLAN_BADGES: Record<string, { label: string; className: string }> = {
  basico: {
    label: 'Basico',
    className: 'bg-slate-100 text-slate-700',
  },
  profesional: {
    label: 'Profesional',
    className: 'bg-blue-100 text-blue-700',
  },
  premium: {
    label: 'Premium',
    className: 'bg-amber-100 text-amber-700',
  },
}

export function ClientesTable({
  clientes,
  isLoading = false,
  onView,
  onEdit,
  onDelete,
  onManageSucursales,
  onManagePropietarios,
}: ClientesTableProps) {
  const { t } = useTranslation()
  const columns: ColumnDef<Entity<Cliente>>[] = useMemo(
    () => [
      {
        accessorKey: 'nombre',
        header: t('clientes.empresa'),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="font-medium">{row.getValue('nombre')}</div>
              <div className="text-sm text-muted-foreground">
                {t('clientes.nit')}: {row.original.nit}
              </div>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'planContratado',
        header: t('clientes.plan'),
        cell: ({ row }) => {
          const plan = row.original.planContratado
          const badge = PLAN_BADGES[plan]
          return (
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badge?.className ?? 'bg-gray-100 text-gray-700'}`}
            >
              {badge?.label ?? plan}
            </span>
          )
        },
      },
      {
        accessorKey: 'contactoEmail',
        header: t('clientes.contact'),
        cell: ({ row }) => (
          <div>
            <div className="text-sm">{row.getValue('contactoEmail')}</div>
            <div className="text-sm text-muted-foreground">{row.original.contactoTelefono}</div>
          </div>
        ),
      },
      {
        accessorKey: 'activo',
        header: t('clientes.status'),
        cell: ({ row }) => {
          const activo = row.original.activo
          return (
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}
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
          const cliente = row.original

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <span className="sr-only">{t('common.openMenu')}</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{t('common.actions')}</DropdownMenuLabel>
                {onView && (
                  <DropdownMenuItem
                    onClick={() => {
                      onView(cliente)
                    }}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    {t('common.viewDetails')}
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem
                    onClick={() => {
                      onEdit(cliente)
                    }}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    {t('common.edit')}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {onManageSucursales && (
                  <DropdownMenuItem
                    onClick={() => {
                      onManageSucursales(cliente)
                    }}
                  >
                    <MapPin className="mr-2 h-4 w-4" />
                    {t('clientes.sucursales')}
                  </DropdownMenuItem>
                )}
                {onManagePropietarios && (
                  <DropdownMenuItem
                    onClick={() => {
                      onManagePropietarios(cliente)
                    }}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    {t('clientes.propietarios')}
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        onDelete(cliente)
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
    [t, onView, onEdit, onDelete, onManageSucursales, onManagePropietarios]
  )

  return (
    <DataTable
      columns={columns}
      data={clientes}
      isLoading={isLoading}
      searchColumn="nombre"
      searchPlaceholder={t('clientes.searchPlaceholder')}
      emptyMessage={t('clientes.noClientes')}
      emptyDescription={t('clientes.noClientesDescription')}
    />
  )
}
