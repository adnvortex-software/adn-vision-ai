import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Bus } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { BusesTable } from '@/components/buses'
import type { BusConDetalles } from '@/types/bus'

// Mock data - replace with actual data fetching
const mockBuses: BusConDetalles[] = []

export default function BusesListPage() {
  const navigate = useNavigate()
  const [isLoading] = useState(false)

  const handleView = (bus: BusConDetalles) => {
    navigate(`/buses/${bus.id}`)
  }

  const handleEdit = (bus: BusConDetalles) => {
    navigate(`/buses/${bus.id}/editar`)
  }

  const handleConfigCamaras = (bus: BusConDetalles) => {
    navigate(`/buses/${bus.id}/camaras`)
  }

  return (
    <div className="container mx-auto space-y-6 py-6">
      <PageHeader
        title="Flota de Buses"
        description="Administra los vehiculos y sus configuraciones"
        actions={
          <Button
            onClick={() => {
              navigate('/buses/nuevo')
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Bus
          </Button>
        }
      />

      {mockBuses.length === 0 && !isLoading ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <Bus className="h-12 w-12 text-muted-foreground/30" />
          <h3 className="mt-4 text-lg font-semibold">Sin buses</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Comienza agregando tu primer vehiculo
          </p>
          <Button
            className="mt-4"
            onClick={() => {
              navigate('/buses/nuevo')
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Agregar Bus
          </Button>
        </div>
      ) : (
        <BusesTable
          buses={mockBuses}
          isLoading={isLoading}
          onView={handleView}
          onEdit={handleEdit}
          onManageCamaras={handleConfigCamaras}
        />
      )}
    </div>
  )
}
