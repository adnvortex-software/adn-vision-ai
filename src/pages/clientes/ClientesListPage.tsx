import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, Building2, Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { ClientesTable } from '@/components/clientes'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import type { Cliente } from '@/types/cliente'
import type { Entity } from '@/types/firestore'
import { deleteCliente, canDeleteCliente } from '@/services/clientes.service'
import { useDataStore } from '@/stores/data.store'
import { useToast } from '@/hooks/use-toast'

export default function ClientesListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { clientes, clientesLoading, loadClientes } = useDataStore()
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    cliente: Entity<Cliente> | null
    isDeleting: boolean
    canDelete: boolean
    reason?: string
  }>({ open: false, cliente: null, isDeleting: false, canDelete: true })

  const handleView = (cliente: Entity<Cliente>) => {
    navigate(`/clientes/${cliente.id}`)
  }

  const handleEdit = (cliente: Entity<Cliente>) => {
    navigate(`/clientes/${cliente.id}/editar`)
  }

  const handleManageSucursales = (cliente: Entity<Cliente>) => {
    navigate(`/clientes/${cliente.id}/sucursales`)
  }

  const handleManagePropietarios = (cliente: Entity<Cliente>) => {
    navigate(`/clientes/${cliente.id}/propietarios`)
  }

  const handleDeleteClick = async (cliente: Entity<Cliente>) => {
    // Check if can delete
    const { canDelete, reason } = await canDeleteCliente(cliente.id)
    setDeleteDialog({
      open: true,
      cliente,
      isDeleting: false,
      canDelete,
      reason,
    })
  }

  const handleConfirmDelete = async () => {
    if (!deleteDialog.cliente || !deleteDialog.canDelete) return

    setDeleteDialog((prev) => ({ ...prev, isDeleting: true }))

    try {
      await deleteCliente(deleteDialog.cliente.id)
      toast({
        title: t('clientes.deleteSuccess'),
        description: t('clientes.deleteSuccessDescription', { name: deleteDialog.cliente.nombre }),
      })
      setDeleteDialog({ open: false, cliente: null, isDeleting: false, canDelete: true })
      await loadClientes(true) // Force refresh
    } catch (error) {
      const message = error instanceof Error ? error.message : t('clientes.deleteError')
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
        title={t('clientes.title')}
        description={t('clientes.description')}
        actions={
          <Button
            data-tour="new-client-btn"
            onClick={() => {
              navigate('/clientes/nuevo')
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('clientes.nuevo')}
          </Button>
        }
      />

      {clientesLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : clientes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <Building2 className="h-12 w-12 text-muted-foreground/30" />
          <h3 className="mt-4 text-lg font-semibold">{t('clientes.noClientes')}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('clientes.noClientesDescription')}
          </p>
          <Button
            className="mt-4"
            onClick={() => {
              navigate('/clientes/nuevo')
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('clientes.addCliente')}
          </Button>
        </div>
      ) : (
        <div data-tour="clients-table">
          <ClientesTable
            clientes={clientes}
            isLoading={clientesLoading}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={(cliente) => void handleDeleteClick(cliente)}
            onManageSucursales={handleManageSucursales}
            onManagePropietarios={handleManagePropietarios}
          />
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => {
          if (!open)
            setDeleteDialog({ open: false, cliente: null, isDeleting: false, canDelete: true })
        }}
        title={deleteDialog.canDelete ? t('clientes.confirmDelete') : t('clientes.cannotDelete')}
        description={
          deleteDialog.canDelete
            ? t('clientes.confirmDeleteDescription', { name: deleteDialog.cliente?.nombre ?? '' })
            : deleteDialog.reason
        }
        confirmLabel={deleteDialog.canDelete ? t('common.delete') : t('common.understood')}
        variant={deleteDialog.canDelete ? 'destructive' : 'default'}
        onConfirm={() => {
          if (deleteDialog.canDelete) {
            void handleConfirmDelete()
          } else {
            setDeleteDialog({ open: false, cliente: null, isDeleting: false, canDelete: true })
          }
        }}
        isLoading={deleteDialog.isDeleting}
      />
    </div>
  )
}
