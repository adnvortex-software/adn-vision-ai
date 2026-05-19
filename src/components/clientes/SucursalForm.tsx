import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, MapPin } from 'lucide-react'
import { createSucursalSchema, type CreateSucursalFormData } from '@/schemas/cliente.schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { Sucursal } from '@/types/cliente'
import type { Entity } from '@/types/firestore'

interface SucursalFormProps {
  sucursal?: Entity<Sucursal>
  clienteNombre?: string
  onSubmit: (data: CreateSucursalFormData) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
}

// Ciudades principales de Colombia para sugerencias
const CIUDADES_COLOMBIA = [
  'Bogota',
  'Medellin',
  'Cali',
  'Barranquilla',
  'Cartagena',
  'Bucaramanga',
  'Pereira',
  'Manizales',
  'Santa Marta',
  'Cucuta',
  'Ibague',
  'Villavicencio',
  'Pasto',
  'Monteria',
  'Neiva',
]

export function SucursalForm({
  sucursal,
  clienteNombre,
  onSubmit,
  onCancel,
  isLoading = false,
}: SucursalFormProps) {
  const form = useForm<CreateSucursalFormData>({
    resolver: zodResolver(createSucursalSchema),
    defaultValues: {
      nombre: sucursal?.nombre ?? '',
      direccion: sucursal?.direccion ?? '',
      ciudad: sucursal?.ciudad ?? '',
    },
  })

  const handleSubmit = async (data: CreateSucursalFormData) => {
    await onSubmit(data)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          <CardTitle>{sucursal ? 'Editar Sucursal' : 'Nueva Sucursal'}</CardTitle>
        </div>
        <CardDescription>
          {clienteNombre
            ? `Sucursal para ${clienteNombre}`
            : sucursal
              ? 'Modifica los datos de la sucursal'
              : 'Ingresa los datos de la nueva sucursal'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de la Sucursal</FormLabel>
                  <FormControl>
                    <Input placeholder="Sucursal Norte" disabled={isLoading} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ciudad"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ciudad</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Bogota"
                      list="ciudades-list"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <datalist id="ciudades-list">
                    {CIUDADES_COLOMBIA.map((ciudad) => (
                      <option key={ciudad} value={ciudad} />
                    ))}
                  </datalist>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="direccion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Direccion</FormLabel>
                  <FormControl>
                    <Input placeholder="Carrera 15 #45-67" disabled={isLoading} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                ) : sucursal ? (
                  'Guardar Cambios'
                ) : (
                  'Crear Sucursal'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
