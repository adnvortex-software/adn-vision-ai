import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, User } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { ConductoresTable } from '@/components/conductores'
import type { ConductorConDetalles } from '@/types/conductor'

// Mock data - replace with actual data fetching
const mockConductores: ConductorConDetalles[] = []

export default function ConductoresListPage() {
  const navigate = useNavigate()
  const [isLoading] = useState(false)

  const handleView = (conductor: ConductorConDetalles) => {
    navigate(`/conductores/${conductor.id}`)
  }

  const handleEdit = (conductor: ConductorConDetalles) => {
    navigate(`/conductores/${conductor.id}/editar`)
  }

  return (
    <div className="container mx-auto space-y-6 py-6">
      <PageHeader
        title="Conductores"
        description="Administra los conductores registrados"
        actions={
          <Button
            onClick={() => {
              navigate('/conductores/nuevo')
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Conductor
          </Button>
        }
      />

      {mockConductores.length === 0 && !isLoading ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <User className="h-12 w-12 text-muted-foreground/30" />
          <h3 className="mt-4 text-lg font-semibold">Sin conductores</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Comienza agregando el primer conductor
          </p>
          <Button
            className="mt-4"
            onClick={() => {
              navigate('/conductores/nuevo')
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Agregar Conductor
          </Button>
        </div>
      ) : (
        <ConductoresTable
          conductores={mockConductores}
          isLoading={isLoading}
          onView={handleView}
          onEdit={handleEdit}
        />
      )}
    </div>
  )
}
