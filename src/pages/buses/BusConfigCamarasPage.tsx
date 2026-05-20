import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Camera, Plus, Bus } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingState } from '@/components/common/LoadingState'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CamarasGrid, CamaraForm } from '@/components/camaras'
import type { BusConDetalles, Camara } from '@/types/bus'
import type { Entity } from '@/types/firestore'
import type { CreateCamaraFormData } from '@/schemas/camara.schema'
import { useToast } from '@/hooks/use-toast'

// Mock data - replace with actual data fetching
const mockBus: BusConDetalles | null = null
const mockCamaras: Entity<Camara>[] = []

export default function BusConfigCamarasPage() {
  const { busId } = useParams<{ busId: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isLoading] = useState(false)
  const [showNewCamara, setShowNewCamara] = useState(false)
  const [editingCamara, setEditingCamara] = useState<Entity<Camara> | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  if (isLoading) {
    return <LoadingState fullScreen />
  }

  if (!mockBus) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex flex-col items-center justify-center rounded-lg border py-12">
          <Bus className="h-12 w-12 text-muted-foreground/30" />
          <h3 className="mt-4 text-lg font-semibold">Bus no encontrado</h3>
          <p className="mt-1 text-sm text-muted-foreground">El bus con ID {busId} no existe</p>
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => {
              navigate('/buses')
            }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a buses
          </Button>
        </div>
      </div>
    )
  }

  const handleCreateCamara = async (data: CreateCamaraFormData) => {
    setIsSaving(true)
    try {
      // TODO: Implement actual Firebase create
      // TODO: Create camara in Firebase
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: 'Camara creada',
        description: `${data.nombre} ha sido configurada`,
      })

      setShowNewCamara(false)
    } catch {
      toast({
        title: 'Error',
        description: 'No se pudo crear la camara',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditCamara = async (data: CreateCamaraFormData) => {
    if (!editingCamara) return
    setIsSaving(true)
    try {
      // TODO: Implement actual Firebase update
      // TODO: Update camara in Firebase
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: 'Camara actualizada',
        description: `${data.nombre} ha sido modificada`,
      })

      setEditingCamara(null)
    } catch {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la camara',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleConfigNovedades = (camara: Entity<Camara>) => {
    navigate(`/buses/${busId ?? ''}/camaras/${camara.id}/novedades`)
  }

  return (
    <div className="container mx-auto space-y-6 py-6">
      <PageHeader
        title={
          <div className="flex items-center gap-2">
            <Camera className="h-6 w-6" />
            Camaras - {mockBus.placa}
          </div>
        }
        description="Configura las camaras y deteccion de novedades"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                navigate(`/buses/${busId ?? ''}`)
              }}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
            <Button
              onClick={() => {
                setShowNewCamara(true)
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nueva Camara
            </Button>
          </div>
        }
      />

      {mockCamaras.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <Camera className="h-12 w-12 text-muted-foreground/30" />
          <h3 className="mt-4 text-lg font-semibold">Sin camaras</h3>
          <p className="mt-1 text-sm text-muted-foreground">Agrega la primera camara al bus</p>
          <Button
            className="mt-4"
            onClick={() => {
              setShowNewCamara(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Agregar Camara
          </Button>
        </div>
      ) : (
        <CamarasGrid
          camaras={mockCamaras}
          onEdit={setEditingCamara}
          onConfigNovedades={handleConfigNovedades}
        />
      )}

      {/* New Camera Dialog */}
      <Dialog open={showNewCamara} onOpenChange={setShowNewCamara}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Nueva Camara
            </DialogTitle>
            <DialogDescription>Configura una nueva camara para {mockBus.placa}</DialogDescription>
          </DialogHeader>
          <CamaraForm
            busPlaca={mockBus.placa}
            onSubmit={handleCreateCamara}
            onCancel={() => {
              setShowNewCamara(false)
            }}
            isLoading={isSaving}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Camera Dialog */}
      <Dialog
        open={!!editingCamara}
        onOpenChange={(open) => {
          if (!open) setEditingCamara(null)
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Editar Camara
            </DialogTitle>
            <DialogDescription>
              Modifica la configuracion de {editingCamara?.nombre}
            </DialogDescription>
          </DialogHeader>
          {editingCamara && (
            <CamaraForm
              camara={editingCamara}
              busPlaca={mockBus.placa}
              onSubmit={handleEditCamara}
              onCancel={() => {
                setEditingCamara(null)
              }}
              isLoading={isSaving}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
