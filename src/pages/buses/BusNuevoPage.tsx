import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { BusWizard } from '@/components/buses'
import type { BusWizardData } from '@/types/bus'
import type { Sucursal, Propietario } from '@/types/cliente'
import type { Entity } from '@/types/firestore'
import { useToast } from '@/hooks/use-toast'

// Mock data - replace with actual data fetching
const mockSucursales: Entity<Sucursal>[] = []
const mockPropietarios: Entity<Propietario>[] = []

export default function BusNuevoPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const handleComplete = async (data: BusWizardData) => {
    setIsLoading(true)
    try {
      // TODO: Implement actual Firebase create
      // TODO: Create bus in Firebase
      await new Promise((resolve) => setTimeout(resolve, 1500))

      toast({
        title: 'Bus creado',
        description: `${data.placa} ha sido registrado con ${String(data.camaras.length)} camaras`,
      })

      navigate('/buses')
    } catch {
      toast({
        title: 'Error',
        description: 'No se pudo crear el bus',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto max-w-3xl space-y-6 py-6">
      <PageHeader
        title="Nuevo Bus"
        description="Configura un nuevo vehiculo con el asistente"
        actions={
          <Button
            variant="outline"
            onClick={() => {
              navigate('/buses')
            }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
        }
      />

      <BusWizard
        clienteId="mock-client-id"
        sucursales={mockSucursales}
        propietarios={mockPropietarios}
        onComplete={handleComplete}
        isLoading={isLoading}
      />
    </div>
  )
}
