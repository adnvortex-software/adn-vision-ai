import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, Bus as BusIcon, Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { BusesTable } from '@/components/buses'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import type { BusConDetalles } from '@/types/bus'
import { deleteBus, canDeleteBus } from '@/services/buses.service'
import { useDataStore } from '@/stores/data.store'
import { useToast } from '@/hooks/use-toast'

export default function BusesListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { buses, busesLoading, loadBuses } = useDataStore()
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    bus: BusConDetalles | null
    isDeleting: boolean
    canDelete: boolean
    reason?: string
  }>({ open: false, bus: null, isDeleting: false, canDelete: true })

  const handleView = (bus: BusConDetalles) => {
    navigate(`/buses/${bus.id}`)
  }

  const handleEdit = (bus: BusConDetalles) => {
    navigate(`/buses/${bus.id}/editar`)
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
        title: t('buses.deleteSuccess'),
        description: t('buses.deleteSuccessDesc', { placa: deleteDialog.bus.placa }),
      })
      setDeleteDialog({ open: false, bus: null, isDeleting: false, canDelete: true })
      await loadBuses(true) // Force refresh
    } catch (error) {
      const message = error instanceof Error ? error.message : t('buses.deleteError')
      toast({
        title: t('common.error'),
        description: message,
        variant: 'destructive',
      })
      setDeleteDialog((prev) => ({ ...prev, isDeleting: false }))
    }
  }

  return (
    <div className="container mx-auto space-y-6 py-6">
      <PageHeader
        title={t('buses.fleetTitle')}
        description={t('buses.fleetDescription')}
        actions={
          <Button
            onClick={() => {
              navigate('/buses/nuevo')
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('buses.nuevo')}
          </Button>
        }
      />

      {busesLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : buses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <BusIcon className="h-12 w-12 text-muted-foreground/30" />
          <h3 className="mt-4 text-lg font-semibold">{t('buses.noBuses')}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{t('buses.noBusesDescription')}</p>
          <Button
            className="mt-4"
            onClick={() => {
              navigate('/buses/nuevo')
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('buses.addBus')}
          </Button>
        </div>
      ) : (
        <BusesTable
          buses={buses}
          isLoading={busesLoading}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={(bus) => void handleDeleteClick(bus)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => {
          if (!open) setDeleteDialog({ open: false, bus: null, isDeleting: false, canDelete: true })
        }}
        title={deleteDialog.canDelete ? t('buses.deleteBus') : t('buses.cannotDelete')}
        description={
          deleteDialog.canDelete
            ? t('buses.confirmDeleteDesc', { placa: deleteDialog.bus?.placa ?? '' })
            : deleteDialog.reason
        }
        confirmLabel={deleteDialog.canDelete ? t('common.delete') : t('buses.understood')}
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
