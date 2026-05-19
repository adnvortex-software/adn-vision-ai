import { useState } from 'react'
import { Camera, Loader2, RefreshCw, Download, ZoomIn, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { Camara } from '@/types/bus'
import type { Entity } from '@/types/firestore'

interface ScreenshotCaptureProps {
  camara: Entity<Camara>
  onCapture: () => Promise<string | null>
  className?: string
}

export function ScreenshotCapture({ camara, onCapture, className }: ScreenshotCaptureProps) {
  const [isCapturing, setIsCapturing] = useState(false)
  const [capturedUrl, setCapturedUrl] = useState<string | null>(camara.ultimoScreenshot)
  const [showPreview, setShowPreview] = useState(false)

  const handleCapture = async () => {
    setIsCapturing(true)
    try {
      const url = await onCapture()
      if (url) {
        setCapturedUrl(url)
      }
    } finally {
      setIsCapturing(false)
    }
  }

  const handleDownload = () => {
    if (capturedUrl) {
      const link = document.createElement('a')
      link.href = capturedUrl
      link.download = `${camara.nombre}_${new Date().toISOString()}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <>
      <div className={cn('space-y-3', className)}>
        {/* Preview area */}
        <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
          {capturedUrl ? (
            <>
              <img
                src={capturedUrl}
                alt={`Captura de ${camara.nombre}`}
                className="h-full w-full object-cover"
              />
              <Button
                variant="secondary"
                size="icon"
                className="absolute right-2 top-2 h-8 w-8"
                onClick={() => {
                  setShowPreview(true)
                }}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2">
              <Camera className="h-12 w-12 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">Sin captura disponible</p>
            </div>
          )}

          {/* Capturing overlay */}
          {isCapturing && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="flex flex-col items-center gap-2 text-white">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="text-sm">Capturando...</span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="default"
            size="sm"
            className="flex-1"
            onClick={() => {
              void handleCapture()
            }}
            disabled={isCapturing || !camara.habilitada}
          >
            {isCapturing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Capturando...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Nueva Captura
              </>
            )}
          </Button>
          {capturedUrl && (
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Descargar
            </Button>
          )}
        </div>

        {/* Camera info */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{camara.nombre}</span>
          <span>Canal {camara.canal}</span>
        </div>
      </div>

      {/* Full preview dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{camara.nombre}</DialogTitle>
            <DialogDescription>
              Canal {camara.canal} - {camara.perfil}
            </DialogDescription>
          </DialogHeader>
          {capturedUrl && (
            <div className="relative">
              <img
                src={capturedUrl}
                alt={`Captura de ${camara.nombre}`}
                className="w-full rounded-lg"
              />
              <Button
                variant="secondary"
                size="icon"
                className="absolute right-2 top-2"
                onClick={() => {
                  setShowPreview(false)
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Descargar
            </Button>
            <Button
              onClick={() => {
                void handleCapture()
              }}
              disabled={isCapturing}
            >
              {isCapturing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Capturando...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Nueva Captura
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
