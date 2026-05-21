import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, User, Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { ConductoresTable } from '@/components/conductores'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import type { ConductorConDetalles } from '@/types/conductor'
import {
  listConductores,
  deleteConductor,
  canDeleteConductor,
} from '@/services/conductores.service'
import { useToast } from '@/hooks/use-toast'

export default function ConductoresListPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [conductores, setConductores] = useState<ConductorConDetalles[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    conductor: ConductorConDetalles | null
    isDeleting: boolean
    canDelete: boolean
    reason?: string
  }>({ open: false, conductor: null, isDeleting: false, canDelete: true })

  useEffect(() => {
    async function loadConductores() {
      try {
        const result = await listConductores({ limit: 100 })
        // Convert to ConductorConDetalles
        const conductoresConDetalles: ConductorConDetalles[] = result.data.map((c) => {
          const fechaVenc =
            'toDate' in c.fechaVencimientoLicencia
              ? (c.fechaVencimientoLicencia as { toDate: () => Date }).toDate()
              : new Date()
          const diasParaVencimiento = Math.ceil(
            (fechaVenc.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          )
          return {
            ...c,
            sucursalNombre: '',
            propietarioNombre: undefined,
            busAsignadoPlaca: undefined,
            licenciaVencida: diasParaVencimiento < 0,
            diasParaVencimiento,
          }
        })
        setConductores(conductoresConDetalles)
      } catch (error) {
        console.error('Error loading conductores:', error)
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los conductores',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }
    void loadConductores()
  }, [toast])

  const handleView = (conductor: ConductorConDetalles) => {
    navigate(`/conductores/${conductor.id}`)
  }

  const handleEdit = (conductor: ConductorConDetalles) => {
    navigate(`/conductores/${conductor.id}/editar`)
  }

  const handleDeleteClick = async (conductor: ConductorConDetalles) => {
    const { canDelete, reason } = await canDeleteConductor(conductor.id)
    setDeleteDialog({
      open: true,
      conductor,
      isDeleting: false,
      canDelete,
      reason,
    })
  }

  const handleConfirmDelete = async () => {
    if (!deleteDialog.conductor || !deleteDialog.canDelete) return

    setDeleteDialog((prev) => ({ ...prev, isDeleting: true }))

    try {
      await deleteConductor(deleteDialog.conductor.id)
      toast({
        title: 'Conductor eliminado',
        description: `${deleteDialog.conductor.nombre} ha sido eliminado`,
      })
      setDeleteDialog({ open: false, conductor: null, isDeleting: false, canDelete: true })
      // Reload list
      const result = await listConductores({ limit: 100 })
      const conductoresConDetalles: ConductorConDetalles[] = result.data.map((c) => {
        const fechaVenc =
          'toDate' in c.fechaVencimientoLicencia
            ? (c.fechaVencimientoLicencia as { toDate: () => Date }).toDate()
            : new Date()
        const diasParaVencimiento = Math.ceil(
          (fechaVenc.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
        return {
          ...c,
          sucursalNombre: '',
          propietarioNombre: undefined,
          busAsignadoPlaca: undefined,
          licenciaVencida: diasParaVencimiento < 0,
          diasParaVencimiento,
        }
      })
      setConductores(conductoresConDetalles)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo eliminar el conductor'
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

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : conductores.length === 0 ? (
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
          conductores={conductores}
          isLoading={isLoading}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={(conductor) => void handleDeleteClick(conductor)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => {
          if (!open)
            setDeleteDialog({ open: false, conductor: null, isDeleting: false, canDelete: true })
        }}
        title={deleteDialog.canDelete ? 'Eliminar Conductor' : 'No se puede eliminar'}
        description={
          deleteDialog.canDelete
            ? `¿Estás seguro de eliminar a "${deleteDialog.conductor?.nombre ?? ''}"? Esta acción se puede deshacer desde la base de datos.`
            : deleteDialog.reason
        }
        confirmLabel={deleteDialog.canDelete ? 'Eliminar' : 'Entendido'}
        variant={deleteDialog.canDelete ? 'destructive' : 'default'}
        onConfirm={() => {
          if (deleteDialog.canDelete) {
            void handleConfirmDelete()
          } else {
            setDeleteDialog({ open: false, conductor: null, isDeleting: false, canDelete: true })
          }
        }}
        isLoading={deleteDialog.isDeleting}
      />
    </div>
  )
}
