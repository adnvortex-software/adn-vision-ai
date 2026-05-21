import { useState, useCallback, useMemo } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  HardDrive,
  Search,
  Download,
  Loader2,
  Calendar as CalendarIcon,
  Clock,
  AlertCircle,
  FileVideo,
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
import { Input } from '@/components/ui/input'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import type { BusConDetalles } from '@/types/bus'

interface BusRecordingsModalProps {
  bus: BusConDetalles | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface Recording {
  startTime: string
  endTime: string
  startTimeFormatted: string
  endTimeFormatted: string
  playbackUri: string | null
  sourceId: string | null
}

interface SearchResponse {
  success: boolean
  count: number
  recordings: Recording[]
  error?: string
}

// Recordings API URL
const RECORDINGS_API_URL =
  (import.meta.env.VITE_RECORDINGS_API_URL as string) || 'http://192.168.110.167:5001'

export function BusRecordingsModal({ bus, open, onOpenChange }: BusRecordingsModalProps) {
  const { toast } = useToast()

  // Search state
  const [channel, setChannel] = useState('1')
  const [searchDate, setSearchDate] = useState<Date | undefined>(new Date())
  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime] = useState('12:00')

  // Results state
  const [isSearching, setIsSearching] = useState(false)
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [searchError, setSearchError] = useState<string | null>(null)

  // Download state
  const [downloadingIndex, setDownloadingIndex] = useState<number | null>(null)
  const [downloadProgress, setDownloadProgress] = useState(0)

  // Build camera options from bus data
  const cameraOptions = useMemo(() => {
    const camaras = bus?.camarasNombres ?? []
    if (camaras.length > 0) {
      return camaras.map((nombre, index) => ({
        value: String(index + 1),
        label: `Canal ${String(index + 1)} - ${nombre}`,
      }))
    }
    return [
      { value: '1', label: 'Canal 1' },
      { value: '2', label: 'Canal 2' },
      { value: '3', label: 'Canal 3' },
      { value: '4', label: 'Canal 4' },
    ]
  }, [bus?.camarasNombres])

  // Search recordings
  const handleSearch = useCallback(async () => {
    if (!bus?.dvrIp || !searchDate) {
      toast({
        title: 'Error',
        description: 'Selecciona una fecha para buscar',
        variant: 'destructive',
      })
      return
    }

    setIsSearching(true)
    setSearchError(null)
    setRecordings([])

    try {
      // Build datetime strings
      const dateStr = format(searchDate, 'yyyy-MM-dd')
      const startDateTime = `${dateStr}T${startTime}:00`
      const endDateTime = `${dateStr}T${endTime}:00`

      const response = await fetch(`${RECORDINGS_API_URL}/recordings/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dvrIp: bus.dvrIp,
          channel: parseInt(channel),
          startTime: startDateTime,
          endTime: endDateTime,
          user: bus.dvrUsuario ?? 'admin',
          password: bus.dvrPassword ?? 'admin',
        }),
      })

      const data = (await response.json()) as SearchResponse

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? 'Error al buscar grabaciones')
      }

      setRecordings(data.recordings)

      if (data.count === 0) {
        toast({
          title: 'Sin resultados',
          description: 'No se encontraron grabaciones en el rango seleccionado',
        })
      } else {
        toast({
          title: 'Busqueda completada',
          description: `Se encontraron ${String(data.count)} grabaciones`,
        })
      }
    } catch (error) {
      console.error('Search error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error al buscar grabaciones'
      setSearchError(errorMessage)
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsSearching(false)
    }
  }, [bus, channel, searchDate, startTime, endTime, toast])

  // Download recording
  const handleDownload = useCallback(
    async (recording: Recording, index: number) => {
      if (!bus?.dvrIp) return

      setDownloadingIndex(index)
      setDownloadProgress(10)

      try {
        const response = await fetch(`${RECORDINGS_API_URL}/recordings/download`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dvrIp: bus.dvrIp,
            channel: parseInt(channel),
            startTime: recording.startTime,
            endTime: recording.endTime,
            user: bus.dvrUsuario ?? 'admin',
            password: bus.dvrPassword ?? 'admin',
          }),
        })

        setDownloadProgress(50)

        if (!response.ok) {
          const errorData = (await response.json()) as { error?: string }
          throw new Error(errorData.error ?? 'Error al descargar')
        }

        setDownloadProgress(80)

        // Get blob and create download link
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${bus.placa}_canal${channel}_${recording.startTimeFormatted.replace(/[:\s]/g, '-')}.mp4`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        setDownloadProgress(100)

        toast({
          title: 'Descarga completada',
          description: 'El archivo se ha descargado correctamente',
        })
      } catch (error) {
        console.error('Download error:', error)
        toast({
          title: 'Error de descarga',
          description: error instanceof Error ? error.message : 'No se pudo descargar la grabacion',
          variant: 'destructive',
        })
      } finally {
        setTimeout(() => {
          setDownloadingIndex(null)
          setDownloadProgress(0)
        }, 1000)
      }
    },
    [bus, channel, toast]
  )

  // Calculate duration between two times
  const calculateDuration = (start: string, end: string): string => {
    try {
      const startDate = new Date(start)
      const endDate = new Date(end)
      const diffMs = endDate.getTime() - startDate.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const hours = Math.floor(diffMins / 60)
      const mins = diffMins % 60
      if (hours > 0) {
        return `${String(hours)}h ${String(mins)}m`
      }
      return `${String(mins)} min`
    } catch {
      return '-'
    }
  }

  if (!bus) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Grabaciones - {bus.placa}
          </DialogTitle>
          <DialogDescription>Busca y descarga grabaciones del DVR del vehiculo</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Search Form */}
          <div className="grid gap-4 rounded-lg border p-4 md:grid-cols-2">
            {/* Camera selector */}
            <div className="space-y-2">
              <Label>Camara</Label>
              <Select value={channel} onValueChange={setChannel}>
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

            {/* Date picker */}
            <div className="space-y-2">
              <Label>Fecha</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !searchDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {searchDate ? format(searchDate, 'PPP', { locale: es }) : 'Seleccionar fecha'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={searchDate} onSelect={setSearchDate} />
                </PopoverContent>
              </Popover>
            </div>

            {/* Start time */}
            <div className="space-y-2">
              <Label>Hora inicio</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => {
                    setStartTime(e.target.value)
                  }}
                  className="pl-10"
                />
              </div>
            </div>

            {/* End time */}
            <div className="space-y-2">
              <Label>Hora fin</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => {
                    setEndTime(e.target.value)
                  }}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Search button */}
            <div className="md:col-span-2">
              <Button
                onClick={handleSearch}
                disabled={isSearching || !bus.dvrIp}
                className="w-full"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Buscando...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Buscar grabaciones
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Error message */}
          {searchError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{searchError}</AlertDescription>
            </Alert>
          )}

          {/* No DVR warning */}
          {!bus.dvrIp && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Este vehiculo no tiene IP de DVR configurada. Configura el DVR primero.
              </AlertDescription>
            </Alert>
          )}

          {/* Results */}
          {recordings.length > 0 && (
            <div className="space-y-3">
              <Label className="text-base">Grabaciones encontradas ({recordings.length})</Label>
              <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border p-2">
                {recordings.map((recording, index) => (
                  <div
                    key={`${recording.startTime}-${String(index)}`}
                    className="flex items-center justify-between rounded-lg border bg-card p-3"
                  >
                    <div className="flex items-center gap-3">
                      <FileVideo className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          {recording.startTimeFormatted} -{' '}
                          {recording.endTimeFormatted.split(' ')[1]}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Duracion: {calculateDuration(recording.startTime, recording.endTime)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {downloadingIndex === index ? (
                        <div className="flex items-center gap-2">
                          <Progress value={downloadProgress} className="h-2 w-20" />
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleDownload(recording, index)}
                          disabled={downloadingIndex !== null}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Descargar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state after search */}
          {!isSearching && recordings.length === 0 && !searchError && (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <HardDrive className="mb-3 h-12 w-12 opacity-50" />
              <p className="text-sm">Selecciona fecha y hora para buscar grabaciones</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
