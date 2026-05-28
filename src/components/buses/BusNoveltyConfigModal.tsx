import { useState, useEffect, useCallback, useMemo } from 'react'
import { Loader2, Camera, Plus, Trash2, Save, AlertTriangle, UserX, Users } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { updateBus } from '@/services/buses.service'
import type { BusConDetalles, NoveltyConfig, NoveltyType } from '@/types/bus'
import { NOVELTY_TYPES } from '@/types/bus'

interface BusNoveltyConfigModalProps {
  bus: BusConDetalles | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdated?: () => void
}

interface CaptureResponse {
  success: boolean
  snapshotUrl: string
  frameWidth: number
  frameHeight: number
  cached?: boolean
  error?: string
}

const NOVELTY_ICONS: Record<NoveltyType, typeof UserX> = {
  pasajero_cabina: UserX,
  sobrecupo_pasillo: Users,
}

export function BusNoveltyConfigModal({
  bus,
  open,
  onOpenChange,
  onUpdated,
}: BusNoveltyConfigModalProps) {
  const { toast } = useToast()

  // Configurations state
  const [configs, setConfigs] = useState<NoveltyConfig[]>([])
  const [isSaving, setIsSaving] = useState(false)

  // New config state
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [newChannel, setNewChannel] = useState('1')
  const [newNoveltyType, setNewNoveltyType] = useState<NoveltyType>('pasajero_cabina')
  const [newMaxPersonas, setNewMaxPersonas] = useState(1)
  const [newTiempoSeg, setNewTiempoSeg] = useState(30)

  // Capture state for preview
  const [isCapturing, setIsCapturing] = useState(false)
  const [captureProgress, setCaptureProgress] = useState(0)
  const [captureStatus, setCaptureStatus] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Build camera options from bus data
  const cameraOptions = useMemo(() => {
    const camaras = bus?.camarasNombres ?? []
    if (camaras.length > 0) {
      return camaras.map((nombre, index) => ({
        value: String(index + 1),
        label: `Canal ${String(index + 1)} - ${nombre}`,
        cameraName: nombre,
      }))
    }
    return [
      { value: '1', label: 'Canal 1', cameraName: 'canal_1' },
      { value: '2', label: 'Canal 2', cameraName: 'canal_2' },
      { value: '3', label: 'Canal 3', cameraName: 'canal_3' },
      { value: '4', label: 'Canal 4', cameraName: 'canal_4' },
    ]
  }, [bus?.camarasNombres])

  // Load existing configs when bus changes
  useEffect(() => {
    if (bus) {
      setConfigs(bus.noveltyConfigs ?? [])
    }
  }, [bus])

  // Reset form when closing
  useEffect(() => {
    if (!open) {
      setIsAddingNew(false)
      setPreviewUrl(null)
    }
  }, [open])

  // Update defaults when novelty type changes
  useEffect(() => {
    const defaults = NOVELTY_TYPES[newNoveltyType]
    setNewMaxPersonas(defaults.defaultMaxPersonas)
    setNewTiempoSeg(defaults.defaultTiempoMin)
  }, [newNoveltyType])

  // Capture preview frame
  const capturePreview = useCallback(
    async (channelNum: string) => {
      if (!bus?.dvrIp || !bus.placa) return

      setIsCapturing(true)
      setCaptureProgress(20)
      setCaptureStatus('Conectando al DVR...')

      try {
        const cameraName =
          cameraOptions.find((o) => o.value === channelNum)?.cameraName ?? `canal_${channelNum}`
        const captureApiUrl =
          (import.meta.env.VITE_CAPTURE_API_URL as string) || 'http://localhost:5000'

        setCaptureProgress(50)
        setCaptureStatus(`Capturando canal ${channelNum}...`)

        const response = await fetch(`${captureApiUrl}/capture`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            busId: bus.id,
            placa: bus.placa,
            dvrIp: bus.dvrIp,
            channel: parseInt(channelNum),
            cameraName: cameraName,
            user: bus.dvrUsuario ?? 'admin',
            password: bus.dvrPassword ?? 'admin',
            forceCapture: false,
          }),
        })

        setCaptureProgress(80)

        if (!response.ok) {
          const errorData = (await response.json()) as { error?: string }
          throw new Error(errorData.error ?? 'Error al capturar frame')
        }

        const data = (await response.json()) as CaptureResponse
        setPreviewUrl(data.snapshotUrl)
        setCaptureProgress(100)
        setCaptureStatus('Captura exitosa')

        setTimeout(() => {
          setCaptureProgress(0)
          setCaptureStatus('')
        }, 1500)
      } catch (error) {
        console.error('Capture error:', error)
        setCaptureProgress(0)
        setCaptureStatus('')
        toast({
          title: 'Error de captura',
          description: error instanceof Error ? error.message : 'No se pudo capturar el frame',
          variant: 'destructive',
        })
      } finally {
        setIsCapturing(false)
      }
    },
    [bus, cameraOptions, toast]
  )

  // Add new configuration
  const handleAddConfig = useCallback(() => {
    const cameraName =
      cameraOptions.find((o) => o.value === newChannel)?.cameraName ?? `canal_${newChannel}`

    // Check if already exists for this camera and type
    const existing = configs.find(
      (c) => c.cameraChannel === parseInt(newChannel) && c.tipoNovedad === newNoveltyType
    )
    if (existing) {
      toast({
        title: 'Configuracion duplicada',
        description: `Ya existe una configuracion de "${NOVELTY_TYPES[newNoveltyType].nombre}" para este canal`,
        variant: 'destructive',
      })
      return
    }

    const newConfig: NoveltyConfig = {
      id: `${bus?.id ?? 'bus'}_${newNoveltyType}_${newChannel}_${String(Date.now())}`,
      tipoNovedad: newNoveltyType,
      cameraChannel: parseInt(newChannel),
      cameraId: cameraName,
      maxPersonas: newMaxPersonas,
      tiempoMinimoMin: newTiempoSeg,
      activa: true,
    }

    setConfigs([...configs, newConfig])
    setIsAddingNew(false)
    setPreviewUrl(null)

    toast({
      title: 'Configuracion agregada',
      description: `${NOVELTY_TYPES[newNoveltyType].nombre} configurada para canal ${newChannel}`,
    })
  }, [
    bus?.id,
    cameraOptions,
    configs,
    newChannel,
    newMaxPersonas,
    newNoveltyType,
    newTiempoSeg,
    toast,
  ])

  // Remove configuration
  const handleRemoveConfig = useCallback(
    (configId: string) => {
      setConfigs(configs.filter((c) => c.id !== configId))
      toast({
        title: 'Configuracion eliminada',
        description: 'La configuracion de novedad ha sido eliminada',
      })
    },
    [configs, toast]
  )

  // Toggle config active state
  const handleToggleActive = useCallback(
    (configId: string) => {
      setConfigs(configs.map((c) => (c.id === configId ? { ...c, activa: !c.activa } : c)))
    },
    [configs]
  )

  // Save all configurations
  const handleSave = async () => {
    if (!bus) return

    setIsSaving(true)
    try {
      await updateBus(bus.id, {
        noveltyConfigs: configs,
      })

      toast({
        title: 'Configuracion guardada',
        description: `${String(configs.length)} configuraciones de novedades guardadas`,
      })

      onUpdated?.()
      onOpenChange(false)
    } catch (error) {
      console.error('Save error:', error)
      toast({
        title: 'Error',
        description: 'No se pudo guardar la configuracion',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (!bus) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Configurar Novedades - {bus.placa}
          </DialogTitle>
          <DialogDescription>
            Configura la deteccion automatica de novedades para este vehiculo
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Existing Configurations */}
          {configs.length > 0 && (
            <div className="space-y-3">
              <Label className="text-base">Novedades configuradas ({configs.length})</Label>
              <div className="space-y-2">
                {configs.map((config) => {
                  const Icon = NOVELTY_ICONS[config.tipoNovedad]
                  const typeInfo = NOVELTY_TYPES[config.tipoNovedad]
                  const cameraLabel =
                    cameraOptions.find((o) => o.value === String(config.cameraChannel))?.label ??
                    `Canal ${String(config.cameraChannel)}`

                  return (
                    <Card key={config.id} className={!config.activa ? 'opacity-60' : ''}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon className="h-5 w-5 text-primary" />
                            <CardTitle className="text-base">{typeInfo.nombre}</CardTitle>
                            <Badge variant={config.activa ? 'default' : 'secondary'}>
                              {config.activa ? 'Activa' : 'Inactiva'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={config.activa}
                              onCheckedChange={() => {
                                handleToggleActive(config.id)
                              }}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => {
                                handleRemoveConfig(config.id)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <CardDescription>{cameraLabel}</CardDescription>
                      </CardHeader>
                      <CardContent className="pb-3">
                        <div className="flex gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Max personas:</span>{' '}
                            <span className="font-medium">{config.maxPersonas}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Tiempo minimo:</span>{' '}
                            <span className="font-medium">{config.tiempoMinimoMin} min</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {/* Empty state */}
          {configs.length === 0 && !isAddingNew && (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8 text-muted-foreground">
              <AlertTriangle className="mb-3 h-12 w-12 opacity-50" />
              <p className="text-sm">No hay novedades configuradas</p>
              <p className="text-xs">Agrega una configuracion para empezar a detectar novedades</p>
            </div>
          )}

          {/* Add new configuration */}
          {isAddingNew ? (
            <Card className="border-primary">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Nueva configuracion</CardTitle>
                <CardDescription>Configura los parametros de deteccion</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Camera selector */}
                  <div className="space-y-2">
                    <Label>Camara</Label>
                    <div className="flex gap-2">
                      <Select
                        value={newChannel}
                        onValueChange={(v) => {
                          setNewChannel(v)
                          setPreviewUrl(null)
                        }}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Seleccionar camara" />
                        </SelectTrigger>
                        <SelectContent>
                          {cameraOptions.map((cam) => (
                            <SelectItem key={cam.value} value={cam.value}>
                              {cam.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => capturePreview(newChannel)}
                        disabled={isCapturing || !bus.dvrIp}
                        title="Ver preview"
                      >
                        {isCapturing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Camera className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Novelty type */}
                  <div className="space-y-2">
                    <Label>Tipo de novedad</Label>
                    <Select
                      value={newNoveltyType}
                      onValueChange={(v) => {
                        setNewNoveltyType(v as NoveltyType)
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(NOVELTY_TYPES).map(([key, info]) => (
                          <SelectItem key={key} value={key}>
                            {info.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {NOVELTY_TYPES[newNoveltyType].descripcion}
                    </p>
                  </div>

                  {/* Max personas */}
                  <div className="space-y-2">
                    <Label>Maximo de personas permitidas</Label>
                    <Input
                      type="number"
                      value={newMaxPersonas}
                      onChange={(e) => {
                        setNewMaxPersonas(Number(e.target.value))
                      }}
                      min={0}
                      max={10}
                    />
                    <p className="text-xs text-muted-foreground">
                      Se genera alerta si se detectan mas de este numero
                    </p>
                  </div>

                  {/* Tiempo minimo */}
                  <div className="space-y-2">
                    <Label>Tiempo minimo (segundos)</Label>
                    <Input
                      type="number"
                      value={newTiempoSeg}
                      onChange={(e) => {
                        setNewTiempoSeg(Number(e.target.value))
                      }}
                      min={5}
                      max={300}
                    />
                    <p className="text-xs text-muted-foreground">
                      Tiempo que debe mantenerse la condicion antes de alertar
                    </p>
                  </div>
                </div>

                {/* Capture progress */}
                {captureProgress > 0 && (
                  <div className="space-y-2">
                    <Progress value={captureProgress} className="h-2" />
                    <p className="text-center text-xs text-muted-foreground">{captureStatus}</p>
                  </div>
                )}

                {/* Preview */}
                {previewUrl && (
                  <div className="space-y-2">
                    <Label>Vista previa</Label>
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
                      <img
                        src={previewUrl}
                        alt="Camera preview"
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      La deteccion se realizara sobre toda el area visible de la camara
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAddingNew(false)
                      setPreviewUrl(null)
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleAddConfig}>
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setIsAddingNew(true)
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Agregar novedad
            </Button>
          )}

          {/* Info alert */}
          {configs.length > 0 && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-900 dark:bg-yellow-950">
              <div className="flex gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">
                    Servicio de deteccion
                  </p>
                  <p className="text-yellow-700 dark:text-yellow-300">
                    El servicio de deteccion de novedades debe estar ejecutandose en el servidor
                    para que las alertas funcionen.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex justify-end gap-3 pt-4">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false)
            }}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Guardar configuracion
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
