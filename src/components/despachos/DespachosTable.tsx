import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useTranslation } from 'react-i18next'
import { MoreHorizontal, Printer, Play, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { DESPACHO_STATE_COLORS, type DespachoState } from '@/types/despacho'
import type { Entity } from '@/types/firestore'
import type { Despacho } from '@/types/despacho'
import type { Timestamp } from 'firebase/firestore'

interface DespachosTableProps {
  despachos: Entity<Despacho>[]
  onViewTirilla: (despacho: Entity<Despacho>) => void
  onUpdateEstado: (despacho: Entity<Despacho>, estado: DespachoState) => void
}

function formatTimestamp(timestamp: Timestamp | Date | null | undefined): string {
  if (!timestamp) return '-'
  const date = 'toDate' in timestamp ? timestamp.toDate() : timestamp
  return format(date, "d MMM yyyy 'a las' HH:mm", { locale: es })
}

export function DespachosTable({ despachos, onViewTirilla, onUpdateEstado }: DespachosTableProps) {
  const { t } = useTranslation()

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('despachos.fechaHora')}</TableHead>
            <TableHead>{t('despachos.vehiculo')}</TableHead>
            <TableHead>{t('despachos.conductor')}</TableHead>
            <TableHead>{t('despachos.ruta')}</TableHead>
            <TableHead>{t('despachos.cliente')}</TableHead>
            <TableHead>{t('despachos.estado')}</TableHead>
            <TableHead className="w-[80px]">{t('common.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {despachos.map((despacho) => (
            <TableRow key={despacho.id}>
              <TableCell className="font-medium">{formatTimestamp(despacho.fechaHora)}</TableCell>
              <TableCell>
                <div>
                  <span className="font-medium">{despacho.placa}</span>
                  {despacho.numeroInterno && (
                    <span className="ml-2 text-muted-foreground">#{despacho.numeroInterno}</span>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">{despacho.tipoVehiculo}</span>
              </TableCell>
              <TableCell>{despacho.conductor}</TableCell>
              <TableCell className="max-w-[200px] truncate">{despacho.ruta}</TableCell>
              <TableCell>{despacho.clienteNombre}</TableCell>
              <TableCell>
                <Badge className={DESPACHO_STATE_COLORS[despacho.estado]} variant="secondary">
                  {t(`despachos.estados.${despacho.estado}`)}
                </Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">{t('despachos.abrirMenu')}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        onViewTirilla(despacho)
                      }}
                    >
                      <Printer className="mr-2 h-4 w-4" />
                      {t('despachos.verTirilla')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {despacho.estado === 'pendiente' && (
                      <DropdownMenuItem
                        onClick={() => {
                          onUpdateEstado(despacho, 'en_curso')
                        }}
                      >
                        <Play className="mr-2 h-4 w-4" />
                        {t('common.start')}
                      </DropdownMenuItem>
                    )}
                    {despacho.estado === 'en_curso' && (
                      <DropdownMenuItem
                        onClick={() => {
                          onUpdateEstado(despacho, 'completado')
                        }}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        {t('despachos.completar')}
                      </DropdownMenuItem>
                    )}
                    {(despacho.estado === 'pendiente' || despacho.estado === 'en_curso') && (
                      <DropdownMenuItem
                        onClick={() => {
                          onUpdateEstado(despacho, 'cancelado')
                        }}
                        className="text-destructive focus:text-destructive"
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        {t('common.cancel')}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
