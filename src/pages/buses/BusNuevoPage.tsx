import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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
import type { Cliente } from '@/types/cliente'
import type { Entity } from '@/types/firestore'
import { useToast } from '@/hooks/use-toast'
import { listClientes } from '@/services/clientes.service'
import { createBus, updateBus } from '@/services/buses.service'
import { createCamarasBatch } from '@/services/camaras.service'

export default function BusNuevoPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)

  // Data from Firebase
  const [clientes, setClientes] = useState<Entity<Cliente>[]>([])
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
          title: t('common.error'),
          description: t('clientes.loadError'),
          variant: 'destructive',
        })
      } finally {
        setIsLoadingData(false)
      }
    }
    void loadClientes()
  }, [toast])

  const handleComplete = async (data: BusWizardData) => {
    setIsLoading(true)
    try {
      const busId = await createBus(
        {
          placa: data.placa,
          clienteId: data.clienteId,
          deviceId: data.deviceId,
          ipVirtual: data.ipVirtual,
          numeroInterno: data.numeroInterno,
          tipoVehiculo: data.tipoVehiculo,
          conductorAsignadoId: data.conductorAsignadoId ?? null,
          ztIpRouter: data.ztIpRouter,
          subnetLan: data.subnetLan,
          dvrIp: data.dvrIp,
          dvrUsuario: data.dvrUsuario,
          dvrPassword: data.dvrPassword,
        },
        'system' // createdBy - TODO: use actual user
      )

      // Create cameras if any were configured
      if (data.camaras.length > 0) {
        try {
          await createCamarasBatch(busId, data.camaras, 'system')

          // Update bus with camera names
          const camarasNombres = data.camaras.map((c) => c.nombre)
          await updateBus(busId, { camarasNombres })
        } catch (camaraError) {
          console.error('Error creating cameras:', camaraError)
        }
      }

      toast({
        title: t('buses.createSuccess'),
        description: t('buses.createSuccessDesc', {
          placa: data.placa,
          count: data.camaras.length,
        }),
      })

      navigate('/buses')
    } catch (error) {
      console.error('Error in handleComplete:', error)
      const message = error instanceof Error ? error.message : t('buses.createError')
      toast({
        title: t('common.error'),
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
        title={t('buses.nuevo')}
        description={t('buses.wizardDescription')}
        actions={
          <Button
            variant="outline"
            onClick={() => {
              navigate('/buses')
            }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('common.cancel')}
          </Button>
        }
      />

      {/* Cliente selector */}
      {clientes.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('buses.selectClient')}</CardTitle>
            <CardDescription>{t('buses.selectClientDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>{t('buses.cliente')}</Label>
              <Select value={selectedClienteId} onValueChange={setSelectedClienteId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('buses.selectClientPlaceholder')} />
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
            <p className="text-center text-muted-foreground">{t('buses.noClients')}</p>
            <div className="mt-4 flex justify-center">
              <Button
                onClick={() => {
                  navigate('/clientes/nuevo')
                }}
              >
                {t('clientes.nuevo')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedClienteId && (
        <BusWizard
          clienteId={selectedClienteId}
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
