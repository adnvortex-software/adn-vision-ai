import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Loader2,
  Bus as BusIcon,
  Network,
  Video,
  ChevronLeft,
  ChevronRight,
  Check,
} from 'lucide-react'
import {
  busWizardStep1Schema,
  busWizardStep2Schema,
  type BusWizardStep1Data,
  type BusWizardStep2Data,
} from '@/schemas/bus.schema'
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
import { cn } from '@/lib/utils'
import type { Sucursal, Propietario } from '@/types/cliente'
import type { Entity } from '@/types/firestore'
import type { BusWizardData } from '@/types/bus'

interface BusWizardProps {
  sucursales: Entity<Sucursal>[]
  propietarios: Entity<Propietario>[]
  clienteId: string
  onComplete: (data: BusWizardData) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
}

const STEPS = [
  { id: 1, title: 'Datos del vehiculo', icon: BusIcon },
  { id: 2, title: 'Conectividad', icon: Network },
  { id: 3, title: 'Camaras', icon: Video },
]

const VEHICLE_TYPE_LABELS: Record<string, string> = {
  bus: 'Bus',
  buseta: 'Buseta',
  van: 'Van',
  microbus: 'Microbus',
  otro: 'Otro',
}

export function BusWizard({
  sucursales,
  propietarios,
  clienteId,
  onComplete,
  onCancel,
  isLoading = false,
}: BusWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [wizardData, setWizardData] = useState<Partial<BusWizardData>>({
    clienteId,
    camaras: [],
  })

  // Step 1 form
  const step1Form = useForm<BusWizardStep1Data>({
    resolver: zodResolver(busWizardStep1Schema),
    defaultValues: {
      placa: '',
      clienteId,
      sucursalId: '',
      propietarioId: null,
      tipoVehiculo: 'bus',
      rutaTexto: null,
      conductorAsignadoId: null,
    },
  })

  // Step 2 form
  const step2Form = useForm<BusWizardStep2Data>({
    resolver: zodResolver(busWizardStep2Schema),
    defaultValues: {
      ztIpRouter: '',
      subnetLan: '',
    },
  })

  const selectedSucursalId = step1Form.watch('sucursalId')
  const filteredPropietarios = propietarios.filter(
    (p) => !selectedSucursalId || p.sucursalId === selectedSucursalId
  )

  const handleStep1Submit = (data: BusWizardStep1Data) => {
    setWizardData((prev) => ({ ...prev, ...data }))
    setCurrentStep(2)
  }

  const handleStep2Submit = (data: BusWizardStep2Data) => {
    setWizardData((prev) => ({ ...prev, ...data }))
    setCurrentStep(3)
  }

  const handleStep3Complete = async () => {
    // For now, skip camera configuration and complete the wizard
    const finalData: BusWizardData = {
      placa: wizardData.placa ?? '',
      clienteId: wizardData.clienteId ?? clienteId,
      sucursalId: wizardData.sucursalId ?? '',
      propietarioId: wizardData.propietarioId,
      tipoVehiculo: wizardData.tipoVehiculo ?? 'bus',
      rutaTexto: wizardData.rutaTexto,
      conductorAsignadoId: wizardData.conductorAsignadoId,
      ztIpRouter: wizardData.ztIpRouter ?? '',
      subnetLan: wizardData.subnetLan ?? '',
      camaras: wizardData.camaras ?? [],
    }
    await onComplete(finalData)
  }

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Nuevo Bus</CardTitle>
        <CardDescription>Completa los pasos para registrar un nuevo vehiculo</CardDescription>

        {/* Step indicator */}
        <div className="flex items-center justify-between pt-4">
          {STEPS.map((step, index) => {
            const Icon = step.icon
            const isActive = currentStep === step.id
            const isCompleted = currentStep > step.id

            return (
              <div key={step.id} className="flex flex-1 items-center">
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors',
                      isActive && 'border-primary bg-primary text-primary-foreground',
                      isCompleted && 'border-primary bg-primary text-primary-foreground',
                      !isActive &&
                        !isCompleted &&
                        'border-muted-foreground/30 text-muted-foreground'
                    )}
                  >
                    {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <span
                    className={cn(
                      'text-xs font-medium',
                      isActive && 'text-primary',
                      isCompleted && 'text-primary',
                      !isActive && !isCompleted && 'text-muted-foreground'
                    )}
                  >
                    {step.title}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={cn(
                      'mx-2 h-0.5 flex-1',
                      isCompleted ? 'bg-primary' : 'bg-muted-foreground/30'
                    )}
                  />
                )}
              </div>
            )
          })}
        </div>
      </CardHeader>

      <CardContent>
        {/* Step 1: Vehicle data */}
        {currentStep === 1 && (
          <Form {...step1Form}>
            <form onSubmit={step1Form.handleSubmit(handleStep1Submit)} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={step1Form.control}
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
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={step1Form.control}
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
                  control={step1Form.control}
                  name="sucursalId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sucursal</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value)
                          step1Form.setValue('propietarioId', null)
                        }}
                        defaultValue={field.value}
                        disabled={isLoading || sucursales.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                sucursales.length === 0
                                  ? 'No hay sucursales'
                                  : 'Seleccionar sucursal'
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
                  control={step1Form.control}
                  name="propietarioId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Propietario (Opcional)</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value ?? ''}
                        disabled={isLoading || filteredPropietarios.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar propietario" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {filteredPropietarios.map((propietario) => (
                            <SelectItem key={propietario.id} value={propietario.id}>
                              {propietario.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={step1Form.control}
                  name="rutaTexto"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Ruta (Opcional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Centro - Norte"
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

              <div className="flex justify-between">
                {onCancel && (
                  <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                    Cancelar
                  </Button>
                )}
                <div className="ml-auto">
                  <Button type="submit" disabled={isLoading || sucursales.length === 0}>
                    Siguiente
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        )}

        {/* Step 2: Connectivity */}
        {currentStep === 2 && (
          <Form {...step2Form}>
            <form onSubmit={step2Form.handleSubmit(handleStep2Submit)} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={step2Form.control}
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
                  control={step2Form.control}
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

              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={goBack} disabled={isLoading}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Anterior
                </Button>
                <Button type="submit" disabled={isLoading}>
                  Siguiente
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          </Form>
        )}

        {/* Step 3: Cameras (placeholder) */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="rounded-lg border border-dashed p-8 text-center">
              <Video className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">Configuracion de camaras</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Puedes configurar las camaras despues de crear el bus desde la seccion de gestion.
              </p>
            </div>

            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={goBack} disabled={isLoading}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Anterior
              </Button>
              <Button
                onClick={() => {
                  void handleStep3Complete()
                }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Crear Bus
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
