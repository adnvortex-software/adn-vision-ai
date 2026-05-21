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
  Plus,
  Minus,
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
import { Label } from '@/components/ui/label'
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
import type { BusWizardData, CreateCamaraData } from '@/types/bus'
import type { CameraProfile } from '@/config/constants'

// Opciones predefinidas de tipos de cámara con sus perfiles
const CAMERA_TYPE_OPTIONS = [
  { value: 'frontal', label: 'Frontal', perfil: 'frontal' as CameraProfile },
  { value: 'cabina', label: 'Cabina', perfil: 'cabina' as CameraProfile },
  { value: 'puerta', label: 'Puerta', perfil: 'puerta' as CameraProfile },
  { value: 'pasillo_1', label: 'Pasillo 1', perfil: 'pasillo' as CameraProfile },
  { value: 'pasillo_2', label: 'Pasillo 2', perfil: 'pasillo' as CameraProfile },
  { value: 'otro', label: 'Otro', perfil: 'otro' as CameraProfile },
] as const

interface CameraConfig {
  tipo: string
  nombrePersonalizado: string
}

interface BusWizardProps {
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

export function BusWizard({ clienteId, onComplete, onCancel, isLoading = false }: BusWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [wizardData, setWizardData] = useState<Partial<BusWizardData>>({
    clienteId,
    camaras: [],
  })

  // Camera configuration state
  const [numCamaras, setNumCamaras] = useState(0)
  const [cameraConfigs, setCameraConfigs] = useState<CameraConfig[]>([])

  // Step 1 form
  const step1Form = useForm<BusWizardStep1Data>({
    resolver: zodResolver(busWizardStep1Schema),
    defaultValues: {
      placa: '',
      clienteId,
      deviceId: '',
      ipVirtual: '',
      numeroInterno: undefined,
      tipoVehiculo: 'bus',
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

  const handleStep1Submit = (data: BusWizardStep1Data) => {
    setWizardData((prev) => ({ ...prev, ...data }))
    setCurrentStep(2)
  }

  const handleStep2Submit = (data: BusWizardStep2Data) => {
    setWizardData((prev) => ({ ...prev, ...data }))
    setCurrentStep(3)
  }

  // Default camera types to assign based on index
  const getDefaultCameraType = (index: number): string => {
    const defaults = [
      'frontal',
      'cabina',
      'puerta',
      'pasillo_1',
      'pasillo_2',
      'otro',
      'otro',
      'otro',
    ]
    return defaults[index] ?? 'otro'
  }

  // Handle number of cameras change
  const handleNumCamarasChange = (value: number) => {
    const newValue = Math.max(0, Math.min(8, value)) // Limit between 0 and 8
    setNumCamaras(newValue)

    // Adjust camera configs array
    if (newValue > cameraConfigs.length) {
      // Add new configs with default types
      const newConfigs = [...cameraConfigs]
      for (let i = cameraConfigs.length; i < newValue; i++) {
        newConfigs.push({ tipo: getDefaultCameraType(i), nombrePersonalizado: '' })
      }
      setCameraConfigs(newConfigs)
    } else if (newValue < cameraConfigs.length) {
      // Remove excess configs
      setCameraConfigs(cameraConfigs.slice(0, newValue))
    }
  }

  // Update camera config
  const updateCameraConfig = (index: number, field: keyof CameraConfig, value: string) => {
    const newConfigs = [...cameraConfigs]
    if (newConfigs[index]) {
      newConfigs[index] = { ...newConfigs[index], [field]: value }
      setCameraConfigs(newConfigs)
    }
  }

  const handleStep3Complete = async () => {
    // Build camera data from configs
    const camaras: CreateCamaraData[] = cameraConfigs
      .filter((config) => config.tipo) // Only include cameras with a type selected
      .map((config, index) => {
        const option = CAMERA_TYPE_OPTIONS.find((opt) => opt.value === config.tipo)
        const nombre =
          config.tipo === 'otro'
            ? config.nombrePersonalizado || `Camara ${String(index + 1)}`
            : (option?.label ?? `Camara ${String(index + 1)}`)
        const perfil = option?.perfil ?? 'otro'

        return {
          nombre,
          perfil,
          canal: index + 1,
          rtspUrl: '', // Will be configured later
        }
      })

    const finalData: BusWizardData = {
      placa: wizardData.placa ?? '',
      clienteId: wizardData.clienteId ?? clienteId,
      deviceId: wizardData.deviceId ?? '',
      ipVirtual: wizardData.ipVirtual ?? '',
      numeroInterno: wizardData.numeroInterno,
      tipoVehiculo: wizardData.tipoVehiculo ?? 'bus',
      conductorAsignadoId: wizardData.conductorAsignadoId,
      ztIpRouter: wizardData.ztIpRouter ?? '',
      subnetLan: wizardData.subnetLan ?? '',
      camaras,
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
                  name="deviceId"
                  render={({ field }) => (
                    <FormItem>
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

                <FormField
                  control={step1Form.control}
                  name="ipVirtual"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IP Virtual</FormLabel>
                      <FormControl>
                        <Input placeholder="10.0.0.1" disabled={isLoading} {...field} />
                      </FormControl>
                      <FormDescription>IP generada en OPNsense</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={step1Form.control}
                  name="numeroInterno"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Numero Interno</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="001"
                          disabled={isLoading}
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => {
                            const val = e.target.value
                            field.onChange(val === '' ? undefined : parseInt(val, 10))
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Numero de identificacion interna del vehiculo
                      </FormDescription>
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
                  <Button type="submit" disabled={isLoading}>
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

        {/* Step 3: Cameras */}
        {currentStep === 3 && (
          <div className="space-y-6">
            {/* Number of cameras input */}
            <div className="space-y-2">
              <Label>Cantidad de camaras</Label>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    handleNumCamarasChange(numCamaras - 1)
                  }}
                  disabled={isLoading || numCamaras === 0}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  min={0}
                  max={8}
                  value={numCamaras}
                  onChange={(e) => {
                    handleNumCamarasChange(parseInt(e.target.value) || 0)
                  }}
                  className="w-20 text-center"
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    handleNumCamarasChange(numCamaras + 1)
                  }}
                  disabled={isLoading || numCamaras === 8}
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">Max: 8</span>
              </div>
            </div>

            {/* Camera configurations */}
            {numCamaras > 0 && (
              <div className="space-y-4">
                <Label>Configurar camaras</Label>
                <div className="grid gap-4">
                  {cameraConfigs.map((config, index) => (
                    <div key={index} className="flex items-start gap-3 rounded-lg border p-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Video className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Camara {index + 1}</span>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-1">
                            <Label className="text-xs">Tipo</Label>
                            <Select
                              value={config.tipo}
                              onValueChange={(value) => {
                                updateCameraConfig(index, 'tipo', value)
                              }}
                              disabled={isLoading}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar tipo" />
                              </SelectTrigger>
                              <SelectContent>
                                {CAMERA_TYPE_OPTIONS.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          {config.tipo === 'otro' && (
                            <div className="space-y-1">
                              <Label className="text-xs">Nombre personalizado</Label>
                              <Input
                                placeholder="Ej: Techo, Lateral..."
                                value={config.nombrePersonalizado}
                                onChange={(e) => {
                                  updateCameraConfig(index, 'nombrePersonalizado', e.target.value)
                                }}
                                disabled={isLoading}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {numCamaras === 0 && (
              <div className="rounded-lg border border-dashed p-6 text-center">
                <Video className="mx-auto h-10 w-10 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Ingresa la cantidad de camaras para configurarlas
                </p>
              </div>
            )}

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
