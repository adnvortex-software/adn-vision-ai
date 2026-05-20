import { useState } from 'react'
import {
  AlertTriangle,
  Bus,
  Video,
  Clock,
  User,
  FileText,
  CheckCircle,
  XCircle,
  MessageSquare,
  Loader2,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { EventoEstadoBadge } from './NovedadesEventosTable'
import type { EventoConDetalles } from '@/types/novedad'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface NovedadDetailModalProps {
  evento: EventoConDetalles | null
  isOpen: boolean
  onClose: () => void
  onResolve?: (evento: EventoConDetalles, notas: string) => Promise<void>
  onDiscard?: (evento: EventoConDetalles, notas: string) => Promise<void>
  onGeneratePdf?: (evento: EventoConDetalles) => Promise<void>
}

function formatTimestamp(timestamp: unknown): string {
  try {
    if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp) {
      const date = (timestamp as { toDate: () => Date }).toDate()
      return format(date, "EEEE d 'de' MMMM 'de' yyyy, HH:mm:ss", { locale: es })
    }
    return '-'
  } catch {
    return '-'
  }
}

export function NovedadDetailModal({
  evento,
  isOpen,
  onClose,
  onResolve,
  onDiscard,
  onGeneratePdf,
}: NovedadDetailModalProps) {
  const [notas, setNotas] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const handleResolve = async () => {
    if (!evento || !onResolve) return
    setIsProcessing(true)
    try {
      await onResolve(evento, notas)
      setNotas('')
      onClose()
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDiscard = async () => {
    if (!evento || !onDiscard) return
    setIsProcessing(true)
    try {
      await onDiscard(evento, notas)
      setNotas('')
      onClose()
    } finally {
      setIsProcessing(false)
    }
  }

  const handleGeneratePdf = async () => {
    if (!evento || !onGeneratePdf) return
    setIsProcessing(true)
    try {
      await onGeneratePdf(evento)
    } finally {
      setIsProcessing(false)
    }
  }

  if (!evento) return null

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <DialogTitle>{evento.novedadNombre ?? evento.tipoNovedad}</DialogTitle>
          </div>
          <DialogDescription asChild>
            <span>Detalles del evento detectado</span>
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Screenshot */}
          <div className="space-y-4">
            {evento.screenshotUrl ? (
              <div className="overflow-hidden rounded-lg border">
                <img src={evento.screenshotUrl} alt="Captura del evento" className="w-full" />
              </div>
            ) : (
              <div className="flex aspect-video items-center justify-center rounded-lg border bg-muted">
                <p className="text-sm text-muted-foreground">Sin imagen disponible</p>
              </div>
            )}

            {/* Video clip link */}
            {evento.videoClipUrl && (
              <Button variant="outline" className="w-full" asChild>
                <a href={evento.videoClipUrl} target="_blank" rel="noopener noreferrer">
                  <Video className="mr-2 h-4 w-4" />
                  Ver video clip
                </a>
              </Button>
            )}
          </div>

          {/* Details */}
          <div className="space-y-4">
            {/* Estado */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Estado</span>
              <EventoEstadoBadge estado={evento.estado} />
            </div>

            {/* Timestamp */}
            <div className="flex items-start gap-2">
              <Clock className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Fecha y hora</p>
                <p className="text-sm text-muted-foreground">{formatTimestamp(evento.timestamp)}</p>
              </div>
            </div>

            {/* Bus */}
            <div className="flex items-start gap-2">
              <Bus className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Vehiculo</p>
                <p className="text-sm text-muted-foreground">{evento.busPlaca ?? '-'}</p>
              </div>
            </div>

            {/* Camera */}
            <div className="flex items-start gap-2">
              <Video className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Camara</p>
                <p className="text-sm text-muted-foreground">{evento.camaraNombre ?? '-'}</p>
              </div>
            </div>

            {/* Reviewed by */}
            {evento.revisadoPor && (
              <div className="flex items-start gap-2">
                <User className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Revisado por</p>
                  <p className="text-sm text-muted-foreground">
                    {evento.revisadoPor}
                    {evento.revisadoAt && ` - ${formatTimestamp(evento.revisadoAt)}`}
                  </p>
                </div>
              </div>
            )}

            {/* Existing notes */}
            {evento.notas && (
              <div className="rounded-lg bg-muted p-3">
                <p className="mb-1 text-xs font-medium text-muted-foreground">Notas</p>
                <p className="text-sm">{evento.notas}</p>
              </div>
            )}

            {/* Additional data */}
            {Object.keys(evento.datos).length > 0 && (
              <div className="rounded-lg border p-3">
                <p className="mb-2 text-xs font-medium text-muted-foreground">Datos adicionales</p>
                <pre className="text-xs text-muted-foreground">
                  {JSON.stringify(evento.datos, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Actions section */}
        {evento.estado !== 'resuelto' && evento.estado !== 'descartado' && (
          <div className="space-y-4 border-t pt-4">
            {/* Notes input */}
            <div className="space-y-2">
              <Label htmlFor="notas" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Notas (opcional)
              </Label>
              <Textarea
                id="notas"
                placeholder="Agregar notas sobre la resolucion..."
                value={notas}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                  setNotas(e.target.value)
                }}
                rows={2}
                disabled={isProcessing}
              />
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
              {onResolve && (
                <Button
                  onClick={() => {
                    void handleResolve()
                  }}
                  disabled={isProcessing}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isProcessing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  )}
                  Marcar Resuelto
                </Button>
              )}
              {onDiscard && (
                <Button
                  variant="outline"
                  onClick={() => {
                    void handleDiscard()
                  }}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="mr-2 h-4 w-4" />
                  )}
                  Descartar
                </Button>
              )}
              {onGeneratePdf && (
                <Button
                  variant="outline"
                  onClick={() => {
                    void handleGeneratePdf()
                  }}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="mr-2 h-4 w-4" />
                  )}
                  Generar PDF
                </Button>
              )}
            </div>
          </div>
        )}

        {/* PDF download if exists */}
        {evento.reportePdfUrl && (
          <div className="border-t pt-4">
            <Button variant="outline" className="w-full" asChild>
              <a href={evento.reportePdfUrl} target="_blank" rel="noopener noreferrer">
                <FileText className="mr-2 h-4 w-4" />
                Descargar PDF del reporte
              </a>
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
