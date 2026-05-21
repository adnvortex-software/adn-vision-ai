import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { ClienteForm } from '@/components/clientes'
import type { CreateClienteFormData } from '@/schemas/cliente.schema'
import { useToast } from '@/hooks/use-toast'
import { createCliente } from '@/services/clientes.service'

export default function ClienteNuevoPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (data: CreateClienteFormData) => {
    setIsLoading(true)
    try {
      const clienteId = await createCliente(data, 'system')

      toast({
        title: 'Cliente creado',
        description: `${data.nombre} ha sido registrado exitosamente (ID: ${clienteId})`,
      })

      navigate('/clientes')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo crear el cliente'
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto max-w-2xl space-y-6 py-6">
      <PageHeader
        title="Nuevo Cliente"
        description="Registra un nuevo cliente en la plataforma"
        actions={
          <Button
            variant="outline"
            onClick={() => {
              navigate('/clientes')
            }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
        }
      />

      <ClienteForm
        onSubmit={handleSubmit}
        onCancel={() => {
          navigate('/clientes')
        }}
        isLoading={isLoading}
      />
    </div>
  )
}
