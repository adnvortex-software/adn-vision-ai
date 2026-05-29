import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Copy, Check } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingState } from '@/components/common/LoadingState'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { UsuarioForm } from '@/components/usuarios'
import { useToast } from '@/hooks/use-toast'
import { useAuthStore } from '@/stores/auth.store'
import { listClientes, listSucursales, listPropietarios } from '@/services/clientes.service'
import { createUsuarioDirecto } from '@/services/usuarios.service'
import type { CreateUsuarioFormData, UpdateUsuarioFormData } from '@/schemas/auth.schema'
import type { Cliente, Sucursal, Propietario } from '@/types/cliente'
import type { Entity } from '@/types/firestore'

interface Credentials {
  email: string
  password: string
}

export default function UsuarioCreatePage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { toast } = useToast()
  const { usuario: currentUser } = useAuthStore()

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [clientes, setClientes] = useState<Entity<Cliente>[]>([])
  const [sucursales, setSucursales] = useState<Entity<Sucursal>[]>([])
  const [propietarios, setPropietarios] = useState<Entity<Propietario>[]>([])

  // Credentials modal
  const [credentials, setCredentials] = useState<Credentials | null>(null)
  const [copiedField, setCopiedField] = useState<'email' | 'password' | null>(null)

  // Load clientes on mount
  useEffect(() => {
    const loadClientes = async () => {
      try {
        const result = await listClientes({ limit: 100 })
        setClientes(result.data)
      } catch (err) {
        console.error('Error loading clientes:', err)
        toast({
          variant: 'destructive',
          title: t('common.error'),
          description: t('usuarios.loadClientesError'),
        })
      } finally {
        setIsLoading(false)
      }
    }

    void loadClientes()
  }, [toast])

  // Load sucursales when a client is selected
  const loadSucursalesForClient = async (clienteId: string) => {
    if (!clienteId) {
      setSucursales([])
      setPropietarios([])
      return
    }

    try {
      const sucursalesData = await listSucursales(clienteId)
      setSucursales(sucursalesData)
    } catch (err) {
      console.error('Error loading sucursales:', err)
    }
  }

  // Load propietarios when sucursales are selected
  const loadPropietariosForSucursales = async (clienteId: string, sucursalIds: string[]) => {
    if (!clienteId || sucursalIds.length === 0) {
      setPropietarios([])
      return
    }

    try {
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
    } catch (err) {
      console.error('Error loading propietarios:', err)
    }
  }

  const handleSubmit = async (data: CreateUsuarioFormData | UpdateUsuarioFormData) => {
    if (!('email' in data) || !data.email) {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: t('usuarios.emailRequired'),
      })
      return
    }

    if (!currentUser) {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: t('usuarios.authRequired'),
      })
      return
    }

    setIsSubmitting(true)
    try {
      const result = await createUsuarioDirecto(
        {
          email: data.email,
          nombre: data.nombre,
          rol: data.rol,
          clienteId: data.clienteId ?? undefined,
          sucursalIds: data.sucursalIds ?? undefined,
          propietarioId: data.propietarioId ?? undefined,
        },
        currentUser.uid
      )

      // Show credentials modal
      setCredentials({
        email: result.email,
        password: result.password,
      })

      toast({
        title: t('usuarios.created'),
        description: t('usuarios.createdDesc', { name: data.nombre }),
      })
    } catch (err) {
      console.error('Error creating usuario:', err)
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: err instanceof Error ? err.message : t('usuarios.createError'),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const copyToClipboard = async (text: string, field: 'email' | 'password') => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => {
        setCopiedField(null)
      }, 2000)
    } catch {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: t('usuarios.copyError'),
      })
    }
  }

  const handleCloseCredentials = () => {
    setCredentials(null)
    navigate('/usuarios')
  }

  if (isLoading) {
    return <LoadingState fullScreen message={t('common.loading')} />
  }

  return (
    <div className="container mx-auto max-w-3xl space-y-6 py-6">
      <PageHeader
        title={t('usuarios.nuevo')}
        description={t('usuarios.nuevoDesc')}
        actions={
          <Button
            variant="outline"
            onClick={() => {
              navigate('/usuarios')
            }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('common.back')}
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

      {/* Credentials Modal */}
      <Dialog
        open={!!credentials}
        onOpenChange={(open) => {
          if (!open) handleCloseCredentials()
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('usuarios.createdSuccess')}</DialogTitle>
            <DialogDescription>{t('usuarios.saveCredentials')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('usuarios.email')}</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-muted px-3 py-2 text-sm">
                  {credentials?.email}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => credentials && copyToClipboard(credentials.email, 'email')}
                >
                  {copiedField === 'email' ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('usuarios.temporaryPassword')}</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-muted px-3 py-2 font-mono text-sm">
                  {credentials?.password}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => credentials && copyToClipboard(credentials.password, 'password')}
                >
                  {copiedField === 'password' ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">{t('usuarios.mustChangePassword')}</p>
          </div>

          <DialogFooter>
            <Button onClick={handleCloseCredentials}>{t('usuarios.understood')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
