import { useState, useEffect, useCallback, useRef } from 'react'
import { Video, RefreshCw, Camera, Loader2, X, Maximize2, Minimize2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { BusConDetalles } from '@/types/bus'

interface BusLiveStreamModalProps {
  bus: BusConDetalles | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

// go2rtc API URL - uses cloudflare tunnel in production
const GO2RTC_API_URL =
  (import.meta.env.VITE_GO2RTC_API_URL as string) || 'http://192.168.110.167:1984'

export function BusLiveStreamModal({ bus, open, onOpenChange }: BusLiveStreamModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [channel, setChannel] = useState('1')
  const [isLoading, setIsLoading] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Build camera options from bus data
  const cameraOptions =
    (bus?.camarasNombres ?? []).length > 0
      ? (bus?.camarasNombres ?? []).map((nombre, index) => ({
          value: String(index + 1),
          label: `Canal ${String(index + 1)} - ${nombre}`,
        }))
      : [
          { value: '1', label: 'Canal 1' },
          { value: '2', label: 'Canal 2' },
          { value: '3', label: 'Canal 3' },
          { value: '4', label: 'Canal 4' },
        ]

  // Build stream name for go2rtc
  const getStreamName = useCallback(
    (channelNum: string) => {
      if (!bus) return ''
      return `${bus.placa.toLowerCase()}_canal${channelNum}`
    },
    [bus]
  )

  // Build RTSP URL
  const getRtspUrl = useCallback(
    (channelNum: string) => {
      if (!bus?.dvrIp) return ''
      const streamChannel = parseInt(channelNum) * 100 + 1
      const user = bus.dvrUsuario ?? 'admin'
      const password = bus.dvrPassword ?? 'admin'
      return `rtsp://${user}:${password}@${bus.dvrIp}:554/Streaming/Channels/${String(streamChannel)}`
    },
    [bus]
  )

  // Register stream with go2rtc
  const registerStream = useCallback(
    async (channelNum: string) => {
      const streamName = getStreamName(channelNum)
      const rtspUrl = getRtspUrl(channelNum)

      if (!streamName || !rtspUrl) return false

      try {
        // Register the stream with go2rtc
        const response = await fetch(
          `${GO2RTC_API_URL}/api/streams?name=${encodeURIComponent(streamName)}&src=${encodeURIComponent(rtspUrl)}`,
          { method: 'PUT' }
        )
        return response.ok
      } catch (err) {
        console.error('Error registering stream:', err)
        return false
      }
    },
    [getStreamName, getRtspUrl]
  )

  // Start video stream using MSE
  const startStream = useCallback(
    async (channelNum: string) => {
      if (!bus || !videoRef.current) return

      setIsLoading(true)
      setError(null)
      setIsConnected(false)

      try {
        // Register stream first
        await registerStream(channelNum)

        const streamName = getStreamName(channelNum)
        const video = videoRef.current

        // Use MSE stream endpoint
        const streamUrl = `${GO2RTC_API_URL}/api/stream.mp4?src=${encodeURIComponent(streamName)}`

        // For browsers that support MSE
        if ('MediaSource' in window) {
          video.src = streamUrl
          video.load()

          video.onloadeddata = () => {
            setIsConnected(true)
            setIsLoading(false)
            video.play().catch(console.error)
          }

          video.onerror = () => {
            setError('Error al cargar el stream. Verifica que el DVR esté conectado.')
            setIsLoading(false)
          }
        } else {
          setError('Tu navegador no soporta streaming de video')
          setIsLoading(false)
        }
      } catch (err) {
        console.error('Stream error:', err)
        setError('Error al conectar con el servidor de streaming')
        setIsLoading(false)
      }
    },
    [bus, registerStream, getStreamName]
  )

  // Stop video stream
  const stopStream = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.src = ''
      videoRef.current.load()
    }
    setIsConnected(false)
  }, [])

  // Handle channel change
  const handleChannelChange = useCallback(
    (newChannel: string) => {
      setChannel(newChannel)
      stopStream()
      void startStream(newChannel)
    },
    [stopStream, startStream]
  )

  // Start stream when modal opens
  // Start stream when modal opens
  useEffect(() => {
    if (open && bus) {
      void startStream(channel)
    } else {
      stopStream()
    }

    return () => {
      stopStream()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, bus])

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!videoRef.current) return

    if (!document.fullscreenElement) {
      videoRef.current.requestFullscreen().catch(console.error)
      setIsFullscreen(true)
    } else {
      document.exitFullscreen().catch(console.error)
      setIsFullscreen(false)
    }
  }, [])

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  if (!bus) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Stream en Vivo - {bus.placa}
          </DialogTitle>
          <DialogDescription>
            Visualiza el video en tiempo real de las camaras del vehiculo
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Camera selector */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label>Camara</Label>
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
            </div>
            <div className="flex gap-2 pt-5">
              <Button
                variant="outline"
                size="icon"
                onClick={() => void startStream(channel)}
                disabled={isLoading}
                title="Reconectar"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={toggleFullscreen}
                disabled={!isConnected}
                title="Pantalla completa"
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Video container */}
          <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-black">
            {isLoading && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/80">
                <Loader2 className="mb-3 h-10 w-10 animate-spin text-white" />
                <p className="text-sm text-white">Conectando al stream...</p>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/80">
                <X className="mb-3 h-10 w-10 text-red-500" />
                <p className="text-sm text-white">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => void startStream(channel)}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reintentar
                </Button>
              </div>
            )}

            {!isLoading && !error && !isConnected && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                <Camera className="mb-2 h-12 w-12 opacity-50" />
                <p className="text-sm">Sin conexion</p>
              </div>
            )}

            <video
              ref={videoRef}
              className="h-full w-full object-contain"
              autoPlay
              muted
              playsInline
              controls={isConnected}
            />
          </div>

          {/* Connection status */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
              />
              <span className="text-muted-foreground">
                {isConnected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
            {bus.dvrIp && <span className="text-muted-foreground">DVR: {bus.dvrIp}</span>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
