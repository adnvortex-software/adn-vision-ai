import { type ColumnDef } from '@tanstack/react-table'
import { useMemo } from 'react'
import {
  AlertTriangle,
  MoreHorizontal,
  Eye,
  CheckCircle,
  XCircle,
  FileText,
  Clock,
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
import type { EventoConDetalles } from '@/types/novedad'
import type { EventState } from '@/config/constants'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface NovedadesEventosTableProps {
  eventos: EventoConDetalles[]
  isLoading?: boolean
  onView?: (evento: EventoConDetalles) => void
  onResolve?: (evento: EventoConDetalles) => void
  onDiscard?: (evento: EventoConDetalles) => void
  onGeneratePdf?: (evento: EventoConDetalles) => void
}

const ESTADO_CONFIG: Record<EventState, { label: string; colorClass: string; bgClass: string }> = {
  nuevo: {
    label: 'Nuevo',
    colorClass: 'text-blue-700',
    bgClass: 'bg-blue-100',
  },
  revisado: {
    label: 'Revisado',
    colorClass: 'text-amber-700',
    bgClass: 'bg-amber-100',
  },
  resuelto: {
    label: 'Resuelto',
    colorClass: 'text-green-700',
    bgClass: 'bg-green-100',
  },
  descartado: {
    label: 'Descartado',
    colorClass: 'text-gray-700',
    bgClass: 'bg-gray-100',
  },
}

function formatTimestamp(timestamp: unknown): string {
  try {
    // Handle Firestore timestamp
    if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp) {
      const date = (timestamp as { toDate: () => Date }).toDate()
      return format(date, 'd MMM yyyy, HH:mm', { locale: es })
    }
    return '-'
  } catch {
    return '-'
  }
}

export function NovedadesEventosTable({
  eventos,
  isLoading = false,
  onView,
  onResolve,
  onDiscard,
  onGeneratePdf,
}: NovedadesEventosTableProps) {
  const columns: ColumnDef<EventoConDetalles>[] = useMemo(
    () => [
      {
        accessorKey: 'timestamp',
        header: 'Fecha/Hora',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{formatTimestamp(row.original.timestamp)}</span>
          </div>
        ),
      },
      {
        accessorKey: 'tipoNovedad',
        header: 'Novedad',
        cell: ({ row }) => {
          // We'd need the category from catalogo, but for now show type
          return (
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <div>
                <div className="font-medium">
                  {row.original.novedadNombre ?? row.original.tipoNovedad}
                </div>
                {row.original.camaraNombre && (
                  <div className="text-xs text-muted-foreground">{row.original.camaraNombre}</div>
                )}
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: 'busPlaca',
        header: 'Bus',
        cell: ({ row }) => (
          <span className="rounded bg-muted px-2 py-0.5 font-mono text-sm">
            {row.original.busPlaca ?? '-'}
          </span>
        ),
      },
      {
        accessorKey: 'estado',
        header: 'Estado',
        cell: ({ row }) => {
          const estado = row.original.estado
          const config = ESTADO_CONFIG[estado]
          return (
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                config.bgClass,
                config.colorClass
              )}
            >
              {config.label}
            </span>
          )
        },
      },
      {
        accessorKey: 'screenshotUrl',
        header: 'Captura',
        cell: ({ row }) => {
          const url = row.original.screenshotUrl
          if (!url) {
            return <span className="text-sm text-muted-foreground">Sin imagen</span>
          }
          return (
            <div className="h-12 w-16 overflow-hidden rounded border">
              <img src={url} alt="Captura del evento" className="h-full w-full object-cover" />
            </div>
          )
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const evento = row.original

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
                      onView(evento)
                    }}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Ver detalles
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {onResolve && evento.estado !== 'resuelto' && evento.estado !== 'descartado' && (
                  <DropdownMenuItem
                    onClick={() => {
                      onResolve(evento)
                    }}
                  >
                    <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                    Marcar resuelto
                  </DropdownMenuItem>
                )}
                {onDiscard && evento.estado !== 'descartado' && (
                  <DropdownMenuItem
                    onClick={() => {
                      onDiscard(evento)
                    }}
                  >
                    <XCircle className="mr-2 h-4 w-4 text-gray-600" />
                    Descartar
                  </DropdownMenuItem>
                )}
                {onGeneratePdf && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        onGeneratePdf(evento)
                      }}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Generar PDF
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    [onView, onResolve, onDiscard, onGeneratePdf]
  )

  return (
    <DataTable
      columns={columns}
      data={eventos}
      isLoading={isLoading}
      searchColumn="tipoNovedad"
      searchPlaceholder="Buscar eventos..."
      emptyMessage="No hay eventos"
      emptyDescription="Los eventos de novedades apareceran aqui"
    />
  )
}

interface EventoEstadoBadgeProps {
  estado: EventState
  size?: 'sm' | 'md'
  className?: string
}

export function EventoEstadoBadge({ estado, size = 'md', className }: EventoEstadoBadgeProps) {
  const config = ESTADO_CONFIG[estado]

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        config.bgClass,
        config.colorClass,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
        className
      )}
    >
      {config.label}
    </span>
  )
}
