import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, Users } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { UsuariosTable, type UsuarioConDetalles } from '@/components/usuarios'
import { useAuthStore } from '@/stores/auth.store'
import { listUsuarios } from '@/services/usuarios.service'
import { getCliente } from '@/services/clientes.service'
import { useToast } from '@/hooks/use-toast'

export default function UsuariosListPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { toast } = useToast()
  const { usuario: currentUser } = useAuthStore()
  const [usuarios, setUsuarios] = useState<UsuarioConDetalles[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadUsuarios = async () => {
      try {
        setIsLoading(true)
        const result = await listUsuarios({ limit: 100 })

        // Enrich users with client names
        const enrichedUsuarios = await Promise.all(
          result.data.map(async (user) => {
            let clienteNombre: string | undefined
            if (user.clienteId) {
              const cliente = await getCliente(user.clienteId)
              clienteNombre = cliente?.nombre
            }
            return {
              ...user,
              clienteNombre,
              sucursalesNombres: [],
            }
          })
        )

        setUsuarios(enrichedUsuarios)
      } catch (error) {
        console.error('Error loading usuarios:', error)
        toast({
          variant: 'destructive',
          title: t('common.error'),
          description: t('usuarios.loadError'),
        })
      } finally {
        setIsLoading(false)
      }
    }

    void loadUsuarios()
  }, [toast])

  const handleView = (usuario: UsuarioConDetalles) => {
    navigate(`/usuarios/${usuario.id}`)
  }

  const handleEdit = (usuario: UsuarioConDetalles) => {
    navigate(`/usuarios/${usuario.id}/editar`)
  }

  return (
    <div className="container mx-auto space-y-6 py-6">
      <PageHeader
        title={t('usuarios.title')}
        description={t('usuarios.description')}
        actions={
          <Button
            onClick={() => {
              navigate('/usuarios/nuevo')
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('usuarios.nuevo')}
          </Button>
        }
      />

      {usuarios.length === 0 && !isLoading ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <Users className="h-12 w-12 text-muted-foreground/30" />
          <h3 className="mt-4 text-lg font-semibold">{t('usuarios.noUsuarios')}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{t('usuarios.noUsuariosHint')}</p>
          <Button
            className="mt-4"
            onClick={() => {
              navigate('/usuarios/nuevo')
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('usuarios.invitar')}
          </Button>
        </div>
      ) : (
        <UsuariosTable
          usuarios={usuarios}
          isLoading={isLoading}
          currentUserId={currentUser?.uid ?? ''}
          onView={handleView}
          onEdit={handleEdit}
        />
      )}
    </div>
  )
}
