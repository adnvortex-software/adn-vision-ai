import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Bus,
  Camera,
  AlertTriangle,
  Users,
  Pencil,
  Settings,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingState } from '@/components/common/LoadingState'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BusStatusIndicator } from '@/components/buses'
import type { BusConDetalles, Camara } from '@/types/bus'
import type { Entity } from '@/types/firestore'

// Mock data - replace with actual data fetching
const mockBus: BusConDetalles | null = null
const mockCamaras: Entity<Camara>[] = []

export default function BusDetailPage() {
  const { busId } = useParams<{ busId: string }>()
  const navigate = useNavigate()
  const [isLoading] = useState(false)

  if (isLoading) {
    return <LoadingState fullScreen />
  }

  if (!mockBus) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex flex-col items-center justify-center rounded-lg border py-12">
          <Bus className="h-12 w-12 text-muted-foreground/30" />
          <h3 className="mt-4 text-lg font-semibold">Bus no encontrado</h3>
          <p className="mt-1 text-sm text-muted-foreground">El bus con ID {busId} no existe</p>
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => {
              navigate('/buses')
            }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a buses
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto space-y-6 py-6">
      <PageHeader
        title={
          <div className="flex items-center gap-3">
            <span className="font-mono">{mockBus.placa}</span>
            <BusStatusIndicator estado={mockBus.estado} />
          </div>
        }
        description={mockBus.rutaTexto ?? 'Sin ruta asignada'}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                navigate('/buses')
              }}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                navigate(`/buses/${busId ?? ''}/camaras`)
              }}
            >
              <Camera className="mr-2 h-4 w-4" />
              Camaras
            </Button>
            <Button
              onClick={() => {
                navigate(`/buses/${busId ?? ''}/editar`)
              }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 md:grid-cols-3">
        {/* Info General */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bus className="h-5 w-5" />
              Informacion del Vehiculo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Tipo de Vehiculo</p>
                <p className="font-medium capitalize">{mockBus.tipoVehiculo}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sucursal</p>
                <p className="font-medium">{mockBus.sucursalNombre ?? '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Propietario</p>
                <p className="font-medium">{mockBus.propietarioNombre ?? 'No asignado'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Conductor</p>
                <p className="font-medium">{mockBus.conductorNombre ?? 'Sin asignar'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conectividad */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {mockBus.estado === 'sin_conexion' ? (
                <WifiOff className="h-5 w-5 text-destructive" />
              ) : (
                <Wifi className="h-5 w-5 text-green-500" />
              )}
              Conectividad
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">IP ZeroTier</p>
              <p className="font-mono text-sm">{mockBus.ztIpRouter}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Subnet LAN</p>
              <p className="font-mono text-sm">{mockBus.subnetLan}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ultimo Heartbeat</p>
              <p className="text-sm">
                {mockBus.lastHeartbeat ? mockBus.lastHeartbeat.toDate().toLocaleString() : 'Nunca'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats del dia */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-green-100 p-3">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockBus.conteoDia?.entradas ?? 0}</p>
                <p className="text-sm text-muted-foreground">Entradas hoy</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-red-100 p-3">
                <Users className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockBus.conteoDia?.salidas ?? 0}</p>
                <p className="text-sm text-muted-foreground">Salidas hoy</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-amber-100 p-3">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockBus.novedadesHoy ?? 0}</p>
                <p className="text-sm text-muted-foreground">Novedades hoy</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Camaras */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Camaras Configuradas
            </CardTitle>
            <CardDescription>
              {mockCamaras.length} de {mockBus.numCamarasConfiguradas} camaras
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigate(`/buses/${busId ?? ''}/camaras`)
            }}
          >
            <Settings className="mr-2 h-4 w-4" />
            Configurar
          </Button>
        </CardHeader>
        <CardContent>
          {mockCamaras.length === 0 ? (
            <div className="py-8 text-center">
              <Camera className="mx-auto h-8 w-8 text-muted-foreground/30" />
              <p className="mt-2 text-sm text-muted-foreground">No hay camaras configuradas</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {mockCamaras.map((camara) => (
                <div key={camara.id} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{camara.nombre}</span>
                    <Badge variant={camara.habilitada ? 'default' : 'secondary'}>
                      {camara.habilitada ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm capitalize text-muted-foreground">{camara.perfil}</p>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    Canal {camara.canal}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
