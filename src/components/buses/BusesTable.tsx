import { type ColumnDef } from '@tanstack/react-table'
import { useMemo } from 'react'
import { Bus as BusIcon, MoreHorizontal, Pencil, Trash2, Eye, Video, Settings } from 'lucide-react'
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
import { BusStatusIndicator } from './BusStatusIndicator'
import type { BusConDetalles } from '@/types/bus'

interface BusesTableProps {
  buses: BusConDetalles[]
  isLoading?: boolean
  onView?: (bus: BusConDetalles) => void
  onEdit?: (bus: BusConDetalles) => void
  onDelete?: (bus: BusConDetalles) => void
  onManageCamaras?: (bus: BusConDetalles) => void
}

const VEHICLE_TYPE_LABELS: Record<string, string> = {
  bus: 'Bus',
  buseta: 'Buseta',
  van: 'Van',
  microbus: 'Microbus',
  otro: 'Otro',
}

export function BusesTable({
  buses,
  isLoading = false,
  onView,
  onEdit,
  onDelete,
  onManageCamaras,
}: BusesTableProps) {
  const columns: ColumnDef<BusConDetalles>[] = useMemo(
    () => [
      {
        accessorKey: 'placa',
        header: 'Vehiculo',
        cell: ({ row }) => {
          const bus = row.original
          return (
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <BusIcon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="font-medium">{bus.placa}</div>
                <div className="text-sm text-muted-foreground">
                  {VEHICLE_TYPE_LABELS[bus.tipoVehiculo] ?? bus.tipoVehiculo}
                  {bus.rutaTexto && ` - ${bus.rutaTexto}`}
                </div>
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: 'sucursalNombre',
        header: 'Sucursal',
        cell: ({ row }) => {
          const sucursalNombre = row.original.sucursalNombre
          return <span className="text-sm">{sucursalNombre ?? '-'}</span>
        },
      },
      {
        accessorKey: 'estado',
        header: 'Estado',
        cell: ({ row }) => {
          return <BusStatusIndicator estado={row.original.estado} size="sm" />
        },
      },
      {
        accessorKey: 'numCamarasConfiguradas',
        header: 'Camaras',
        cell: ({ row }) => {
          const numCamaras = row.original.numCamarasConfiguradas
          return (
            <div className="flex items-center gap-1.5">
              <Video className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{numCamaras}</span>
            </div>
          )
        },
      },
      {
        accessorKey: 'novedadesHoy',
        header: 'Novedades',
        cell: ({ row }) => {
          const novedades = row.original.novedadesHoy
          if (novedades === undefined)
            return <span className="text-sm text-muted-foreground">-</span>
          if (novedades === 0)
            return <span className="text-sm text-muted-foreground">{novedades}</span>
          return (
            <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
              {novedades}
            </span>
          )
        },
      },
      {
        accessorKey: 'ztIpRouter',
        header: 'IP Router',
        cell: ({ row }) => (
          <code className="text-xs text-muted-foreground">{row.original.ztIpRouter}</code>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const bus = row.original

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
                      onView(bus)
                    }}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Ver detalles
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem
                    onClick={() => {
                      onEdit(bus)
                    }}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {onManageCamaras && (
                  <DropdownMenuItem
                    onClick={() => {
                      onManageCamaras(bus)
                    }}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Configurar camaras
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        onDelete(bus)
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
    [onView, onEdit, onDelete, onManageCamaras]
  )

  return (
    <DataTable
      columns={columns}
      data={buses}
      isLoading={isLoading}
      searchColumn="placa"
      searchPlaceholder="Buscar por placa..."
      emptyMessage="No hay buses"
      emptyDescription="Crea un nuevo bus para comenzar"
    />
  )
}
