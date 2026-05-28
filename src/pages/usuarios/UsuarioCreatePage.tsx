import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingState } from '@/components/common/LoadingState'
import { Button } from '@/components/ui/button'
import { UsuarioForm } from '@/components/usuarios'
import { useToast } from '@/hooks/use-toast'
import { useAuthStore } from '@/stores/auth.store'
import { listClientes, listSucursales, listPropietarios } from '@/services/clientes.service'
import { createUsuarioInvitation } from '@/services/usuarios.service'
import type { CreateUsuarioFormData, UpdateUsuarioFormData } from '@/schemas/auth.schema'
import type { Cliente, Sucursal, Propietario } from '@/types/cliente'
import type { Entity } from '@/types/firestore'

export default function UsuarioCreatePage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { usuario: currentUser } = useAuthStore()

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [clientes, setClientes] = useState<Entity<Cliente>[]>([])
  const [sucursales, setSucursales] = useState<Entity<Sucursal>[]>([])
  const [propietarios, setPropietarios] = useState<Entity<Propietario>[]>([])

  // Load clientes on mount
  useEffect(() => {
    const loadClientes = async () => {
      try {
        const result = await listClientes({ limit: 100 })
        setClientes(result.data)
      } catch (error) {
        console.error('Error loading clientes:', error)
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No se pudieron cargar los clientes',
        })
      } finally {
        setIsLoading(false)
      }
    }

    void loadClientes()
  }, [toast])

  // Load sucursales when a client is selected (handled by form watching)
  const loadSucursalesForClient = async (clienteId: string) => {
    if (!clienteId) {
      setSucursales([])
      setPropietarios([])
      return
    }

    try {
      const sucursalesData = await listSucursales(clienteId)
      setSucursales(sucursalesData)
    } catch (error) {
      console.error('Error loading sucursales:', error)
    }
  }

  // Load propietarios when sucursales are selected
  const loadPropietariosForSucursales = async (clienteId: string, sucursalIds: string[]) => {
    if (!clienteId || sucursalIds.length === 0) {
      setPropietarios([])
      return
    }

    try {
      // Load propietarios for all selected sucursales
      const propietariosPromises = sucursalIds.map((sucursalId) =>
        listPropietarios(clienteId, sucursalId)
      )
      const propietariosArrays = await Promise.all(propietariosPromises)
      const allPropietarios = propietariosArrays.flat()

      // Remove duplicates by id
      const uniquePropietarios = allPropietarios.filter(
        (prop, index, self) => index === self.findIndex((p) => p.id === prop.id)
      )

      setPropietarios(uniquePropietarios)
    } catch (error) {
      console.error('Error loading propietarios:', error)
    }
  }

  const handleSubmit = async (data: CreateUsuarioFormData | UpdateUsuarioFormData) => {
    // For create, we need all required fields
    if (!('email' in data) || !data.email) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Email es requerido para crear un usuario',
      })
      return
    }
    // After the check above, we know data has email, nombre, and rol
    const createData = data
    if (!currentUser) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Debes estar autenticado para crear usuarios',
      })
      return
    }

    setIsSubmitting(true)
    try {
      await createUsuarioInvitation(
        {
          email: createData.email,
          nombre: createData.nombre,
          rol: createData.rol,
          clienteId: createData.clienteId ?? undefined,
          sucursalIds: createData.sucursalIds ?? undefined,
          propietarioId: createData.propietarioId ?? undefined,
        },
        currentUser.uid
      )

      toast({
        title: 'Invitacion enviada',
        description: `Se ha enviado una invitacion a ${createData.email}`,
      })

      navigate('/usuarios')
    } catch (error) {
      console.error('Error creating usuario:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo crear el usuario',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Watch for client changes to load sucursales
  useEffect(() => {
    // This effect will be triggered by the form's onChange
    // For now, we expose the load functions to be called by the form
  }, [])

  if (isLoading) {
    return <LoadingState fullScreen message="Cargando datos..." />
  }

  return (
    <div className="container mx-auto max-w-3xl space-y-6 py-6">
      <PageHeader
        title="Nuevo Usuario"
        description="Invita a un nuevo usuario al sistema"
        actions={
          <Button
            variant="outline"
            onClick={() => {
              navigate('/usuarios')
            }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        }
      />

      <UsuarioForm
        clientes={clientes}
        sucursales={sucursales}
        propietarios={propietarios}
        onSubmit={handleSubmit}
        onCancel={() => {
          navigate('/usuarios')
        }}
        isLoading={isSubmitting}
        onClienteChange={loadSucursalesForClient}
        onSucursalesChange={(clienteId, sucursalIds) => {
          void loadPropietariosForSucursales(clienteId, sucursalIds)
        }}
      />
    </div>
  )
}
