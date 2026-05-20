import { type ColumnDef } from '@tanstack/react-table'
import { useMemo } from 'react'
import {
  User,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  Bus,
  AlertTriangle,
  CheckCircle,
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
import type { ConductorConDetalles } from '@/types/conductor'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import type { Timestamp } from 'firebase/firestore'

interface ConductoresTableProps {
  conductores: ConductorConDetalles[]
  isLoading?: boolean
  onView?: (conductor: ConductorConDetalles) => void
  onEdit?: (conductor: ConductorConDetalles) => void
  onDelete?: (conductor: ConductorConDetalles) => void
  onAssignBus?: (conductor: ConductorConDetalles) => void
}

function formatTimestamp(timestamp: unknown): string {
  try {
    if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp) {
      const date = (timestamp as Timestamp).toDate()
      return format(date, 'd MMM yyyy', { locale: es })
    }
    return '-'
  } catch {
    return '-'
  }
}

export function ConductoresTable({
  conductores,
  isLoading = false,
  onView,
  onEdit,
  onDelete,
  onAssignBus,
}: ConductoresTableProps) {
  const columns: ColumnDef<ConductorConDetalles>[] = useMemo(
    () => [
      {
        accessorKey: 'nombre',
        header: 'Conductor',
        cell: ({ row }) => {
          const conductor = row.original
          return (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-primary/10">
                {conductor.foto ? (
                  <img
                    src={conductor.foto}
                    alt={conductor.nombre}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-5 w-5 text-primary" />
                )}
              </div>
              <div>
                <div className="font-medium">{conductor.nombre}</div>
                <div className="text-sm text-muted-foreground">CC: {conductor.cedula}</div>
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: 'licencia',
        header: 'Licencia',
        cell: ({ row }) => {
          const conductor = row.original
          return (
            <div>
              <div className="font-mono text-sm">{conductor.licencia}</div>
              <div
                className={cn(
                  'text-xs',
                  conductor.licenciaVencida && 'text-red-600',
                  !conductor.licenciaVencida &&
                    conductor.diasParaVencimiento <= 30 &&
                    'text-amber-600',
                  !conductor.licenciaVencida &&
                    conductor.diasParaVencimiento > 30 &&
                    'text-muted-foreground'
                )}
              >
                Vence: {formatTimestamp(conductor.fechaVencimientoLicencia)}
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: 'licenciaVencida',
        header: 'Estado Licencia',
        cell: ({ row }) => {
          const conductor = row.original
          if (conductor.licenciaVencida) {
            return (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                <AlertTriangle className="h-3 w-3" />
                Vencida
              </span>
            )
          }
          if (conductor.diasParaVencimiento <= 30) {
            return (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                <AlertTriangle className="h-3 w-3" />
                {conductor.diasParaVencimiento} dias
              </span>
            )
          }
          return (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
              <CheckCircle className="h-3 w-3" />
              Vigente
            </span>
          )
        },
      },
      {
        accessorKey: 'sucursalNombre',
        header: 'Sucursal',
        cell: ({ row }) => <span className="text-sm">{row.original.sucursalNombre ?? '-'}</span>,
      },
      {
        accessorKey: 'busAsignado',
        header: 'Bus Asignado',
        cell: ({ row }) => {
          const bus = row.original.busAsignado
          if (!bus) {
            return <span className="text-sm text-muted-foreground">Sin asignar</span>
          }
          return (
            <span className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 font-mono text-sm">
              <Bus className="h-3 w-3" />
              {bus.placa}
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
          const conductor = row.original

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
                      onView(conductor)
                    }}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Ver detalles
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem
                    onClick={() => {
                      onEdit(conductor)
                    }}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {onAssignBus && (
                  <DropdownMenuItem
                    onClick={() => {
                      onAssignBus(conductor)
                    }}
                  >
                    <Bus className="mr-2 h-4 w-4" />
                    {conductor.busAsignado ? 'Cambiar bus' : 'Asignar bus'}
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        onDelete(conductor)
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
    [onView, onEdit, onDelete, onAssignBus]
  )

  return (
    <DataTable
      columns={columns}
      data={conductores}
      isLoading={isLoading}
      searchColumn="nombre"
      searchPlaceholder="Buscar conductor..."
      emptyMessage="No hay conductores"
      emptyDescription="Registra un nuevo conductor para comenzar"
    />
  )
}
