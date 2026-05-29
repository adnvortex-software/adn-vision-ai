import { useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useTranslation } from 'react-i18next'
import { Printer } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { DESPACHO_STATE_LABELS } from '@/types/despacho'
import type { Entity } from '@/types/firestore'
import type { Despacho } from '@/types/despacho'
import type { Timestamp } from 'firebase/firestore'

interface DespachoTirillaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  despacho: Entity<Despacho>
  clienteLogo?: string
}

function formatTimestamp(timestamp: Timestamp | Date | null | undefined): string {
  if (!timestamp) return '-'
  const date = 'toDate' in timestamp ? timestamp.toDate() : timestamp
  return format(date, "d 'de' MMMM 'de' yyyy", { locale: es })
}

function formatTime(timestamp: Timestamp | Date | null | undefined): string {
  if (!timestamp) return '-'
  const date = 'toDate' in timestamp ? timestamp.toDate() : timestamp
  return format(date, 'HH:mm', { locale: es })
}

export function DespachoTirillaModal({
  open,
  onOpenChange,
  despacho,
  clienteLogo,
}: DespachoTirillaModalProps) {
  const { t } = useTranslation()
  const tirillaRef = useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({
    contentRef: tirillaRef,
    documentTitle: `Despacho-${despacho.placa}-${formatTimestamp(despacho.fechaHora)}`,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{t('despachos.tirillaDespacho')}</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  handlePrint()
                }}
              >
                <Printer className="mr-2 h-4 w-4" />
                {t('common.print')}
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Printable Tirilla */}
        <div
          ref={tirillaRef}
          className="bg-white p-6 text-black print:p-4"
          style={{ fontFamily: 'monospace' }}
        >
          {/* Header with logo */}
          <div className="mb-4 flex flex-col items-center border-b-2 border-dashed border-black pb-4">
            {clienteLogo ? (
              <img
                src={clienteLogo}
                alt={despacho.clienteNombre}
                className="mb-2 h-16 object-contain"
              />
            ) : (
              <div className="mb-2 flex h-16 w-32 items-center justify-center rounded bg-gray-200 text-xs text-gray-500">
                {t('despachos.logoCliente')}
              </div>
            )}
            <h2 className="text-center text-lg font-bold uppercase">{despacho.clienteNombre}</h2>
            <p className="text-sm">{t('despachos.tirillaDespacho').toUpperCase()}</p>
          </div>

          {/* Despacho info */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between border-b border-dotted border-gray-400 pb-1">
              <span>Fecha:</span>
              <span className="font-bold">{formatTimestamp(despacho.fechaHora)}</span>
            </div>
            <div className="flex justify-between border-b border-dotted border-gray-400 pb-1">
              <span>Hora:</span>
              <span className="font-bold">{formatTime(despacho.fechaHora)}</span>
            </div>
            <div className="flex justify-between border-b border-dotted border-gray-400 pb-1">
              <span>Placa:</span>
              <span className="font-bold">{despacho.placa}</span>
            </div>
            {despacho.numeroInterno && (
              <div className="flex justify-between border-b border-dotted border-gray-400 pb-1">
                <span>No. Interno:</span>
                <span className="font-bold">{despacho.numeroInterno}</span>
              </div>
            )}
            <div className="flex justify-between border-b border-dotted border-gray-400 pb-1">
              <span>Tipo:</span>
              <span className="font-bold">{despacho.tipoVehiculo}</span>
            </div>
            <div className="flex justify-between border-b border-dotted border-gray-400 pb-1">
              <span>Conductor:</span>
              <span className="font-bold">{despacho.conductor}</span>
            </div>
            <div className="border-b border-dotted border-gray-400 pb-1">
              <span>Ruta:</span>
              <p className="mt-1 font-bold">{despacho.ruta}</p>
            </div>
            <div className="flex justify-between border-b border-dotted border-gray-400 pb-1">
              <span>Estado:</span>
              <span className="font-bold">{DESPACHO_STATE_LABELS[despacho.estado]}</span>
            </div>
          </div>

          {/* Despachador info */}
          <div className="mt-4 border-t-2 border-dashed border-black pt-4">
            <div className="text-center text-xs">
              <p>Despachado por: {despacho.despachadorNombre}</p>
              <p className="mt-1 text-gray-500">
                {format(
                  despacho.createdAt && 'toDate' in despacho.createdAt
                    ? despacho.createdAt.toDate()
                    : new Date(),
                  'dd/MM/yyyy HH:mm:ss',
                  { locale: es }
                )}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-4 border-t-2 border-dashed border-black pt-4 text-center text-xs">
            <p className="font-bold">ADN LYNX AI</p>
            <p className="text-gray-500">Sistema de Gestion de Despachos</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
