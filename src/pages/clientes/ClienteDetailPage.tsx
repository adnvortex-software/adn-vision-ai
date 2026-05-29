import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  Building2,
  MapPin,
  Users,
  Bus,
  Pencil,
  MoreHorizontal,
  Image,
} from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingState } from '@/components/common/LoadingState'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Cliente, Sucursal, Propietario } from '@/types/cliente'
import type { Entity } from '@/types/firestore'
import { getCliente, listSucursales, listPropietarios } from '@/services/clientes.service'
import { useToast } from '@/hooks/use-toast'

export default function ClienteDetailPage() {
  const { t } = useTranslation()
  const { clienteId } = useParams<{ clienteId: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [cliente, setCliente] = useState<Entity<Cliente> | null>(null)
  const [sucursales, setSucursales] = useState<Entity<Sucursal>[]>([])
  const [propietarios, setPropietarios] = useState<Entity<Propietario>[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadCliente() {
      if (!clienteId) return

      try {
        const [clienteData, sucursalesData, propietariosData] = await Promise.all([
          getCliente(clienteId),
          listSucursales(clienteId),
          listPropietarios(clienteId),
        ])
        setCliente(clienteData)
        setSucursales(sucursalesData)
        setPropietarios(propietariosData)
      } catch (error) {
        console.error('Error loading cliente:', error)
        toast({
          title: t('common.error'),
          description: t('clientes.loadError'),
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }
    void loadCliente()
  }, [clienteId, toast])

  if (isLoading) {
    return <LoadingState fullScreen />
  }

  if (!cliente) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex flex-col items-center justify-center rounded-lg border py-12">
          <Building2 className="h-12 w-12 text-muted-foreground/30" />
          <h3 className="mt-4 text-lg font-semibold">{t('clientes.notFound')}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('clientes.notFoundDescription', { id: clienteId })}
          </p>
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => {
              navigate('/clientes')
            }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('clientes.backToClientes')}
          </Button>
        </div>
      </div>
    )
  }

  const planColors = {
    basico: 'bg-gray-100 text-gray-700',
    profesional: 'bg-blue-100 text-blue-700',
    premium: 'bg-purple-100 text-purple-700',
  }

  return (
    <div className="container mx-auto space-y-6 py-6">
      <PageHeader
        title={cliente.nombre}
        description={`NIT: ${cliente.nit}`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                navigate('/clientes')
              }}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('common.back')}
            </Button>
            <Button
              onClick={() => {
                navigate(`/clientes/${clienteId ?? ''}/editar`)
              }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              {t('common.edit')}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    navigate(`/clientes/${clienteId ?? ''}/sucursales`)
                  }}
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  {t('clientes.manageSucursales')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    navigate(`/clientes/${clienteId ?? ''}/propietarios`)
                  }}
                >
                  <Users className="mr-2 h-4 w-4" />
                  {t('clientes.managePropietarios')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />

      <div className="grid gap-6 md:grid-cols-3">
        {/* Info Principal */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {t('clientes.generalInfo')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                {cliente.logoUrl ? (
                  <img
                    src={cliente.logoUrl}
                    alt={t('clientes.logoAlt', { name: cliente.nombre })}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <Image className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('clientes.companyLogo')}</p>
                {!cliente.logoUrl && (
                  <p className="text-xs text-muted-foreground">{t('clientes.addLogoHint')}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">{t('clientes.currentPlan')}</p>
                <Badge className={planColors[cliente.planContratado]}>
                  {t(`clientes.plans.${cliente.planContratado}`)}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('clientes.status')}</p>
                <Badge variant={cliente.activo ? 'default' : 'secondary'}>
                  {cliente.activo ? t('common.active') : t('common.inactive')}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('clientes.contact')}</p>
                <p className="font-medium">{cliente.contactoEmail}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('clientes.phone')}</p>
                <p className="font-medium">{cliente.contactoTelefono}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <Card>
          <CardHeader>
            <CardTitle>{t('clientes.statistics')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{t('clientes.sucursales')}</span>
              </div>
              <span className="font-bold">{sucursales.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{t('clientes.propietarios')}</span>
              </div>
              <span className="font-bold">{propietarios.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bus className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{t('buses.title')}</span>
              </div>
              <span className="font-bold">0</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sucursales */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {t('clientes.sucursales')}
            </CardTitle>
            <CardDescription>
              {t('clientes.sucursalesCount', { count: sucursales.length })}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigate(`/clientes/${clienteId ?? ''}/sucursales`)
            }}
          >
            {t('common.manage')}
          </Button>
        </CardHeader>
        <CardContent>
          {sucursales.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">
              {t('clientes.noSucursales')}
            </p>
          ) : (
            <div className="space-y-2">
              {sucursales.map((sucursal) => (
                <div
                  key={sucursal.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{sucursal.nombre}</p>
                    <p className="text-sm text-muted-foreground">{sucursal.ciudad}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Propietarios */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t('clientes.propietarios')}
            </CardTitle>
            <CardDescription>
              {t('clientes.propietariosCount', { count: propietarios.length })}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigate(`/clientes/${clienteId ?? ''}/propietarios`)
            }}
          >
            {t('common.manage')}
          </Button>
        </CardHeader>
        <CardContent>
          {propietarios.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">
              {t('clientes.noPropietarios')}
            </p>
          ) : (
            <div className="space-y-2">
              {propietarios.map((propietario) => (
                <div
                  key={propietario.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{propietario.nombre}</p>
                    <p className="text-sm text-muted-foreground">
                      {propietario.contactoEmail ?? '-'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
