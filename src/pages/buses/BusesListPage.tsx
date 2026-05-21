import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Bus as BusIcon, Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { BusesTable } from '@/components/buses'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import type { BusConDetalles, Bus } from '@/types/bus'
import type { Entity } from '@/types/firestore'
import { listBuses, deleteBus, canDeleteBus } from '@/services/buses.service'
import { useToast } from '@/hooks/use-toast'

export default function BusesListPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [buses, setBuses] = useState<BusConDetalles[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    bus: BusConDetalles | null
    isDeleting: boolean
    canDelete: boolean
    reason?: string
  }>({ open: false, bus: null, isDeleting: false, canDelete: true })

  const loadBuses = async () => {
    try {
      const result = await listBuses({ limit: 100 })
      const busesConDetalles: BusConDetalles[] = result.data.map((bus: Entity<Bus>) => ({
        ...bus,
        clienteNombre: '',
        sucursalNombre: '',
      }))
      setBuses(busesConDetalles)
    } catch (error) {
      console.error('Error loading buses:', error)
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los buses',
        variant: 'destructive',
      })
    }
  }

  useEffect(() => {
    void loadBuses().finally(() => {
      setIsLoading(false)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleView = (bus: BusConDetalles) => {
    navigate(`/buses/${bus.id}`)
  }

  const handleEdit = (bus: BusConDetalles) => {
    navigate(`/buses/${bus.id}/editar`)
  }

  const handleConfigCamaras = (bus: BusConDetalles) => {
    navigate(`/buses/${bus.id}/camaras`)
  }

  const handleDeleteClick = async (bus: BusConDetalles) => {
    const { canDelete, reason } = await canDeleteBus(bus.id)
    setDeleteDialog({
      open: true,
      bus,
      isDeleting: false,
      canDelete,
      reason,
    })
  }

  const handleConfirmDelete = async () => {
    if (!deleteDialog.bus || !deleteDialog.canDelete) return

    setDeleteDialog((prev) => ({ ...prev, isDeleting: true }))

    try {
      await deleteBus(deleteDialog.bus.id)
      toast({
        title: 'Bus eliminado',
        description: `${deleteDialog.bus.placa} ha sido eliminado`,
      })
      setDeleteDialog({ open: false, bus: null, isDeleting: false, canDelete: true })
      await loadBuses()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo eliminar el bus'
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      })
      setDeleteDialog((prev) => ({ ...prev, isDeleting: false }))
    }
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

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : buses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <BusIcon className="h-12 w-12 text-muted-foreground/30" />
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
          buses={buses}
          isLoading={isLoading}
          onView={handleView}
          onEdit={handleEdit}
          onManageCamaras={handleConfigCamaras}
          onDelete={(bus) => void handleDeleteClick(bus)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => {
          if (!open) setDeleteDialog({ open: false, bus: null, isDeleting: false, canDelete: true })
        }}
        title={deleteDialog.canDelete ? 'Eliminar Bus' : 'No se puede eliminar'}
        description={
          deleteDialog.canDelete
            ? `¿Estás seguro de eliminar el bus "${deleteDialog.bus?.placa ?? ''}"? Esta acción se puede deshacer desde la base de datos.`
            : deleteDialog.reason
        }
        confirmLabel={deleteDialog.canDelete ? 'Eliminar' : 'Entendido'}
        variant={deleteDialog.canDelete ? 'destructive' : 'default'}
        onConfirm={() => {
          if (deleteDialog.canDelete) {
            void handleConfirmDelete()
          } else {
            setDeleteDialog({ open: false, bus: null, isDeleting: false, canDelete: true })
          }
        }}
        isLoading={deleteDialog.isDeleting}
      />
    </div>
  )
}
