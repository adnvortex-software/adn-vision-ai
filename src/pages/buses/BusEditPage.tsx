import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, Bus as BusIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getBus, updateBus } from '@/services/buses.service'
import { VEHICLE_TYPES } from '@/config/constants'
import { useToast } from '@/hooks/use-toast'

const VEHICLE_TYPE_LABELS: Record<string, string> = {
  bus: 'Bus',
  buseta: 'Buseta',
  van: 'Van',
  microbus: 'Microbus',
  otro: 'Otro',
}

// Schema for editing bus
const editBusSchema = z.object({
  placa: z
    .string()
    .min(6, 'Placa inválida')
    .max(6, 'Placa inválida')
    .transform((val) => val.toUpperCase().replace(/\s/g, '')),
  deviceId: z.string().min(1, 'Device ID es requerido'),
  ipVirtual: z.string().min(1, 'IP Virtual es requerida'),
  tipoVehiculo: z.enum(VEHICLE_TYPES),
  ztIpRouter: z
    .string()
    .min(7, 'IP inválida')
    .regex(
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
      'Formato de IP inválido'
    ),
  subnetLan: z
    .string()
    .min(9, 'Subnet inválida')
    .regex(
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/(?:[0-9]|[1-2][0-9]|3[0-2])$/,
      'Formato de subnet inválido (ej: 192.168.1.0/24)'
    ),
})

type EditBusFormData = z.infer<typeof editBusSchema>

export default function BusEditPage() {
  const { busId } = useParams<{ busId: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const form = useForm<EditBusFormData>({
    resolver: zodResolver(editBusSchema),
    defaultValues: {
      placa: '',
      deviceId: '',
      ipVirtual: '',
      tipoVehiculo: 'bus',
      ztIpRouter: '',
      subnetLan: '',
    },
  })

  useEffect(() => {
    async function loadBus() {
      if (!busId) return

      try {
        const bus = await getBus(busId)
        if (bus) {
          form.reset({
            placa: bus.placa,
            deviceId: bus.deviceId ?? '',
            ipVirtual: bus.ipVirtual ?? '',
            tipoVehiculo: bus.tipoVehiculo,
            ztIpRouter: bus.ztIpRouter,
            subnetLan: bus.subnetLan,
          })
        } else {
          toast({
            title: 'Error',
            description: 'Bus no encontrado',
            variant: 'destructive',
          })
          navigate('/buses')
        }
      } catch (error) {
        console.error('Error loading bus:', error)
        toast({
          title: 'Error',
          description: 'No se pudo cargar el bus',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }

    void loadBus()
  }, [busId, form, navigate, toast])

  const handleSubmit = async (data: EditBusFormData) => {
    if (!busId) return

    setIsSaving(true)
    try {
      await updateBus(busId, {
        placa: data.placa,
        deviceId: data.deviceId,
        ipVirtual: data.ipVirtual,
        tipoVehiculo: data.tipoVehiculo,
        ztIpRouter: data.ztIpRouter,
        subnetLan: data.subnetLan,
      })

      toast({
        title: 'Bus actualizado',
        description: `${data.placa} ha sido actualizado exitosamente`,
      })

      navigate('/buses')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo actualizar el bus'
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-2xl space-y-6 py-6">
      <PageHeader
        title="Editar Bus"
        description="Modifica los datos del vehiculo"
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

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BusIcon className="h-5 w-5" />
            <CardTitle>Datos del Bus</CardTitle>
          </div>
          <CardDescription>Actualiza la información del vehículo</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="placa"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Placa</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="ABC123"
                          disabled={isSaving}
                          className="uppercase"
                          maxLength={6}
                          {...field}
                          onChange={(e) => {
                            field.onChange(e.target.value.toUpperCase())
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tipoVehiculo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de vehiculo</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isSaving}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {VEHICLE_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {VEHICLE_TYPE_LABELS[type] ?? type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deviceId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Device ID</FormLabel>
                      <FormControl>
                        <Input placeholder="ID del dispositivo" disabled={isSaving} {...field} />
                      </FormControl>
                      <FormDescription>
                        Identificador unico del dispositivo DVR (ZeroTier)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ipVirtual"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IP Virtual</FormLabel>
                      <FormControl>
                        <Input placeholder="10.0.0.100" disabled={isSaving} {...field} />
                      </FormControl>
                      <FormDescription>IP generada en OPNsense</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ztIpRouter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IP ZeroTier del Router</FormLabel>
                      <FormControl>
                        <Input placeholder="10.147.20.100" disabled={isSaving} {...field} />
                      </FormControl>
                      <FormDescription>IP asignada en la VPN ZeroTier</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subnetLan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subnet LAN</FormLabel>
                      <FormControl>
                        <Input placeholder="192.168.1.0/24" disabled={isSaving} {...field} />
                      </FormControl>
                      <FormDescription>Red local del DVR</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    navigate('/buses')
                  }}
                  disabled={isSaving}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    'Guardar Cambios'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
