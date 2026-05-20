import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingState } from '@/components/common/LoadingState'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { EventoConDetalles } from '@/types/novedad'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

// Mock data - replace with actual data fetching
const mockEvento: EventoConDetalles | null = null

export default function NovedadEventoDetailPage() {
  const { eventoId } = useParams<{ eventoId: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isLoading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  if (isLoading) {
    return <LoadingState fullScreen />
  }

  if (!mockEvento) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex flex-col items-center justify-center rounded-lg border py-12">
          <AlertTriangle className="h-12 w-12 text-muted-foreground/30" />
          <h3 className="mt-4 text-lg font-semibold">Evento no encontrado</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            El evento con ID {eventoId} no existe
          </p>
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => {
              navigate('/novedades')
            }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a eventos
          </Button>
        </div>
      </div>
    )
  }

  const handleResolver = async () => {
    setIsProcessing(true)
    try {
      // TODO: Implement actual resolve
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast({ title: 'Evento resuelto', description: 'El evento ha sido marcado como resuelto' })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDescartar = async () => {
    setIsProcessing(true)
    try {
      // TODO: Implement actual discard
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast({
        title: 'Evento descartado',
        description: 'El evento ha sido marcado como descartado',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const estadoConfig = {
    nuevo: { color: 'bg-blue-100 text-blue-700', label: 'Nuevo' },
    revisado: { color: 'bg-amber-100 text-amber-700', label: 'Revisado' },
    resuelto: { color: 'bg-green-100 text-green-700', label: 'Resuelto' },
    descartado: { color: 'bg-gray-100 text-gray-700', label: 'Descartado' },
  }

  return (
    <div className="container mx-auto space-y-6 py-6">
      <PageHeader
        title={
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6" />
            {mockEvento.novedadNombre ?? mockEvento.tipoNovedad}
          </div>
        }
        description={`Bus: ${mockEvento.busPlaca ?? mockEvento.busId}`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                navigate('/novedades')
              }}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
            {mockEvento.estado !== 'resuelto' && mockEvento.estado !== 'descartado' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    void handleDescartar()
                  }}
                  disabled={isProcessing}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Descartar
                </Button>
                <Button
                  onClick={() => {
                    void handleResolver()
                  }}
                  disabled={isProcessing}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Resolver
                </Button>
              </>
            )}
          </div>
        }
      />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Screenshot */}
        <Card>
          <CardHeader>
            <CardTitle>Captura</CardTitle>
          </CardHeader>
          <CardContent>
            {mockEvento.screenshotUrl ? (
              <img
                src={mockEvento.screenshotUrl}
                alt="Screenshot del evento"
                className="w-full rounded-lg"
              />
            ) : (
              <div className="flex h-48 items-center justify-center rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">Sin captura disponible</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detalles */}
        <Card>
          <CardHeader>
            <CardTitle>Detalles del Evento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Estado</p>
                <Badge className={estadoConfig[mockEvento.estado].color}>
                  {estadoConfig[mockEvento.estado].label}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tipo</p>
                <p className="font-medium">
                  {mockEvento.novedadNombre ?? mockEvento.tipoNovedad}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fecha/Hora</p>
                <p className="font-medium">
                  {format(mockEvento.timestamp.toDate(), 'd MMM yyyy, HH:mm', { locale: es })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Camara</p>
                <p className="font-medium">{mockEvento.camaraNombre ?? mockEvento.camaraId}</p>
              </div>
            </div>

            {mockEvento.notas && (
              <div>
                <p className="text-sm text-muted-foreground">Notas</p>
                <p className="mt-1 text-sm">{mockEvento.notas}</p>
              </div>
            )}

            {mockEvento.revisadoPor && (
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">
                  Revisado por {mockEvento.revisadoPor}
                  {mockEvento.revisadoAt &&
                    ` el ${format(mockEvento.revisadoAt.toDate(), 'd MMM yyyy, HH:mm', { locale: es })}`}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
