import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Building2, Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { ClientesTable } from '@/components/clientes'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import type { Cliente } from '@/types/cliente'
import type { Entity } from '@/types/firestore'
import { listClientes, deleteCliente, canDeleteCliente } from '@/services/clientes.service'
import { useToast } from '@/hooks/use-toast'

export default function ClientesListPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [clientes, setClientes] = useState<Entity<Cliente>[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    cliente: Entity<Cliente> | null
    isDeleting: boolean
    canDelete: boolean
    reason?: string
  }>({ open: false, cliente: null, isDeleting: false, canDelete: true })

  const loadClientes = async () => {
    try {
      const result = await listClientes({ limit: 100 })
      setClientes(result.data)
    } catch (error) {
      console.error('Error loading clientes:', error)
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los clientes',
        variant: 'destructive',
      })
    }
  }

  useEffect(() => {
    void loadClientes().finally(() => {
      setIsLoading(false)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
        title: 'Cliente eliminado',
        description: `${deleteDialog.cliente.nombre} ha sido eliminado`,
      })
      setDeleteDialog({ open: false, cliente: null, isDeleting: false, canDelete: true })
      await loadClientes()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo eliminar el cliente'
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
        title="Clientes"
        description="Administra los clientes de la plataforma"
        actions={
          <Button
            onClick={() => {
              navigate('/clientes/nuevo')
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Cliente
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : clientes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <Building2 className="h-12 w-12 text-muted-foreground/30" />
          <h3 className="mt-4 text-lg font-semibold">Sin clientes</h3>
          <p className="mt-1 text-sm text-muted-foreground">Comienza agregando tu primer cliente</p>
          <Button
            className="mt-4"
            onClick={() => {
              navigate('/clientes/nuevo')
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Agregar Cliente
          </Button>
        </div>
      ) : (
        <ClientesTable
          clientes={clientes}
          isLoading={isLoading}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={(cliente) => void handleDeleteClick(cliente)}
          onManageSucursales={handleManageSucursales}
          onManagePropietarios={handleManagePropietarios}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => {
          if (!open)
            setDeleteDialog({ open: false, cliente: null, isDeleting: false, canDelete: true })
        }}
        title={deleteDialog.canDelete ? 'Eliminar Cliente' : 'No se puede eliminar'}
        description={
          deleteDialog.canDelete
            ? `¿Estás seguro de eliminar "${deleteDialog.cliente?.nombre ?? ''}"? Esta acción se puede deshacer desde la base de datos.`
            : deleteDialog.reason
        }
        confirmLabel={deleteDialog.canDelete ? 'Eliminar' : 'Entendido'}
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
