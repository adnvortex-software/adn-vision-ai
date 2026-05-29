import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingState } from '@/components/common/LoadingState'
import { Button } from '@/components/ui/button'
import { ClienteForm } from '@/components/clientes'
import type { CreateClienteFormData } from '@/schemas/cliente.schema'
import type { Cliente } from '@/types/cliente'
import type { Entity } from '@/types/firestore'
import { useToast } from '@/hooks/use-toast'
import { createCliente, getCliente, updateCliente } from '@/services/clientes.service'
import { uploadClienteLogo } from '@/services/storage.service'

export default function ClienteNuevoPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { clienteId } = useParams<{ clienteId: string }>()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(!!clienteId)
  const [cliente, setCliente] = useState<Entity<Cliente> | null>(null)

  const isEditing = !!clienteId

  // Fetch existing client if editing
  useEffect(() => {
    if (!clienteId) return

    const fetchCliente = async () => {
      try {
        const data = await getCliente(clienteId)
        if (data) {
          setCliente(data)
        } else {
          toast({
            title: t('common.error'),
            description: t('clientes.notFound'),
            variant: 'destructive',
          })
          navigate('/clientes')
        }
      } catch (err) {
        console.error('Error fetching cliente:', err)
        toast({
          title: t('common.error'),
          description: t('clientes.loadError'),
          variant: 'destructive',
        })
        navigate('/clientes')
      } finally {
        setIsFetching(false)
      }
    }

    void fetchCliente()
  }, [clienteId, navigate, toast])

  const handleSubmit = async (data: CreateClienteFormData, logoFile?: File) => {
    setIsLoading(true)
    try {
      if (isEditing && clienteId) {
        // Update existing client
        const updateData: Partial<Cliente> = {
          nombre: data.nombre,
          nit: data.nit,
          contactoEmail: data.contactoEmail,
          contactoTelefono: data.contactoTelefono,
          planContratado: data.planContratado,
        }

        // Upload logo if provided
        if (logoFile) {
          const logoUrl = await uploadClienteLogo(clienteId, logoFile)
          updateData.logoUrl = logoUrl
        }

        await updateCliente(clienteId, updateData)

        toast({
          title: t('clientes.updateSuccess'),
          description: t('clientes.updateSuccessDescription', { name: data.nombre }),
        })
      } else {
        // Create new client
        const newClienteId = await createCliente(data, 'system')

        // Upload logo if provided
        if (logoFile) {
          try {
            const logoUrl = await uploadClienteLogo(newClienteId, logoFile)
            await updateCliente(newClienteId, { logoUrl })
          } catch (err) {
            console.error('Error uploading logo:', err)
            // Don't fail the whole operation, just warn
            toast({
              title: t('common.warning'),
              description: t('clientes.logoUploadError'),
              variant: 'destructive',
            })
          }
        }

        toast({
          title: t('clientes.createSuccess'),
          description: t('clientes.createSuccessDescription', { name: data.nombre }),
        })
      }

      navigate('/clientes')
    } catch (err) {
      const message = err instanceof Error ? err.message : t('clientes.saveError')
      toast({
        title: t('common.error'),
        description: message,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetching) {
    return <LoadingState fullScreen message={t('clientes.loading')} />
  }

  return (
    <div className="container mx-auto max-w-2xl space-y-6 py-6">
      <PageHeader
        title={isEditing ? t('clientes.editCliente') : t('clientes.nuevo')}
        description={isEditing ? t('clientes.editDescription') : t('clientes.newDescription')}
        actions={
          <Button
            variant="outline"
            onClick={() => {
              navigate('/clientes')
            }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('common.cancel')}
          </Button>
        }
      />

      <ClienteForm
        cliente={cliente ?? undefined}
        onSubmit={handleSubmit}
        onCancel={() => {
          navigate('/clientes')
        }}
        isLoading={isLoading}
      />
    </div>
  )
}
