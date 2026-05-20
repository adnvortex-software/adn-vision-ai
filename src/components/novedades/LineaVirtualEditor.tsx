import { useState, useRef, useCallback, type MouseEvent } from 'react'
import { Undo2, RotateCcw, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import type { LineaVirtual } from '@/types/novedad'
import { cn } from '@/lib/utils'

interface LineaVirtualEditorProps {
  screenshotUrl: string
  initialValue?: LineaVirtual
  onSave: (linea: LineaVirtual) => void
  onCancel?: () => void
  className?: string
}

type Orientacion = LineaVirtual['orientacion']

export function LineaVirtualEditor({
  screenshotUrl,
  initialValue,
  onSave,
  onCancel,
  className,
}: LineaVirtualEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null)
  const [endPoint, setEndPoint] = useState<{ x: number; y: number } | null>(null)
  const [orientacion, setOrientacion] = useState<Orientacion>(
    initialValue?.orientacion ?? 'horizontal'
  )

  // Initialize from existing value
  useState(() => {
    if (initialValue) {
      setStartPoint({ x: initialValue.x1, y: initialValue.y1 })
      setEndPoint({ x: initialValue.x2, y: initialValue.y2 })
    }
  })

  const getNormalizedCoords = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return null
    const rect = containerRef.current.getBoundingClientRect()
    return {
      x: Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)),
    }
  }, [])

  const handleMouseDown = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      const coords = getNormalizedCoords(e)
      if (coords) {
        setIsDrawing(true)
        setStartPoint(coords)
        setEndPoint(null)
      }
    },
    [getNormalizedCoords]
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (!isDrawing) return
      const coords = getNormalizedCoords(e)
      if (coords) {
        setEndPoint(coords)
      }
    },
    [isDrawing, getNormalizedCoords]
  )

  const handleMouseUp = useCallback(() => {
    setIsDrawing(false)
  }, [])

  const handleReset = () => {
    setStartPoint(null)
    setEndPoint(null)
    setIsDrawing(false)
  }

  const handleSave = () => {
    if (startPoint && endPoint) {
      onSave({
        x1: startPoint.x,
        y1: startPoint.y,
        x2: endPoint.x,
        y2: endPoint.y,
        orientacion,
      })
    }
  }

  const hasValidLine = startPoint && endPoint

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>Linea Virtual</CardTitle>
        <CardDescription>
          Dibuja una linea sobre la imagen para detectar cruces de personas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Orientacion selector */}
        <div className="flex items-center gap-4">
          <Label>Orientacion:</Label>
          <Select
            value={orientacion}
            onValueChange={(v) => {
              setOrientacion(v as Orientacion)
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="horizontal">Horizontal</SelectItem>
              <SelectItem value="vertical">Vertical</SelectItem>
              <SelectItem value="diagonal">Diagonal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Drawing area */}
        <div
          ref={containerRef}
          className="relative cursor-crosshair overflow-hidden rounded-lg border"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <img
            src={screenshotUrl}
            alt="Screenshot para dibujar linea virtual"
            className="block w-full"
            draggable={false}
          />

          {/* SVG overlay for drawing */}
          <svg className="pointer-events-none absolute inset-0 h-full w-full">
            {startPoint && endPoint && (
              <>
                {/* Main line */}
                <line
                  x1={`${String(startPoint.x * 100)}%`}
                  y1={`${String(startPoint.y * 100)}%`}
                  x2={`${String(endPoint.x * 100)}%`}
                  y2={`${String(endPoint.y * 100)}%`}
                  stroke="#22c55e"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                {/* Start point */}
                <circle
                  cx={`${String(startPoint.x * 100)}%`}
                  cy={`${String(startPoint.y * 100)}%`}
                  r="6"
                  fill="#22c55e"
                />
                {/* End point */}
                <circle
                  cx={`${String(endPoint.x * 100)}%`}
                  cy={`${String(endPoint.y * 100)}%`}
                  r="6"
                  fill="#22c55e"
                />
                {/* Direction arrow (simplified) */}
                <text
                  x={`${String(((startPoint.x + endPoint.x) / 2) * 100)}%`}
                  y={`${String(((startPoint.y + endPoint.y) / 2) * 100)}%`}
                  fill="white"
                  fontSize="14"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="font-bold"
                  style={{ textShadow: '0 0 3px black' }}
                >
                  {orientacion === 'horizontal' ? '→' : orientacion === 'vertical' ? '↓' : '↘'}
                </text>
              </>
            )}
            {/* Drawing in progress (just start point) */}
            {startPoint && !endPoint && isDrawing && (
              <circle
                cx={`${String(startPoint.x * 100)}%`}
                cy={`${String(startPoint.y * 100)}%`}
                r="6"
                fill="#22c55e"
              />
            )}
          </svg>

          {/* Instructions overlay */}
          {!startPoint && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <p className="rounded bg-black/50 px-4 py-2 text-sm text-white">
                Haz clic y arrastra para dibujar la linea
              </p>
            </div>
          )}
        </div>

        {/* Coordinates display */}
        {hasValidLine && (
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span>
              Inicio: ({(startPoint.x * 100).toFixed(1)}%, {(startPoint.y * 100).toFixed(1)}%)
            </span>
            <span>
              Fin: ({(endPoint.x * 100).toFixed(1)}%, {(endPoint.y * 100).toFixed(1)}%)
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleReset} disabled={!startPoint}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reiniciar
            </Button>
            {onCancel && (
              <Button variant="outline" size="sm" onClick={onCancel}>
                <Undo2 className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
            )}
          </div>
          <Button size="sm" onClick={handleSave} disabled={!hasValidLine}>
            <Check className="mr-2 h-4 w-4" />
            Guardar Linea
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
