import { type ColumnDef } from '@tanstack/react-table'
import { useMemo } from 'react'
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
  const columns: ColumnDef<Entity<Cliente>>[] = useMemo(
    () => [
      {
        accessorKey: 'nombre',
        header: 'Empresa',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="font-medium">{row.getValue('nombre')}</div>
              <div className="text-sm text-muted-foreground">NIT: {row.original.nit}</div>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'planContratado',
        header: 'Plan',
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
        header: 'Contacto',
        cell: ({ row }) => (
          <div>
            <div className="text-sm">{row.getValue('contactoEmail')}</div>
            <div className="text-sm text-muted-foreground">{row.original.contactoTelefono}</div>
          </div>
        ),
      },
      {
        accessorKey: 'activo',
        header: 'Estado',
        cell: ({ row }) => {
          const activo = row.original.activo
          return (
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}
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
          const cliente = row.original

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
                      onView(cliente)
                    }}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Ver detalles
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem
                    onClick={() => {
                      onEdit(cliente)
                    }}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
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
                    Sucursales
                  </DropdownMenuItem>
                )}
                {onManagePropietarios && (
                  <DropdownMenuItem
                    onClick={() => {
                      onManagePropietarios(cliente)
                    }}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Propietarios
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
    [onView, onEdit, onDelete, onManageSucursales, onManagePropietarios]
  )

  return (
    <DataTable
      columns={columns}
      data={clientes}
      isLoading={isLoading}
      searchColumn="nombre"
      searchPlaceholder="Buscar por nombre..."
      emptyMessage="No hay clientes"
      emptyDescription="Crea un nuevo cliente para comenzar"
    />
  )
}
