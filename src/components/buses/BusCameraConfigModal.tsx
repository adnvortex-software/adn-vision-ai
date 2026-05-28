import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import {
  Loader2,
  Camera,
  Save,
  GripVertical,
  GripHorizontal,
  RefreshCw,
  Plus,
  Trash2,
  AlertTriangle,
  UserX,
  Users,
  Settings2,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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

interface BusCameraConfigModalProps {
  bus: BusConDetalles | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdated?: () => void
  initialTab?: 'counting' | 'novelty'
}

interface CaptureResponse {
  success: boolean
  snapshotUrl: string
  frameWidth: number
  frameHeight: number
  cached?: boolean
  error?: string
}

interface CheckSnapshotResponse {
  exists: boolean
  snapshotUrl: string | null
}

const NOVELTY_ICONS: Record<NoveltyType, typeof UserX> = {
  pasajero_cabina: UserX,
  sobrecupo_pasillo: Users,
}

export function BusCameraConfigModal({
  bus,
  open,
  onOpenChange,
  onUpdated,
  initialTab = 'counting',
}: BusCameraConfigModalProps) {
  const { toast } = useToast()
  const containerRef = useRef<HTMLDivElement>(null)

  // Tab state
  const [activeTab, setActiveTab] = useState(initialTab)

  // Saving state
  const [isSaving, setIsSaving] = useState(false)

  // Capture state
  const [isCapturing, setIsCapturing] = useState(false)
  const [isCheckingCache, setIsCheckingCache] = useState(false)
  const [captureProgress, setCaptureProgress] = useState(0)
  const [captureStatus, setCaptureStatus] = useState('')
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null)
  const [frameWidth, setFrameWidth] = useState(960)
  const [frameHeight, setFrameHeight] = useState(1080)

  // ═══════════════════════════════════════════════════════════════
  // COUNTING CONFIG STATE
  // ═══════════════════════════════════════════════════════════════
  const [countingEnabled, setCountingEnabled] = useState(false)
  const [countingChannel, setCountingChannel] = useState('1')
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('vertical')
  const [linePosition, setLinePosition] = useState(50)
  const [aforoMax, setAforoMax] = useState(45)
  const [isDragging, setIsDragging] = useState(false)

  // ═══════════════════════════════════════════════════════════════
  // NOVELTY CONFIG STATE
  // ═══════════════════════════════════════════════════════════════
  const [noveltyConfigs, setNoveltyConfigs] = useState<NoveltyConfig[]>([])
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [newChannel, setNewChannel] = useState('1')
  const [newNoveltyType, setNewNoveltyType] = useState<NoveltyType>('pasajero_cabina')
  const [newMaxPersonas, setNewMaxPersonas] = useState(1)
  const [newTiempoMin, setNewTiempoMin] = useState(1)

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

  const getCurrentCameraName = useCallback(
    (channelNum: string) => {
      const option = cameraOptions.find((o) => o.value === channelNum)
      return option?.cameraName ?? `canal_${channelNum}`
    },
    [cameraOptions]
  )

  // Load existing config when bus changes
  useEffect(() => {
    if (bus) {
      // Counting config
      setCountingEnabled(bus.countingEnabled ?? false)
      setCountingChannel(String(bus.countingCameraChannel ?? 1))
      setOrientation(bus.countingLineOrientation ?? 'vertical')
      setAforoMax(bus.aforoMax ?? 45)
      setSnapshotUrl(bus.countingSnapshotUrl ?? null)

      if (bus.countingLinePosition !== undefined) {
        const maxDimension =
          bus.countingLineOrientation === 'vertical'
            ? ((bus as unknown as { countingFrameWidth?: number }).countingFrameWidth ?? 960)
            : ((bus as unknown as { countingFrameHeight?: number }).countingFrameHeight ?? 1080)
        setLinePosition((bus.countingLinePosition / maxDimension) * 100)
      } else {
        setLinePosition(50)
      }

      // Novelty configs
      setNoveltyConfigs(bus.noveltyConfigs ?? [])
    }
  }, [bus])

  // Reset tab when opening
  useEffect(() => {
    if (open) {
      setActiveTab(initialTab)
      setIsAddingNew(false)
    }
  }, [open, initialTab])

  // Update defaults when novelty type changes
  useEffect(() => {
    const defaults = NOVELTY_TYPES[newNoveltyType]
    setNewMaxPersonas(defaults.defaultMaxPersonas)
    setNewTiempoMin(defaults.defaultTiempoMin)
  }, [newNoveltyType])

  // ═══════════════════════════════════════════════════════════════
  // CAPTURE FUNCTIONS
  // ═══════════════════════════════════════════════════════════════

  const checkSnapshotCache = useCallback(
    async (channelNum: string): Promise<string | null> => {
      if (!bus?.placa) return null

      const cameraName = getCurrentCameraName(channelNum)
      const captureApiUrl =
        (import.meta.env.VITE_CAPTURE_API_URL as string) || 'http://localhost:5000'

      try {
        const response = await fetch(`${captureApiUrl}/snapshot/check`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            placa: bus.placa,
            cameraName: cameraName,
          }),
        })

        if (response.ok) {
          const data = (await response.json()) as CheckSnapshotResponse
          if (data.exists && data.snapshotUrl) {
            return data.snapshotUrl
          }
        }
      } catch (error) {
        console.error('Error checking cache:', error)
      }
      return null
    },
    [bus?.placa, getCurrentCameraName]
  )

  const captureFrame = useCallback(
    async (channelNum: string, forceCapture: boolean = false) => {
      if (!bus?.dvrIp || !bus.placa) {
        toast({
          title: 'Error',
          description: 'El bus no tiene IP de DVR o placa configurada',
          variant: 'destructive',
        })
        return
      }

      if (!forceCapture) {
        setIsCheckingCache(true)
        setCaptureStatus('Verificando cache...')
        setCaptureProgress(10)

        const cachedUrl = await checkSnapshotCache(channelNum)
        if (cachedUrl) {
          setSnapshotUrl(cachedUrl)
          setCaptureProgress(100)
          setCaptureStatus('Imagen cargada desde cache')
          setIsCheckingCache(false)
          setTimeout(() => {
            setCaptureProgress(0)
            setCaptureStatus('')
          }, 1500)
          return
        }
        setIsCheckingCache(false)
      }

      setIsCapturing(true)
      setCaptureProgress(20)
      setCaptureStatus('Conectando al DVR...')

      try {
        const cameraName = getCurrentCameraName(channelNum)
        const captureApiUrl =
          (import.meta.env.VITE_CAPTURE_API_URL as string) || 'http://localhost:5000'

        setCaptureProgress(40)
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
            forceCapture: forceCapture,
          }),
        })

        setCaptureProgress(80)
        setCaptureStatus('Procesando imagen...')

        if (!response.ok) {
          const errorData = (await response.json()) as { error?: string }
          throw new Error(errorData.error ?? 'Error al capturar frame')
        }

        const data = (await response.json()) as CaptureResponse
        setSnapshotUrl(data.snapshotUrl)
        setFrameWidth(data.frameWidth)
        setFrameHeight(data.frameHeight)

        setCaptureProgress(100)
        setCaptureStatus(data.cached ? 'Imagen cargada desde cache' : 'Captura exitosa')

        setTimeout(() => {
          setCaptureProgress(0)
          setCaptureStatus('')
        }, 2000)
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
    [bus, toast, checkSnapshotCache, getCurrentCameraName]
  )

  // ═══════════════════════════════════════════════════════════════
  // COUNTING LINE DRAG HANDLERS
  // ═══════════════════════════════════════════════════════════════

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !containerRef.current) return

      const rect = containerRef.current.getBoundingClientRect()
      let newPosition: number

      if (orientation === 'vertical') {
        newPosition = ((e.clientX - rect.left) / rect.width) * 100
      } else {
        newPosition = ((e.clientY - rect.top) / rect.height) * 100
      }

      setLinePosition(Math.max(0, Math.min(100, newPosition)))
    },
    [isDragging, orientation]
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseUp = () => {
        setIsDragging(false)
      }
      window.addEventListener('mouseup', handleGlobalMouseUp)
      return () => {
        window.removeEventListener('mouseup', handleGlobalMouseUp)
      }
    }
    return undefined
  }, [isDragging])

  // ═══════════════════════════════════════════════════════════════
  // NOVELTY HANDLERS
  // ═══════════════════════════════════════════════════════════════

  const handleAddNoveltyConfig = useCallback(() => {
    const cameraName = getCurrentCameraName(newChannel)

    const existing = noveltyConfigs.find(
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
      maxPersonas: NOVELTY_TYPES[newNoveltyType].showMaxPersonas ? newMaxPersonas : 0,
      tiempoMinimoMin: newTiempoMin,
      activa: true,
    }

    setNoveltyConfigs([...noveltyConfigs, newConfig])
    setIsAddingNew(false)

    toast({
      title: 'Configuracion agregada',
      description: `${NOVELTY_TYPES[newNoveltyType].nombre} configurada para canal ${newChannel}`,
    })
  }, [
    bus?.id,
    getCurrentCameraName,
    noveltyConfigs,
    newChannel,
    newMaxPersonas,
    newNoveltyType,
    newTiempoMin,
    toast,
  ])

  const handleRemoveNoveltyConfig = useCallback(
    (configId: string) => {
      setNoveltyConfigs(noveltyConfigs.filter((c) => c.id !== configId))
    },
    [noveltyConfigs]
  )

  const handleToggleNoveltyActive = useCallback(
    (configId: string) => {
      setNoveltyConfigs(
        noveltyConfigs.map((c) => (c.id === configId ? { ...c, activa: !c.activa } : c))
      )
    },
    [noveltyConfigs]
  )

  // ═══════════════════════════════════════════════════════════════
  // SAVE
  // ═══════════════════════════════════════════════════════════════

  const handleSave = async () => {
    if (!bus) return

    setIsSaving(true)
    try {
      const maxDimension = orientation === 'vertical' ? frameWidth : frameHeight
      const pixelPosition = Math.round((linePosition / 100) * maxDimension)

      await updateBus(bus.id, {
        // Counting config
        countingEnabled: countingEnabled,
        countingCameraChannel: parseInt(countingChannel),
        countingLinePosition: pixelPosition,
        countingLineOrientation: orientation,
        aforoMax: aforoMax,
        // Novelty configs
        noveltyConfigs: noveltyConfigs,
      })

      toast({
        title: 'Configuracion guardada',
        description: 'La configuracion de camaras ha sido actualizada',
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

  const isLoading = isCapturing || isCheckingCache

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Configurar Camaras - {bus.placa}
          </DialogTitle>
          <DialogDescription>
            Configura el conteo de pasajeros y la deteccion de novedades
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v: string) => {
            setActiveTab(v as 'counting' | 'novelty')
          }}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="counting" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Conteo de Pasajeros
            </TabsTrigger>
            <TabsTrigger value="novelty" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Novedades
            </TabsTrigger>
          </TabsList>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* TAB: CONTEO DE PASAJEROS */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <TabsContent value="counting" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Left: Configuration options */}
              <div className="space-y-4">
                {/* Enable/Disable */}
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <Label>Conteo habilitado</Label>
                    <p className="text-sm text-muted-foreground">Activar el conteo de pasajeros</p>
                  </div>
                  <Switch checked={countingEnabled} onCheckedChange={setCountingEnabled} />
                </div>

                {/* Camera Channel */}
                <div className="space-y-2">
                  <Label>Camara de conteo</Label>
                  <Select
                    value={countingChannel}
                    onValueChange={(v) => {
                      setCountingChannel(v)
                      setSnapshotUrl(null)
                      void captureFrame(v, false)
                    }}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
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
                </div>

                {/* Orientation */}
                <div className="space-y-2">
                  <Label>Orientacion de la linea</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={orientation === 'vertical' ? 'default' : 'outline'}
                      className="flex-1"
                      onClick={() => {
                        setOrientation('vertical')
                      }}
                    >
                      <GripVertical className="mr-2 h-4 w-4" />
                      Vertical
                    </Button>
                    <Button
                      type="button"
                      variant={orientation === 'horizontal' ? 'default' : 'outline'}
                      className="flex-1"
                      onClick={() => {
                        setOrientation('horizontal')
                      }}
                    >
                      <GripHorizontal className="mr-2 h-4 w-4" />
                      Horizontal
                    </Button>
                  </div>
                </div>

                {/* Line Position */}
                <div className="space-y-2">
                  <Label>Posicion de la linea ({Math.round(linePosition)}%)</Label>
                  <Input
                    type="range"
                    min="0"
                    max="100"
                    value={linePosition}
                    onChange={(e) => {
                      setLinePosition(Number(e.target.value))
                    }}
                    className="h-2 cursor-pointer"
                  />
                </div>

                {/* Aforo Max */}
                <div className="space-y-2">
                  <Label>Aforo maximo</Label>
                  <Input
                    type="number"
                    value={aforoMax}
                    onChange={(e) => {
                      setAforoMax(Number(e.target.value))
                    }}
                    min={1}
                    max={100}
                  />
                  <p className="text-xs text-muted-foreground">
                    Numero maximo de pasajeros antes de alertar sobrecupo
                  </p>
                </div>

                {/* Capture Buttons */}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => captureFrame(countingChannel, false)}
                    disabled={isLoading || !bus.dvrIp}
                  >
                    {isLoading && !isCapturing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verificando...
                      </>
                    ) : (
                      <>
                        <Camera className="mr-2 h-4 w-4" />
                        Cargar imagen
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => captureFrame(countingChannel, true)}
                    disabled={isLoading || !bus.dvrIp}
                    title="Forzar nueva captura desde el DVR"
                  >
                    {isCapturing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {captureProgress > 0 && (
                  <div className="space-y-2">
                    <Progress value={captureProgress} className="h-2" />
                    <p className="text-center text-xs text-muted-foreground">{captureStatus}</p>
                  </div>
                )}
              </div>

              {/* Right: Preview with draggable line */}
              <div className="space-y-2">
                <Label>Vista previa</Label>
                <div
                  ref={containerRef}
                  className="relative aspect-[9/16] w-full overflow-hidden rounded-lg border bg-muted"
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  {isLoading && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80">
                      <Loader2 className="mb-3 h-10 w-10 animate-spin text-primary" />
                      <p className="text-sm font-medium">{captureStatus || 'Cargando...'}</p>
                      <Progress value={captureProgress} className="mt-3 h-2 w-3/4" />
                    </div>
                  )}

                  {snapshotUrl ? (
                    <img
                      src={snapshotUrl}
                      alt="Camera preview"
                      className="h-full w-full object-contain"
                      draggable={false}
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                      <Camera className="mb-2 h-12 w-12 opacity-50" />
                      <p className="text-sm">Sin captura</p>
                      <p className="text-xs">Selecciona una camara para cargar la imagen</p>
                    </div>
                  )}

                  {/* Draggable counting line */}
                  {snapshotUrl && !isLoading && (
                    <div
                      className={`absolute cursor-move ${
                        orientation === 'vertical' ? 'top-0 h-full w-1' : 'left-0 h-1 w-full'
                      }`}
                      style={
                        orientation === 'vertical'
                          ? { left: `${String(linePosition)}%`, transform: 'translateX(-50%)' }
                          : { top: `${String(linePosition)}%`, transform: 'translateY(-50%)' }
                      }
                      onMouseDown={handleMouseDown}
                    >
                      <div
                        className={`${
                          orientation === 'vertical' ? 'h-full w-1' : 'h-1 w-full'
                        } bg-yellow-400 shadow-lg`}
                      />
                      <div
                        className={`absolute flex items-center justify-center rounded-full bg-yellow-400 shadow-lg ${
                          orientation === 'vertical'
                            ? 'left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2'
                            : 'left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2'
                        }`}
                      >
                        {orientation === 'vertical' ? (
                          <GripVertical className="h-4 w-4 text-yellow-900" />
                        ) : (
                          <GripHorizontal className="h-4 w-4 text-yellow-900" />
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Arrastra la linea amarilla para posicionarla donde cruzan los pasajeros
                </p>
              </div>
            </div>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* TAB: NOVEDADES */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <TabsContent value="novelty" className="space-y-4">
            {/* Existing Configurations */}
            {noveltyConfigs.length > 0 && (
              <div className="space-y-3">
                <Label className="text-base">
                  Novedades configuradas ({String(noveltyConfigs.length)})
                </Label>
                <div className="space-y-2">
                  {noveltyConfigs.map((config) => {
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
                                  handleToggleNoveltyActive(config.id)
                                }}
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => {
                                  handleRemoveNoveltyConfig(config.id)
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
                            {typeInfo.showMaxPersonas && (
                              <div>
                                <span className="text-muted-foreground">Max personas:</span>{' '}
                                <span className="font-medium">{config.maxPersonas}</span>
                              </div>
                            )}
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
            {noveltyConfigs.length === 0 && !isAddingNew && (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8 text-muted-foreground">
                <AlertTriangle className="mb-3 h-12 w-12 opacity-50" />
                <p className="text-sm">No hay novedades configuradas</p>
                <p className="text-xs">
                  Agrega una configuracion para empezar a detectar novedades
                </p>
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
                      <Select value={newChannel} onValueChange={setNewChannel}>
                        <SelectTrigger>
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

                    {/* Max personas - only for pasajero_cabina */}
                    {NOVELTY_TYPES[newNoveltyType].showMaxPersonas && (
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
                    )}

                    {/* Tiempo minimo in minutes */}
                    <div className="space-y-2">
                      <Label>Tiempo minimo (minutos)</Label>
                      <Input
                        type="number"
                        value={newTiempoMin}
                        onChange={(e) => {
                          setNewTiempoMin(Number(e.target.value))
                        }}
                        min={1}
                        max={30}
                      />
                      <p className="text-xs text-muted-foreground">
                        Tiempo que debe mantenerse la condicion antes de alertar
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsAddingNew(false)
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button onClick={handleAddNoveltyConfig}>
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
            {noveltyConfigs.length > 0 && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-900 dark:bg-yellow-950">
                <div className="flex gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800 dark:text-yellow-200">
                      Servicio de deteccion
                    </p>
                    <p className="text-yellow-700 dark:text-yellow-300">
                      El servicio de deteccion de novedades debe estar ejecutandose en el servidor.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

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
