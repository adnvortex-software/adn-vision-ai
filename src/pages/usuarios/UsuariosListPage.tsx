import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Users } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { UsuariosTable, type UsuarioConDetalles } from '@/components/usuarios'

// Mock data - replace with actual data fetching
const mockUsuarios: UsuarioConDetalles[] = []
const mockCurrentUserId = 'current-user-id'

export default function UsuariosListPage() {
  const navigate = useNavigate()
  const [isLoading] = useState(false)

  const handleView = (usuario: UsuarioConDetalles) => {
    navigate(`/usuarios/${usuario.id}`)
  }

  const handleEdit = (usuario: UsuarioConDetalles) => {
    navigate(`/usuarios/${usuario.id}/editar`)
  }

  return (
    <div className="container mx-auto space-y-6 py-6">
      <PageHeader
        title="Usuarios"
        description="Administra los usuarios del sistema"
        actions={
          <Button
            onClick={() => {
              navigate('/usuarios/nuevo')
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Usuario
          </Button>
        }
      />

      {mockUsuarios.length === 0 && !isLoading ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <Users className="h-12 w-12 text-muted-foreground/30" />
          <h3 className="mt-4 text-lg font-semibold">Sin usuarios</h3>
          <p className="mt-1 text-sm text-muted-foreground">Comienza invitando al primer usuario</p>
          <Button
            className="mt-4"
            onClick={() => {
              navigate('/usuarios/nuevo')
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Invitar Usuario
          </Button>
        </div>
      ) : (
        <UsuariosTable
          usuarios={mockUsuarios}
          isLoading={isLoading}
          currentUserId={mockCurrentUserId}
          onView={handleView}
          onEdit={handleEdit}
        />
      )}
    </div>
  )
}
