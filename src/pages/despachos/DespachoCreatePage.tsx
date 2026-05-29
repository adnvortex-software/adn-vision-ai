import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarIcon, Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Calendar } from '@/components/ui/calendar'
import {
  Form,
  FormControl,
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createDespachoSchema, type CreateDespachoFormData } from '@/schemas/despacho.schema'
import { createDespacho } from '@/services/despachos.service'
import { useAuthStore } from '@/stores/auth.store'
import { useDataStore } from '@/stores/data.store'
import { useToast } from '@/hooks/use-toast'

export default function DespachoCreatePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { usuario } = useAuthStore()
  const { clientes, buses } = useDataStore()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isInternal =
    usuario?.rol === 'super_admin' || usuario?.rol === 'ops_admin' || usuario?.rol === 'analyst'
  const defaultClienteId = !isInternal && usuario?.clienteId ? usuario.clienteId : ''

  const form = useForm<CreateDespachoFormData>({
    resolver: zodResolver(createDespachoSchema),
    defaultValues: {
      fechaHora: new Date(),
      busId: '',
      conductor: '',
      ruta: '',
      clienteId: defaultClienteId,
    },
  })

  const selectedClienteId = form.watch('clienteId')

  // Filter buses by selected client
  const filteredBuses = selectedClienteId
    ? buses.filter((b) => b.clienteId === selectedClienteId)
    : buses

  const onSubmit = async (data: CreateDespachoFormData) => {
    if (!usuario) return

    const bus = buses.find((b) => b.id === data.busId)
    const cliente = clientes.find((c) => c.id === data.clienteId)

    if (!bus || !cliente) {
      toast({
        title: t('common.error'),
        description: t('despachos.vehiculoClienteNoEncontrado'),
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    try {
      await createDespacho(
        {
          fechaHora: data.fechaHora,
          busId: data.busId,
          placa: bus.placa,
          tipoVehiculo: bus.tipoVehiculo,
          numeroInterno: bus.numeroInterno,
          conductor: data.conductor,
          ruta: data.ruta,
          clienteId: data.clienteId,
          clienteNombre: cliente.nombre,
        },
        { id: usuario.uid, nombre: usuario.nombre }
      )

      toast({
        title: t('despachos.despachoCreado'),
        description: t('despachos.despachoCreadoDesc'),
      })

      navigate('/despachos')
    } catch (error) {
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : t('despachos.errorCrear'),
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto space-y-6 py-6">
      <PageHeader title={t('despachos.nuevo')} description={t('despachos.nuevoDescription')} />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>{t('despachos.datosDespacho')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Cliente (only for internal users) */}
              {isInternal && (
                <FormField
                  control={form.control}
                  name="clienteId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('despachos.cliente')}</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value)
                          form.setValue('busId', '') // Reset bus when client changes
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('despachos.seleccionarCliente')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clientes.map((cliente) => (
                            <SelectItem key={cliente.id} value={cliente.id}>
                              {cliente.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Fecha y Hora */}
              <FormField
                control={form.control}
                name="fechaHora"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t('despachos.fechaHora')}</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant="outline" className="w-full pl-3 text-left font-normal">
                            {format(field.value, "PPP 'a las' HH:mm", { locale: es })}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            if (date) {
                              const current = field.value
                              date.setHours(current.getHours(), current.getMinutes())
                              field.onChange(date)
                            }
                          }}
                          autoFocus
                        />
                        <div className="border-t p-3">
                          <Input
                            type="time"
                            value={format(field.value, 'HH:mm')}
                            onChange={(e) => {
                              const parts = e.target.value.split(':')
                              const hours = Number(parts[0]) || 0
                              const minutes = Number(parts[1]) || 0
                              const newDate = new Date(field.value)
                              newDate.setHours(hours, minutes)
                              field.onChange(newDate)
                            }}
                          />
                        </div>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Vehiculo */}
              <FormField
                control={form.control}
                name="busId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('despachos.vehiculo')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('despachos.seleccionarVehiculo')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredBuses.map((bus) => (
                          <SelectItem key={bus.id} value={bus.id}>
                            {bus.placa} - {bus.tipoVehiculo}
                            {bus.numeroInterno ? ` (#${String(bus.numeroInterno)})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Conductor */}
              <FormField
                control={form.control}
                name="conductor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('despachos.conductor')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('despachos.nombreConductor')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Ruta */}
              <FormField
                control={form.control}
                name="ruta"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('despachos.ruta')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('despachos.descripcionRuta')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Actions */}
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    navigate('/despachos')
                  }}
                  disabled={isSubmitting}
                >
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('despachos.crearDespacho')}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
