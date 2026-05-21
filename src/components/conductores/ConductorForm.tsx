import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, User, Calendar, AlertTriangle } from 'lucide-react'
import { format, addDays, isBefore, differenceInDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { createConductorSchema, type CreateConductorFormData } from '@/schemas/conductor.schema'
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
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { Conductor } from '@/types/conductor'
import type { Sucursal, Propietario } from '@/types/cliente'
import type { Entity } from '@/types/firestore'
import type { Timestamp } from 'firebase/firestore'

interface ConductorFormProps {
  conductor?: Entity<Conductor>
  sucursales: Entity<Sucursal>[]
  propietarios: Entity<Propietario>[]
  clienteId: string
  onSubmit: (data: CreateConductorFormData) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
}

function timestampToDate(timestamp: Timestamp | null | undefined): Date | undefined {
  if (!timestamp) return undefined
  try {
    return timestamp.toDate()
  } catch {
    return undefined
  }
}

export function ConductorForm({
  conductor,
  sucursales,
  propietarios,
  clienteId: _clienteId,
  onSubmit,
  onCancel,
  isLoading = false,
}: ConductorFormProps) {
  const existingDate = conductor ? timestampToDate(conductor.fechaVencimientoLicencia) : undefined

  const form = useForm<CreateConductorFormData>({
    resolver: zodResolver(createConductorSchema),
    defaultValues: {
      nombre: conductor?.nombre ?? '',
      cedula: conductor?.cedula ?? '',
      licencia: conductor?.licencia ?? '',
      fechaVencimientoLicencia: existingDate ?? addDays(new Date(), 365),
      sucursalId: conductor?.sucursalId ?? '',
      propietarioId: conductor?.propietarioId,
    },
  })

  const selectedSucursalId = form.watch('sucursalId')
  const selectedDate = form.watch('fechaVencimientoLicencia')
  const filteredPropietarios = propietarios.filter(
    (p) => !selectedSucursalId || p.sucursalId === selectedSucursalId
  )

  // Check license expiration
  const isExpired = isBefore(selectedDate, new Date())
  const daysUntilExpiration = differenceInDays(selectedDate, new Date())
  const isExpiringSoon = daysUntilExpiration > 0 && daysUntilExpiration <= 30

  const handleSubmit = async (data: CreateConductorFormData) => {
    await onSubmit(data)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <User className="h-5 w-5" />
          <CardTitle>{conductor ? 'Editar Conductor' : 'Nuevo Conductor'}</CardTitle>
        </div>
        <CardDescription>
          {conductor ? 'Modifica los datos del conductor' : 'Registra un nuevo conductor'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Nombre Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Juan Perez Rodriguez" disabled={isLoading} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cedula"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cedula</FormLabel>
                    <FormControl>
                      <Input placeholder="1.234.567.890" disabled={isLoading} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="licencia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Numero de Licencia</FormLabel>
                    <FormControl>
                      <Input placeholder="12345678" disabled={isLoading} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Controller
                control={form.control}
                name="fechaVencimientoLicencia"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Vencimiento de Licencia
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        disabled={isLoading}
                        value={format(field.value, 'yyyy-MM-dd')}
                        onChange={(e) => {
                          const date = e.target.value ? new Date(e.target.value) : undefined
                          field.onChange(date)
                        }}
                      />
                    </FormControl>
                    {fieldState.error && (
                      <p className="text-sm text-destructive">{fieldState.error.message}</p>
                    )}
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sucursalId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sucursal</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value)
                        form.setValue('propietarioId', null)
                      }}
                      defaultValue={field.value}
                      disabled={isLoading || sucursales.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              sucursales.length === 0 ? 'No hay sucursales' : 'Seleccionar sucursal'
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sucursales.map((sucursal) => (
                          <SelectItem key={sucursal.id} value={sucursal.id}>
                            {sucursal.nombre} - {sucursal.ciudad}
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
                name="propietarioId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Propietario (Opcional)</FormLabel>
                    <Select
                      onValueChange={(v) => {
                        field.onChange(v === '_none_' ? null : v)
                      }}
                      value={field.value ?? '_none_'}
                      disabled={isLoading || filteredPropietarios.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar propietario" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="_none_">Sin propietario</SelectItem>
                        {filteredPropietarios.map((propietario) => (
                          <SelectItem key={propietario.id} value={propietario.id}>
                            {propietario.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Propietario al que pertenece el conductor</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* License expiration warning */}
            {(isExpired || isExpiringSoon) && (
              <Alert variant={isExpired ? 'destructive' : 'default'}>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {isExpired
                    ? 'La licencia esta vencida. El conductor no puede operar legalmente.'
                    : `La licencia vence en ${String(daysUntilExpiration)} dias (${format(selectedDate, "d 'de' MMMM 'de' yyyy", { locale: es })}).`}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-3">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                  Cancelar
                </Button>
              )}
              <Button type="submit" disabled={isLoading || sucursales.length === 0}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : conductor ? (
                  'Guardar Cambios'
                ) : (
                  'Crear Conductor'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
