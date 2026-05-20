import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Filter, RefreshCw } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { NovedadesEventosTable } from '@/components/novedades'
import type { EventoConDetalles } from '@/types/novedad'

// Mock data - replace with actual data fetching
const mockEventos: EventoConDetalles[] = []

export default function NovedadesEventosPage() {
  const navigate = useNavigate()
  const [isLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // TODO: Implement actual refresh
    await new Promise((resolve) => setTimeout(resolve, 1000))
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

      {mockEventos.length === 0 && !isLoading ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <AlertTriangle className="h-12 w-12 text-muted-foreground/30" />
          <h3 className="mt-4 text-lg font-semibold">Sin eventos</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            No hay eventos de novedades registrados
          </p>
        </div>
      ) : (
        <NovedadesEventosTable eventos={mockEventos} isLoading={isLoading} onView={handleView} />
      )}
    </div>
  )
}
