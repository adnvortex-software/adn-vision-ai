import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Building2 } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { ClientesTable } from '@/components/clientes'
import type { Cliente } from '@/types/cliente'
import type { Entity } from '@/types/firestore'

// Mock data - replace with actual data fetching
const mockClientes: Entity<Cliente>[] = []

export default function ClientesListPage() {
  const navigate = useNavigate()
  const [isLoading] = useState(false)

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

      {mockClientes.length === 0 && !isLoading ? (
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
          clientes={mockClientes}
          isLoading={isLoading}
          onView={handleView}
          onEdit={handleEdit}
          onManageSucursales={handleManageSucursales}
          onManagePropietarios={handleManagePropietarios}
        />
      )}
    </div>
  )
}
