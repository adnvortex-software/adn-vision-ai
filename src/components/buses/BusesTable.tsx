import { type ColumnDef } from '@tanstack/react-table'
import { useMemo, useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
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
  AlertTriangle,
} from 'lucide-react'
import { DataTable } from '@/components/common/DataTable'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { BusStatusIndicator } from './BusStatusIndicator'
import { BusContadorModal } from './BusContadorModal'
import { BusCountingConfigModal } from './BusCountingConfigModal'
import { BusNoveltyConfigModal } from './BusNoveltyConfigModal'
import { BusLiveStreamModal } from './BusLiveStreamModal'
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
}: BusesTableProps) {
  const { t } = useTranslation()
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

  // Counting config modal state
  const [countingConfigModal, setCountingConfigModal] = useState<{
    open: boolean
    bus: BusConDetalles | null
  }>({ open: false, bus: null })

  // Novelty config modal state
  const [noveltyConfigModal, setNoveltyConfigModal] = useState<{
    open: boolean
    bus: BusConDetalles | null
  }>({ open: false, bus: null })

  // Live stream modal state
  const [liveStreamModal, setLiveStreamModal] = useState<{
    open: boolean
    bus: BusConDetalles | null
  }>({ open: false, bus: null })

  const handleViewContador = useCallback((bus: BusConDetalles) => {
    setContadorModal({ open: true, bus })
  }, [])

  const handleConfigCounting = useCallback((bus: BusConDetalles) => {
    setCountingConfigModal({ open: true, bus })
  }, [])

  const handleConfigNovelty = useCallback((bus: BusConDetalles) => {
    setNoveltyConfigModal({ open: true, bus })
  }, [])

  const handleViewLiveStream = useCallback((bus: BusConDetalles) => {
    setLiveStreamModal({ open: true, bus })
  }, [])

  const columns: ColumnDef<BusConDetalles>[] = useMemo(
    () => [
      {
        accessorKey: 'placa',
        header: t('buses.vehicle'),
        cell: ({ row }) => {
          const bus = row.original
          // Check if connected based on lastHeartbeat (within last 2 minutes)
          const isConnected = bus.lastHeartbeat
            ? Date.now() - bus.lastHeartbeat.toDate().getTime() < 2 * 60 * 1000
            : false

          return (
            <div className="flex items-center gap-2">
              <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <BusIcon className="h-4 w-4 text-primary" />
                {/* Connection indicator */}
                <span
                  className={`absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-background ${
                    isConnected ? 'bg-green-500' : 'bg-red-500'
                  }`}
                  title={isConnected ? t('buses.connected') : t('buses.disconnected')}
                />
              </div>
              <div>
                <div className="font-medium">{bus.placa}</div>
                <div className="text-sm text-muted-foreground">
                  {t(`buses.tipos.${bus.tipoVehiculo}`)}
                  {bus.rutaTexto && ` - ${bus.rutaTexto}`}
                </div>
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: 'numeroInterno',
        header: t('buses.interno'),
        cell: ({ row }) => {
          const numeroInterno = row.original.numeroInterno
          if (numeroInterno === undefined) {
            return <span className="text-sm text-muted-foreground">-</span>
          }
          return <span className="font-medium">{numeroInterno}</span>
        },
      },
      {
        accessorKey: 'estado',
        header: t('buses.estado'),
        cell: ({ row }) => {
          return <BusStatusIndicator estado={row.original.estado} size="sm" />
        },
      },
      {
        id: 'conteo',
        header: () => <span data-tour="bus-count-column">{t('buses.count')}</span>,
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              handleViewContador(row.original)
            }}
            className="h-8 px-2"
          >
            <Users className="mr-1 h-4 w-4" />
            {t('common.view')}
          </Button>
        ),
      },
      {
        id: 'envivo',
        header: () => <span data-tour="bus-live-btn">{t('buses.live')}</span>,
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              handleViewLiveStream(row.original)
            }}
            className="h-8 px-2"
          >
            <Video className="mr-1 h-4 w-4" />
            {t('common.view')}
          </Button>
        ),
      },
      {
        id: 'detalles',
        header: t('buses.details'),
        cell: ({ row }) =>
          onView ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onView(row.original)
              }}
              className="h-8 px-2"
            >
              <Eye className="mr-1 h-4 w-4" />
              {t('common.view')}
            </Button>
          ) : null,
      },
      {
        id: 'menu',
        header: '',
        cell: ({ row }) => {
          const bus = row.original

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <span className="sr-only">{t('buses.moreOptions')}</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    handleConfigCounting(bus)
                  }}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  {t('buses.configureCounting')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    handleConfigNovelty(bus)
                  }}
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  {t('buses.configureNovelties')}
                </DropdownMenuItem>
                {onEdit && (
                  <DropdownMenuItem
                    onClick={() => {
                      onEdit(bus)
                    }}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    {t('common.edit')}
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
      handleViewContador,
      handleConfigCounting,
      handleConfigNovelty,
      handleViewLiveStream,
    ]
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
                  {group.buses.length}{' '}
                  {group.buses.length === 1 ? t('buses.vehicle') : t('buses.vehicles')}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <DataTable
                columns={columns}
                data={group.buses}
                isLoading={isLoading}
                searchColumn="placa"
                searchPlaceholder={t('buses.searchPlate')}
                emptyMessage={t('buses.noBuses')}
                emptyDescription={t('buses.createToStart')}
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

      {/* Counting Config Modal */}
      <BusCountingConfigModal
        bus={countingConfigModal.bus}
        open={countingConfigModal.open}
        onOpenChange={(open) => {
          setCountingConfigModal((prev) => ({ ...prev, open }))
        }}
      />

      {/* Novelty Config Modal */}
      <BusNoveltyConfigModal
        bus={noveltyConfigModal.bus}
        open={noveltyConfigModal.open}
        onOpenChange={(open) => {
          setNoveltyConfigModal((prev) => ({ ...prev, open }))
        }}
      />

      {/* Live Stream Modal */}
      <BusLiveStreamModal
        bus={liveStreamModal.bus}
        open={liveStreamModal.open}
        onOpenChange={(open) => {
          setLiveStreamModal((prev) => ({ ...prev, open }))
        }}
      />
    </>
  )
}
