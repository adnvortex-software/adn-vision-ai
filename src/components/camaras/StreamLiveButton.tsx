import { Play, Radio } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { Camara } from '@/types/bus'
import type { Entity } from '@/types/firestore'

interface StreamLiveButtonProps {
  camara: Entity<Camara>
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
}

/**
 * Placeholder component for live streaming functionality.
 * In the future, this will integrate with a WebRTC or HLS streaming solution
 * to provide real-time video feeds from the bus cameras.
 */
export function StreamLiveButton({
  camara,
  variant = 'outline',
  size = 'default',
  className,
}: StreamLiveButtonProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={cn(className)}
          disabled={!camara.habilitada}
        >
          <Play className="mr-2 h-4 w-4" />
          En Vivo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-red-500" />
            {camara.nombre} - En Vivo
          </DialogTitle>
          <DialogDescription>
            Canal {camara.canal} - {camara.perfil}
          </DialogDescription>
        </DialogHeader>

        <div className="aspect-video overflow-hidden rounded-lg bg-black">
          {/* Placeholder for future stream implementation */}
          <div className="flex h-full flex-col items-center justify-center gap-4 text-white">
            <div className="flex items-center gap-2">
              <Radio className="h-8 w-8 animate-pulse text-red-500" />
              <span className="text-lg font-medium">Transmision en Vivo</span>
            </div>
            <div className="max-w-md text-center text-sm text-gray-400">
              <p>Esta funcion estara disponible proximamente.</p>
              <p className="mt-2">
                El streaming en vivo requiere integracion con el servidor de procesamiento y una
                conexion WebRTC o HLS.
              </p>
            </div>
            <div className="mt-4 rounded-lg bg-gray-800 px-4 py-2 text-xs text-gray-400">
              <code>RTSP: {camara.rtspUrl}</code>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'h-2 w-2 rounded-full',
                camara.habilitada ? 'bg-green-500' : 'bg-gray-500'
              )}
            />
            <span>{camara.habilitada ? 'Camara activa' : 'Camara deshabilitada'}</span>
          </div>
          <span>
            {camara.resolucionInferenciaW}x{camara.resolucionInferenciaH} @ {camara.fpsInferencia}{' '}
            FPS
          </span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
