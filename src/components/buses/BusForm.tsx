import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Bus as BusIcon, Network } from 'lucide-react'
import { createBusSchema, type CreateBusFormData } from '@/schemas/bus.schema'
import { VEHICLE_TYPES } from '@/config/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { Bus } from '@/types/bus'
import type { Entity } from '@/types/firestore'

interface BusFormProps {
  bus?: Entity<Bus>
  clienteId: string
  onSubmit: (data: CreateBusFormData) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
}

const VEHICLE_TYPE_LABELS: Record<string, string> = {
  bus: 'Bus',
  buseta: 'Buseta',
  van: 'Van',
  microbus: 'Microbus',
  otro: 'Otro',
}

export function BusForm({ bus, clienteId, onSubmit, onCancel, isLoading = false }: BusFormProps) {
  const form = useForm<CreateBusFormData>({
    resolver: zodResolver(createBusSchema),
    defaultValues: {
      placa: bus?.placa ?? '',
      clienteId: bus?.clienteId ?? clienteId,
      deviceId: bus?.deviceId ?? '',
      tipoVehiculo: bus?.tipoVehiculo ?? 'bus',
      conductorAsignadoId: bus?.conductorAsignadoId,
      ztIpRouter: bus?.ztIpRouter ?? '',
      subnetLan: bus?.subnetLan ?? '',
    },
  })

  const handleSubmit = async (data: CreateBusFormData) => {
    await onSubmit(data)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <BusIcon className="h-5 w-5" />
          <CardTitle>{bus ? 'Editar Bus' : 'Nuevo Bus'}</CardTitle>
        </div>
        <CardDescription>
          {bus ? 'Modifica los datos del vehiculo' : 'Ingresa los datos del nuevo vehiculo'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Datos del vehiculo */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Datos del vehiculo</h3>
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
                          disabled={isLoading}
                          className="uppercase"
                          maxLength={6}
                          {...field}
                          onChange={(e) => {
                            field.onChange(e.target.value.toUpperCase())
                          }}
                        />
                      </FormControl>
                      <FormDescription>Formato colombiano (ej: ABC123)</FormDescription>
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
                        defaultValue={field.value}
                        disabled={isLoading}
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
                    <FormItem className="md:col-span-2">
                      <FormLabel>Device ID</FormLabel>
                      <FormControl>
                        <Input placeholder="ID del dispositivo" disabled={isLoading} {...field} />
                      </FormControl>
                      <FormDescription>
                        Identificador unico del dispositivo DVR (ZeroTier)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Conectividad */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Network className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium text-muted-foreground">Conectividad</h3>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="ztIpRouter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IP ZeroTier del Router</FormLabel>
                      <FormControl>
                        <Input placeholder="10.147.20.100" disabled={isLoading} {...field} />
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
                        <Input placeholder="192.168.1.0/24" disabled={isLoading} {...field} />
                      </FormControl>
                      <FormDescription>Red local del DVR</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                  Cancelar
                </Button>
              )}
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : bus ? (
                  'Guardar Cambios'
                ) : (
                  'Crear Bus'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
