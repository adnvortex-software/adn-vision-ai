import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
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

export function BusForm({ bus, clienteId, onSubmit, onCancel, isLoading = false }: BusFormProps) {
  const { t } = useTranslation()
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
          <CardTitle>{bus ? t('buses.editBus') : t('buses.nuevo')}</CardTitle>
        </div>
        <CardDescription>
          {bus ? t('buses.editDescription') : t('buses.newDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Datos del vehiculo */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                {t('buses.vehicleData')}
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="placa"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('buses.placa')}</FormLabel>
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
                      <FormDescription>{t('buses.plateFormat')}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tipoVehiculo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('buses.tipo')}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('buses.selectType')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {VEHICLE_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {t(`buses.tipos.${type}`)}
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
                      <FormLabel>{t('buses.deviceId')}</FormLabel>
                      <FormControl>
                        <Input placeholder="ID" disabled={isLoading} {...field} />
                      </FormControl>
                      <FormDescription>{t('buses.deviceDescription')}</FormDescription>
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
                <h3 className="text-sm font-medium text-muted-foreground">
                  {t('buses.conectividad')}
                </h3>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="ztIpRouter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('buses.ipRouter')}</FormLabel>
                      <FormControl>
                        <Input placeholder="10.147.20.100" disabled={isLoading} {...field} />
                      </FormControl>
                      <FormDescription>{t('buses.ipDescription')}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subnetLan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('buses.subnetLan')}</FormLabel>
                      <FormControl>
                        <Input placeholder="192.168.1.0/24" disabled={isLoading} {...field} />
                      </FormControl>
                      <FormDescription>{t('buses.lanDescription')}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                  {t('common.cancel')}
                </Button>
              )}
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('common.saving')}
                  </>
                ) : bus ? (
                  t('common.saveChanges')
                ) : (
                  t('buses.createBus')
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
