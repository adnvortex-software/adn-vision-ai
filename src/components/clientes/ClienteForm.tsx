import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Building2 } from 'lucide-react'
import { createClienteSchema, type CreateClienteFormData } from '@/schemas/cliente.schema'
import { PLANS } from '@/config/constants'
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
import type { Cliente } from '@/types/cliente'
import type { Entity } from '@/types/firestore'

interface ClienteFormProps {
  cliente?: Entity<Cliente>
  onSubmit: (data: CreateClienteFormData) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
}

const PLAN_LABELS: Record<string, string> = {
  basico: 'Basico',
  profesional: 'Profesional',
  premium: 'Premium',
}

export function ClienteForm({ cliente, onSubmit, onCancel, isLoading = false }: ClienteFormProps) {
  const form = useForm<CreateClienteFormData>({
    resolver: zodResolver(createClienteSchema),
    defaultValues: {
      nombre: cliente?.nombre ?? '',
      nit: cliente?.nit ?? '',
      contactoEmail: cliente?.contactoEmail ?? '',
      contactoTelefono: cliente?.contactoTelefono ?? '',
      planContratado: cliente?.planContratado ?? 'basico',
    },
  })

  const handleSubmit = async (data: CreateClienteFormData) => {
    await onSubmit(data)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          <CardTitle>{cliente ? 'Editar Cliente' : 'Nuevo Cliente'}</CardTitle>
        </div>
        <CardDescription>
          {cliente
            ? 'Modifica los datos del cliente'
            : 'Ingresa los datos de la empresa de transporte'}
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
                    <FormLabel>Nombre de la Empresa</FormLabel>
                    <FormControl>
                      <Input placeholder="Transportes XYZ S.A.S." disabled={isLoading} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NIT</FormLabel>
                    <FormControl>
                      <Input placeholder="900.123.456-7" disabled={isLoading} {...field} />
                    </FormControl>
                    <FormDescription>Numero de identificacion tributaria</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="planContratado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plan Contratado</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar plan" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PLANS.map((plan) => (
                          <SelectItem key={plan} value={plan}>
                            {PLAN_LABELS[plan] ?? plan}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Determina las novedades disponibles</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactoEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email de Contacto</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="contacto@empresa.com"
                        disabled={isLoading}
                        {...field}
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
                    <FormLabel>Telefono de Contacto</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="(601) 123-4567"
                        disabled={isLoading}
                        {...field}
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
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : cliente ? (
                  'Guardar Cambios'
                ) : (
                  'Crear Cliente'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
