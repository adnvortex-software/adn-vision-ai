import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import {
  Loader2,
  Camera,
  RotateCcw,
  Save,
  GripVertical,
  GripHorizontal,
  RefreshCw,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { updateBus } from '@/services/buses.service'
import type { BusConDetalles } from '@/types/bus'

interface BusCountingConfigModalProps {
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

interface CheckSnapshotResponse {
  exists: boolean
  snapshotUrl: string | null
}

export function BusCountingConfigModal({
  bus,
  open,
  onOpenChange,
  onUpdated,
}: BusCountingConfigModalProps) {
  const { toast } = useToast()
  const containerRef = useRef<HTMLDivElement>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [isCheckingCache, setIsCheckingCache] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [captureProgress, setCaptureProgress] = useState(0)
  const [captureStatus, setCaptureStatus] = useState('')

  // Configuration state
  const [enabled, setEnabled] = useState(false)
  const [channel, setChannel] = useState('1')
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('vertical')
  const [linePosition, setLinePosition] = useState(50) // Percentage 0-100
  const [aforoMax, setAforoMax] = useState(45)
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null)
  const [frameWidth, setFrameWidth] = useState(960)
  const [frameHeight, setFrameHeight] = useState(1080)
  const [isCached, setIsCached] = useState(false)

  // Dragging state
  const [isDragging, setIsDragging] = useState(false)

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

  // Get current camera name
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
      setEnabled(bus.countingEnabled ?? false)
      setChannel(String(bus.countingCameraChannel ?? 1))
      setOrientation(bus.countingLineOrientation ?? 'vertical')
      setAforoMax(bus.aforoMax ?? 45)
      setSnapshotUrl(bus.countingSnapshotUrl ?? null)

      // Calculate percentage from pixel position
      if (bus.countingLinePosition !== undefined) {
        const maxDimension =
          bus.countingLineOrientation === 'vertical'
            ? ((bus as unknown as { countingFrameWidth?: number }).countingFrameWidth ?? 960)
            : ((bus as unknown as { countingFrameHeight?: number }).countingFrameHeight ?? 1080)
        setLinePosition((bus.countingLinePosition / maxDimension) * 100)
      } else {
        setLinePosition(50)
      }
    }
  }, [bus])

  // Check if snapshot exists in cache
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

  // Capture frame function
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

      // First check cache unless forcing capture
      if (!forceCapture) {
        setIsCheckingCache(true)
        setCaptureStatus('Verificando cache...')
        setCaptureProgress(10)

        const cachedUrl = await checkSnapshotCache(channelNum)
        if (cachedUrl) {
          setSnapshotUrl(cachedUrl)
          setIsCached(true)
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
      setIsCached(false)
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
        setIsCached(data.cached ?? false)

        setCaptureProgress(100)
        setCaptureStatus(data.cached ? 'Imagen cargada desde cache' : 'Captura exitosa')

        toast({
          title: data.cached ? 'Imagen cargada' : 'Captura exitosa',
          description: data.cached
            ? `Imagen del canal ${channelNum} cargada desde cache`
            : `Frame del canal ${channelNum} capturado y guardado`,
        })

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
          description:
            error instanceof Error
              ? error.message
              : 'No se pudo capturar el frame. Verifica la conexion al DVR.',
          variant: 'destructive',
        })
      } finally {
        setIsCapturing(false)
      }
    },
    [bus, toast, checkSnapshotCache, getCurrentCameraName]
  )

  // Handle channel change - load cached or capture new frame
  const handleChannelChange = useCallback(
    (newChannel: string) => {
      setChannel(newChannel)
      setSnapshotUrl(null)
      setIsCached(false)
      void captureFrame(newChannel, false) // Don't force, check cache first
    },
    [captureFrame]
  )

  // Force recapture button handler
  const handleRecapture = useCallback(() => {
    void captureFrame(channel, true) // Force capture, ignore cache
  }, [captureFrame, channel])

  // Initial capture when modal opens with existing channel
  const handleInitialCapture = useCallback(() => {
    void captureFrame(channel, false)
  }, [captureFrame, channel])

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

  const handleSave = async () => {
    if (!bus) return

    setIsSaving(true)
    try {
      // Convert percentage to pixel position
      const maxDimension = orientation === 'vertical' ? frameWidth : frameHeight
      const pixelPosition = Math.round((linePosition / 100) * maxDimension)

      await updateBus(bus.id, {
        countingEnabled: enabled,
        countingCameraChannel: parseInt(channel),
        countingLinePosition: pixelPosition,
        countingLineOrientation: orientation,
        aforoMax: aforoMax,
      })

      toast({
        title: 'Configuracion guardada',
        description: 'La configuracion de conteo ha sido actualizada',
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
            <Camera className="h-5 w-5" />
            Configurar Conteo - {bus.placa}
          </DialogTitle>
          <DialogDescription>
            Configura la camara y la linea de conteo de pasajeros
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Left: Configuration options */}
          <div className="space-y-4">
            {/* Enable/Disable */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label>Conteo habilitado</Label>
                <p className="text-sm text-muted-foreground">Activar el conteo de pasajeros</p>
              </div>
              <Switch checked={enabled} onCheckedChange={setEnabled} />
            </div>

            {/* Camera Channel */}
            <div className="space-y-2">
              <Label>Camara de conteo</Label>
              <Select value={channel} onValueChange={handleChannelChange} disabled={isLoading}>
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
              {(bus.camarasNombres ?? []).length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No hay camaras configuradas, mostrando canales por defecto
                </p>
              )}
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
              <p className="text-xs text-muted-foreground">
                {orientation === 'vertical'
                  ? 'Detecta cruces de izquierda a derecha'
                  : 'Detecta cruces de arriba a abajo'}
              </p>
            </div>

            {/* Line Position (manual input) */}
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
                onClick={handleInitialCapture}
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
                onClick={handleRecapture}
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

            {/* Progress bar */}
            {captureProgress > 0 && (
              <div className="space-y-2">
                <Progress value={captureProgress} className="h-2" />
                <p className="text-center text-xs text-muted-foreground">{captureStatus}</p>
              </div>
            )}

            {!bus.dvrIp && (
              <p className="text-xs text-destructive">
                Configura la IP del DVR en la edicion del vehiculo
              </p>
            )}

            {isCached && snapshotUrl && (
              <p className="text-xs text-muted-foreground">
                <RotateCcw className="mr-1 inline h-3 w-3" />
                Imagen cargada desde cache. Usa el boton de refrescar para tomar una nueva.
              </p>
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
                  {/* Line */}
                  <div
                    className={`${
                      orientation === 'vertical' ? 'h-full w-1' : 'h-1 w-full'
                    } bg-yellow-400 shadow-lg`}
                  />
                  {/* Handle */}
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

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
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
