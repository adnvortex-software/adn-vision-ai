import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { BusWizard } from '@/components/buses'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { BusWizardData } from '@/types/bus'
import type { Cliente, Sucursal, Propietario } from '@/types/cliente'
import type { Entity } from '@/types/firestore'
import { useToast } from '@/hooks/use-toast'
import { listClientes, listSucursales, listPropietarios } from '@/services/clientes.service'
import { createBus } from '@/services/buses.service'

export default function BusNuevoPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)

  // Data from Firebase
  const [clientes, setClientes] = useState<Entity<Cliente>[]>([])
  const [sucursales, setSucursales] = useState<Entity<Sucursal>[]>([])
  const [propietarios, setPropietarios] = useState<Entity<Propietario>[]>([])
  const [selectedClienteId, setSelectedClienteId] = useState<string>('')

  // Load clientes on mount
  useEffect(() => {
    async function loadClientes() {
      try {
        const result = await listClientes({ limit: 100 })
        setClientes(result.data)

        // Auto-select first cliente if only one
        if (result.data.length === 1 && result.data[0]) {
          setSelectedClienteId(result.data[0].id)
        }
      } catch (error) {
        console.error('Error loading clientes:', error)
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los clientes',
          variant: 'destructive',
        })
      } finally {
        setIsLoadingData(false)
      }
    }
    void loadClientes()
  }, [toast])

  // Load sucursales and propietarios when cliente changes
  useEffect(() => {
    async function loadClienteData() {
      if (!selectedClienteId) {
        setSucursales([])
        setPropietarios([])
        return
      }

      try {
        const [sucursalesData, propietariosData] = await Promise.all([
          listSucursales(selectedClienteId),
          listPropietarios(selectedClienteId),
        ])
        setSucursales(sucursalesData)
        setPropietarios(propietariosData)
      } catch (error) {
        console.error('Error loading cliente data:', error)
      }
    }
    void loadClienteData()
  }, [selectedClienteId])

  const handleComplete = async (data: BusWizardData) => {
    setIsLoading(true)
    try {
      const busId = await createBus(
        {
          placa: data.placa,
          clienteId: data.clienteId,
          sucursalId: data.sucursalId,
          propietarioId: data.propietarioId ?? null,
          tipoVehiculo: data.tipoVehiculo,
          rutaTexto: data.rutaTexto ?? null,
          conductorAsignadoId: data.conductorAsignadoId ?? null,
          ztIpRouter: data.ztIpRouter,
          subnetLan: data.subnetLan,
        },
        'system' // createdBy - TODO: use actual user
      )

      toast({
        title: 'Bus creado',
        description: `${data.placa} ha sido registrado exitosamente (ID: ${busId})`,
      })

      navigate('/buses')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo crear el bus'
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingData) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-3xl space-y-6 py-6">
      <PageHeader
        title="Nuevo Bus"
        description="Configura un nuevo vehiculo con el asistente"
        actions={
          <Button
            variant="outline"
            onClick={() => {
              navigate('/buses')
            }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
        }
      />

      {/* Cliente selector */}
      {clientes.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Seleccionar Cliente</CardTitle>
            <CardDescription>Elige el cliente al que pertenecera este vehiculo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select value={selectedClienteId} onValueChange={setSelectedClienteId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {clientes.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No hay clientes registrados. Crea un cliente primero.
            </p>
            <div className="mt-4 flex justify-center">
              <Button
                onClick={() => {
                  navigate('/clientes/nuevo')
                }}
              >
                Crear Cliente
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedClienteId && (
        <BusWizard
          clienteId={selectedClienteId}
          sucursales={sucursales}
          propietarios={propietarios}
          onComplete={handleComplete}
          onCancel={() => {
            navigate('/buses')
          }}
          isLoading={isLoading}
        />
      )}
    </div>
  )
}
