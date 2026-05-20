import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, UserPlus, Shield, Building2 } from 'lucide-react'
import {
  createUsuarioSchema,
  type CreateUsuarioFormData,
  updateUsuarioSchema,
  type UpdateUsuarioFormData,
} from '@/schemas/auth.schema'
import { INTERNAL_ROLES, CLIENT_ROLES, type Role } from '@/config/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { Usuario } from '@/types/auth'
import type { Cliente, Sucursal, Propietario } from '@/types/cliente'
import type { Entity } from '@/types/firestore'

// Role display configuration
const ROLE_CONFIG: Record<Role, { label: string; description: string }> = {
  super_admin: { label: 'Super Admin', description: 'Acceso total al sistema' },
  ops_admin: { label: 'Admin Operaciones', description: 'Gestiona operaciones y clientes' },
  analyst: { label: 'Analista', description: 'Visualiza datos y genera reportes' },
  support: { label: 'Soporte', description: 'Atiende casos de soporte' },
  client_admin: { label: 'Admin Cliente', description: 'Administra su empresa' },
  client_viewer: { label: 'Visor Cliente', description: 'Solo visualiza datos' },
}

interface UsuarioFormProps {
  usuario?: Entity<Usuario>
  clientes: Entity<Cliente>[]
  sucursales: Entity<Sucursal>[]
  propietarios: Entity<Propietario>[]
  onSubmit: (data: CreateUsuarioFormData | UpdateUsuarioFormData) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
  /** If true, show only client roles (for client admins) */
  clientOnly?: boolean
  /** Pre-selected client ID (for client admins) */
  defaultClienteId?: string
}

export function UsuarioForm({
  usuario,
  clientes,
  sucursales,
  propietarios,
  onSubmit,
  onCancel,
  isLoading = false,
  clientOnly = false,
  defaultClienteId,
}: UsuarioFormProps) {
  const isEditing = !!usuario

  // Choose schema based on whether editing or creating
  const form = useForm<CreateUsuarioFormData | UpdateUsuarioFormData>({
    resolver: zodResolver(isEditing ? updateUsuarioSchema : createUsuarioSchema),
    defaultValues: isEditing
      ? {
          nombre: usuario.nombre,
          rol: usuario.rol,
          sucursalIds: usuario.sucursalIds ?? [],
          propietarioId: usuario.propietarioId,
          activo: usuario.activo,
        }
      : {
          email: '',
          nombre: '',
          rol: clientOnly ? 'client_viewer' : undefined,
          clienteId: defaultClienteId ?? null,
          sucursalIds: [],
          propietarioId: null,
        },
  })

  const selectedRol = form.watch('rol')
  const selectedClienteId = isEditing
    ? usuario.clienteId
    : (form.watch('clienteId') as string | null)

  // Filter sucursales by client
  const filteredSucursales = selectedClienteId
    ? sucursales.filter((s) => s.clienteId === selectedClienteId)
    : []

  // Filter propietarios by sucursales
  const selectedSucursalIds = (form.watch('sucursalIds') as string[] | null) ?? []
  const filteredPropietarios =
    selectedSucursalIds.length > 0
      ? propietarios.filter((p) => selectedSucursalIds.includes(p.sucursalId))
      : []

  // Determine if role requires client
  const isClientRole = selectedRol
    ? CLIENT_ROLES.includes(selectedRol as (typeof CLIENT_ROLES)[number])
    : false

  const handleSubmit = async (data: CreateUsuarioFormData | UpdateUsuarioFormData) => {
    await onSubmit(data)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          <CardTitle>{isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}</CardTitle>
        </div>
        <CardDescription>
          {isEditing
            ? 'Modifica los datos y permisos del usuario'
            : 'Crea un nuevo usuario del sistema'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={(e) => {
              void form.handleSubmit(handleSubmit)(e)
            }}
            className="space-y-6"
          >
            <div className="grid gap-4 md:grid-cols-2">
              {/* Email - only for new users */}
              {!isEditing && (
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="usuario@empresa.com"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Se enviara invitacion a este email</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Nombre */}
              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Nombre Completo</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Juan Perez Rodriguez"
                        disabled={isLoading}
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Rol */}
              <FormField
                control={form.control}
                name="rol"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Rol
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? ''}
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar rol" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {!clientOnly && (
                          <SelectGroup>
                            <SelectLabel>Roles Internos</SelectLabel>
                            {INTERNAL_ROLES.map((rol) => (
                              <SelectItem key={rol} value={rol}>
                                <div className="flex flex-col">
                                  <span>{ROLE_CONFIG[rol].label}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {ROLE_CONFIG[rol].description}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        )}
                        <SelectGroup>
                          <SelectLabel>Roles de Cliente</SelectLabel>
                          {CLIENT_ROLES.map((rol) => (
                            <SelectItem key={rol} value={rol}>
                              <div className="flex flex-col">
                                <span>{ROLE_CONFIG[rol].label}</span>
                                <span className="text-xs text-muted-foreground">
                                  {ROLE_CONFIG[rol].description}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Cliente - only for new users with client roles */}
              {!isEditing && isClientRole && !defaultClienteId && (
                <FormField
                  control={form.control}
                  name="clienteId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Cliente
                      </FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value)
                          form.setValue('sucursalIds', [])
                          form.setValue('propietarioId', null)
                        }}
                        value={field.value ?? ''}
                        disabled={isLoading || clientes.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                clientes.length === 0 ? 'No hay clientes' : 'Seleccionar cliente'
                              }
                            />
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

              {/* Activo - only for editing */}
              {isEditing && (
                <FormField
                  control={form.control}
                  name="activo"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Usuario Activo</FormLabel>
                        <FormDescription>
                          Los usuarios inactivos no pueden iniciar sesion
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Sucursales - for client roles */}
            {isClientRole && selectedClienteId && filteredSucursales.length > 0 && (
              <FormField
                control={form.control}
                name="sucursalIds"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel>Sucursales Permitidas</FormLabel>
                      <FormDescription>
                        Selecciona las sucursales a las que tendra acceso
                      </FormDescription>
                    </div>
                    <div className="grid gap-2 md:grid-cols-2">
                      {filteredSucursales.map((sucursal) => (
                        <FormField
                          key={sucursal.id}
                          control={form.control}
                          name="sucursalIds"
                          render={({ field }) => {
                            const currentValue = (field.value as string[] | null) ?? []
                            return (
                              <FormItem
                                key={sucursal.id}
                                className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={currentValue.includes(sucursal.id)}
                                    onCheckedChange={(checked) => {
                                      const newValue = checked
                                        ? [...currentValue, sucursal.id]
                                        : currentValue.filter((id: string) => id !== sucursal.id)
                                      field.onChange(newValue)
                                    }}
                                    disabled={isLoading}
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel className="text-sm font-normal">
                                    {sucursal.nombre}
                                  </FormLabel>
                                  <p className="text-xs text-muted-foreground">{sucursal.ciudad}</p>
                                </div>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Propietario - optional, for client roles with sucursales */}
            {isClientRole && filteredPropietarios.length > 0 && (
              <FormField
                control={form.control}
                name="propietarioId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Propietario (Opcional)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? ''}
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Todos los propietarios" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Todos los propietarios</SelectItem>
                        {filteredPropietarios.map((prop) => (
                          <SelectItem key={prop.id} value={prop.id}>
                            {prop.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Limita el acceso a buses de un propietario especifico
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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
                ) : isEditing ? (
                  'Guardar Cambios'
                ) : (
                  'Crear Usuario'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

// Helper component for displaying role badges
interface RoleBadgeProps {
  rol: Role
  className?: string
}

export function RoleBadge({ rol, className }: RoleBadgeProps) {
  const isInternal = INTERNAL_ROLES.includes(rol as (typeof INTERNAL_ROLES)[number])
  const config = ROLE_CONFIG[rol]

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        isInternal ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
      } ${className ?? ''}`}
    >
      {config.label}
    </span>
  )
}
