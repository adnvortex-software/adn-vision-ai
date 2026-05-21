import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Filter, RefreshCw, Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { NovedadesEventosTable } from '@/components/novedades'
import type { EventoConDetalles } from '@/types/novedad'
import { listEventos } from '@/services/novedades.service'
import { useToast } from '@/hooks/use-toast'

export default function NovedadesEventosPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [eventos, setEventos] = useState<EventoConDetalles[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const loadEventos = async () => {
    try {
      const result = await listEventos({ limit: 100 })
      const eventosConDetalles: EventoConDetalles[] = result.data.map((e) => ({
        ...e,
        busPlaca: e.busId,
        camaraNombre: e.camaraId,
        novedadNombre: e.tipoNovedad,
        novedadCategoria: 'operativa' as const,
      }))
      setEventos(eventosConDetalles)
    } catch (error) {
      console.error('Error loading eventos:', error)
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los eventos',
        variant: 'destructive',
      })
    }
  }

  useEffect(() => {
    void loadEventos().finally(() => {
      setIsLoading(false)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadEventos()
    setIsRefreshing(false)
  }

  const handleView = (evento: EventoConDetalles) => {
    navigate(`/novedades/${evento.id}`)
  }

  return (
    <div className="container mx-auto space-y-6 py-6">
      <PageHeader
        title="Eventos de Novedades"
        description="Monitorea y gestiona los eventos detectados"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                void handleRefresh()
              }}
              disabled={isRefreshing}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filtros
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : eventos.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <AlertTriangle className="h-12 w-12 text-muted-foreground/30" />
          <h3 className="mt-4 text-lg font-semibold">Sin eventos</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            No hay eventos de novedades registrados
          </p>
        </div>
      ) : (
        <NovedadesEventosTable eventos={eventos} isLoading={isLoading} onView={handleView} />
      )}
    </div>
  )
}
