import { type ColumnDef } from '@tanstack/react-table'
import { useMemo, useState, useEffect, useCallback } from 'react'
import {
  Bus as BusIcon,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  Video,
  Settings,
  Building2,
  Users,
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { BusStatusIndicator } from './BusStatusIndicator'
import { BusContadorModal } from './BusContadorModal'
import type { BusConDetalles } from '@/types/bus'

const STORAGE_KEY = 'buses-table-expanded-clients'

interface BusGroup {
  clienteNombre: string
  clienteId: string
  buses: BusConDetalles[]
}

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

// Group buses by client
function groupBusesByClient(buses: BusConDetalles[]): BusGroup[] {
  const groups = new Map<string, BusGroup>()

  for (const bus of buses) {
    const clienteId = bus.clienteId
    const clienteNombre = bus.clienteNombre ?? 'Sin cliente'

    if (!groups.has(clienteId)) {
      groups.set(clienteId, {
        clienteId,
        clienteNombre,
        buses: [],
      })
    }

    groups.get(clienteId)?.buses.push(bus)
  }

  return Array.from(groups.values()).sort((a, b) => a.clienteNombre.localeCompare(b.clienteNombre))
}

// Load expanded state from localStorage
function loadExpandedState(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored) as string[]
    }
  } catch {
    // Ignore errors
  }
  return []
}

// Save expanded state to localStorage
function saveExpandedState(expanded: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expanded))
  } catch {
    // Ignore errors
  }
}

export function BusesTable({
  buses,
  isLoading = false,
  onView,
  onEdit,
  onDelete,
  onManageCamaras,
}: BusesTableProps) {
  const busGroups = useMemo(() => groupBusesByClient(buses), [buses])

  // Initialize expanded state from localStorage, defaulting to all expanded if no saved state
  const [expandedClients, setExpandedClients] = useState<string[]>(() => {
    const saved = loadExpandedState()
    // If nothing saved, expand all by default
    if (saved.length === 0) {
      return busGroups.map((g) => g.clienteId)
    }
    return saved
  })

  // Update expanded state when groups change (new clients added)
  useEffect(() => {
    const saved = loadExpandedState()
    if (saved.length === 0) {
      // If no saved preferences, expand all
      setExpandedClients(busGroups.map((g) => g.clienteId))
    }
  }, [busGroups])

  // Handle accordion state change and persist to localStorage
  const handleAccordionChange = useCallback((value: string[]) => {
    setExpandedClients(value)
    saveExpandedState(value)
  }, [])

  // Contador modal state
  const [contadorModal, setContadorModal] = useState<{
    open: boolean
    bus: BusConDetalles | null
  }>({ open: false, bus: null })

  const handleViewContador = useCallback((bus: BusConDetalles) => {
    setContadorModal({ open: true, bus })
  }, [])

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
        accessorKey: 'deviceId',
        header: 'Device ID',
        cell: ({ row }) => {
          const deviceId = row.original.deviceId
          return <code className="text-xs">{deviceId ?? '-'}</code>
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
          const camarasNombres = row.original.camarasNombres ?? []

          if (numCamaras === 0 || camarasNombres.length === 0) {
            return (
              <div className="flex items-center gap-1.5">
                <Video className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{numCamaras}</span>
              </div>
            )
          }

          return (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex cursor-help items-center gap-1.5">
                    <Video className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm underline decoration-dotted">{numCamaras}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <div className="space-y-1">
                    {camarasNombres.map((nombre, index) => (
                      <div key={index} className="text-xs">
                        Camara {index + 1}: {nombre}
                      </div>
                    ))}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
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
        accessorKey: 'ipVirtual',
        header: 'IP Virtual',
        cell: ({ row }) => (
          <code className="text-xs text-muted-foreground">{row.original.ipVirtual ?? '-'}</code>
        ),
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
                <DropdownMenuItem
                  onClick={() => {
                    handleViewContador(bus)
                  }}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Ver Contador
                </DropdownMenuItem>
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
    [onView, onEdit, onDelete, onManageCamaras, handleViewContador]
  )

  // Show grouped tables with accordion
  return (
    <>
      <Accordion
        type="multiple"
        value={expandedClients}
        onValueChange={handleAccordionChange}
        className="space-y-4"
      >
        {busGroups.map((group) => (
          <AccordionItem
            key={group.clienteId}
            value={group.clienteId}
            className="rounded-lg border bg-card"
          >
            <AccordionTrigger className="px-4 hover:no-underline">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-primary" />
                <span className="text-lg font-semibold">{group.clienteNombre}</span>
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                  {group.buses.length} {group.buses.length === 1 ? 'vehiculo' : 'vehiculos'}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <DataTable
                columns={columns}
                data={group.buses}
                isLoading={isLoading}
                searchColumn="placa"
                searchPlaceholder="Buscar por placa..."
                emptyMessage="No hay buses"
                emptyDescription="Crea un nuevo bus para comenzar"
              />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {/* Contador Modal */}
      <BusContadorModal
        bus={contadorModal.bus}
        open={contadorModal.open}
        onOpenChange={(open) => {
          setContadorModal((prev) => ({ ...prev, open }))
        }}
      />
    </>
  )
}
