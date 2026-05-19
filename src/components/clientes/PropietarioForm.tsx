import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, User } from 'lucide-react'
import { createPropietarioSchema, type CreatePropietarioFormData } from '@/schemas/cliente.schema'
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
import type { Propietario, Sucursal } from '@/types/cliente'
import type { Entity } from '@/types/firestore'

interface PropietarioFormProps {
  propietario?: Entity<Propietario>
  sucursales: Entity<Sucursal>[]
  clienteNombre?: string
  onSubmit: (data: CreatePropietarioFormData) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
}

export function PropietarioForm({
  propietario,
  sucursales,
  clienteNombre,
  onSubmit,
  onCancel,
  isLoading = false,
}: PropietarioFormProps) {
  const form = useForm<CreatePropietarioFormData>({
    resolver: zodResolver(createPropietarioSchema),
    defaultValues: {
      nombre: propietario?.nombre ?? '',
      documento: propietario?.documento ?? '',
      sucursalId: propietario?.sucursalId ?? '',
      contactoEmail: propietario?.contactoEmail ?? null,
      contactoTelefono: propietario?.contactoTelefono ?? null,
    },
  })

  const handleSubmit = async (data: CreatePropietarioFormData) => {
    // Normalize empty strings to null
    const emailTrimmed = data.contactoEmail?.trim()
    const telefonoTrimmed = data.contactoTelefono?.trim()
    const normalizedData: CreatePropietarioFormData = {
      ...data,
      contactoEmail: emailTrimmed && emailTrimmed.length > 0 ? emailTrimmed : null,
      contactoTelefono: telefonoTrimmed && telefonoTrimmed.length > 0 ? telefonoTrimmed : null,
    }
    await onSubmit(normalizedData)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <User className="h-5 w-5" />
          <CardTitle>{propietario ? 'Editar Propietario' : 'Nuevo Propietario'}</CardTitle>
        </div>
        <CardDescription>
          {clienteNombre
            ? `Propietario de buses para ${clienteNombre}`
            : propietario
              ? 'Modifica los datos del propietario'
              : 'Ingresa los datos del propietario o afiliador de buses'}
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
                name="documento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Documento de Identidad</FormLabel>
                    <FormControl>
                      <Input placeholder="1.234.567.890" disabled={isLoading} {...field} />
                    </FormControl>
                    <FormDescription>Cedula o NIT</FormDescription>
                    <FormMessage />
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
                      onValueChange={field.onChange}
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
                    <FormDescription>Sucursal a la que pertenece</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactoEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email (Opcional)</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="propietario@email.com"
                        disabled={isLoading}
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactoTelefono"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefono (Opcional)</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="310 123 4567"
                        disabled={isLoading}
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                ) : propietario ? (
                  'Guardar Cambios'
                ) : (
                  'Crear Propietario'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
