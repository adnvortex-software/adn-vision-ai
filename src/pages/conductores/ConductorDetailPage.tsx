import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, User, Calendar, Bus, Pencil, AlertTriangle, CheckCircle } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingState } from '@/components/common/LoadingState'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { ConductorConDetalles } from '@/types/conductor'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

// Mock data - replace with actual data fetching
const mockConductor: ConductorConDetalles | null = null

export default function ConductorDetailPage() {
  const { conductorId } = useParams<{ conductorId: string }>()
  const navigate = useNavigate()
  const [isLoading] = useState(false)

  if (isLoading) {
    return <LoadingState fullScreen />
  }

  if (!mockConductor) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex flex-col items-center justify-center rounded-lg border py-12">
          <User className="h-12 w-12 text-muted-foreground/30" />
          <h3 className="mt-4 text-lg font-semibold">Conductor no encontrado</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            El conductor con ID {conductorId} no existe
          </p>
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => {
              navigate('/conductores')
            }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a conductores
          </Button>
        </div>
      </div>
    )
  }

  const getLicenciaStatus = () => {
    if (mockConductor.licenciaVencida) {
      return { color: 'bg-red-100 text-red-700', label: 'Vencida', icon: AlertTriangle }
    }
    if (mockConductor.diasParaVencimiento <= 30) {
      return {
        color: 'bg-amber-100 text-amber-700',
        label: `Vence en ${String(mockConductor.diasParaVencimiento)} dias`,
        icon: AlertTriangle,
      }
    }
    return { color: 'bg-green-100 text-green-700', label: 'Vigente', icon: CheckCircle }
  }

  const licenciaStatus = getLicenciaStatus()
  const LicenciaIcon = licenciaStatus.icon

  return (
    <div className="container mx-auto space-y-6 py-6">
      <PageHeader
        title={mockConductor.nombre}
        description={`CC: ${mockConductor.cedula}`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                navigate('/conductores')
              }}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
            <Button
              onClick={() => {
                navigate(`/conductores/${conductorId ?? ''}/editar`)
              }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Informacion Personal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informacion Personal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                {mockConductor.foto ? (
                  <img
                    src={mockConductor.foto}
                    alt={mockConductor.nombre}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <User className="h-8 w-8 text-primary" />
                )}
              </div>
              <div>
                <p className="font-semibold">{mockConductor.nombre}</p>
                <p className="text-sm text-muted-foreground">CC: {mockConductor.cedula}</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Sucursal</p>
                <p className="font-medium">{mockConductor.sucursalNombre ?? '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estado</p>
                <Badge variant={mockConductor.activo ? 'default' : 'secondary'}>
                  {mockConductor.activo ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Licencia */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Licencia de Conduccion
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Numero</p>
                <p className="font-mono font-medium">{mockConductor.licencia}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estado</p>
                <Badge className={licenciaStatus.color}>
                  <LicenciaIcon className="mr-1 h-3 w-3" />
                  {licenciaStatus.label}
                </Badge>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fecha de Vencimiento</p>
              <p className="font-medium">
                {format(mockConductor.fechaVencimientoLicencia.toDate(), "d 'de' MMMM 'de' yyyy", {
                  locale: es,
                })}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Bus Asignado */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bus className="h-5 w-5" />
              Bus Asignado
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mockConductor.busAsignado ? (
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-primary/10 p-3">
                    <Bus className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-mono font-semibold">{mockConductor.busAsignado.placa}</p>
                    <p className="text-sm text-muted-foreground">Bus asignado</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    navigate(`/buses/${mockConductor.busAsignado.id}`)
                  }}
                >
                  Ver Bus
                </Button>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <Bus className="mx-auto h-8 w-8 text-muted-foreground/30" />
                <p className="mt-2 text-sm text-muted-foreground">Sin bus asignado</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
