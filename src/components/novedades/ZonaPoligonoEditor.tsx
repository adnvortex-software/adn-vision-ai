import { useState, useRef, useCallback, type MouseEvent } from 'react'
import { Undo2, RotateCcw, Check, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LIMITS } from '@/config/constants'
import type { Point2D, ZonaPoligono } from '@/types/novedad'
import { cn } from '@/lib/utils'

interface ZonaPoligonoEditorProps {
  screenshotUrl: string
  initialValue?: ZonaPoligono
  onSave: (zona: ZonaPoligono) => void
  onCancel?: () => void
  className?: string
}

export function ZonaPoligonoEditor({
  screenshotUrl,
  initialValue,
  onSave,
  onCancel,
  className,
}: ZonaPoligonoEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [points, setPoints] = useState<Point2D[]>(initialValue ?? [])
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const getNormalizedCoords = useCallback((e: MouseEvent<HTMLDivElement>): Point2D | null => {
    if (!containerRef.current) return null
    const rect = containerRef.current.getBoundingClientRect()
    return {
      x: Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)),
    }
  }, [])

  const handleClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (points.length >= LIMITS.maxPolygonVertices) return
      const coords = getNormalizedCoords(e)
      if (coords) {
        setPoints((prev) => [...prev, coords])
      }
    },
    [points.length, getNormalizedCoords]
  )

  const handleRemovePoint = (index: number) => {
    setPoints((prev) => prev.filter((_, i) => i !== index))
  }

  const handleReset = () => {
    setPoints([])
    setHoveredIndex(null)
  }

  const handleUndo = () => {
    setPoints((prev) => prev.slice(0, -1))
  }

  const handleSave = () => {
    if (points.length >= LIMITS.minPolygonVertices) {
      onSave(points)
    }
  }

  const isValidPolygon = points.length >= LIMITS.minPolygonVertices

  // Generate SVG path for polygon
  const polygonPath =
    points.length > 1
      ? points
          .map((p, i) => `${i === 0 ? 'M' : 'L'} ${String(p.x * 100)}% ${String(p.y * 100)}%`)
          .join(' ') + ' Z'
      : ''

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>Zona de Deteccion</CardTitle>
        <CardDescription>
          Haz clic para agregar puntos y definir el area de monitoreo (min{' '}
          {LIMITS.minPolygonVertices}, max {LIMITS.maxPolygonVertices} puntos)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drawing area */}
        <div
          ref={containerRef}
          className="relative cursor-crosshair overflow-hidden rounded-lg border"
          onClick={handleClick}
        >
          <img
            src={screenshotUrl}
            alt="Screenshot para dibujar zona"
            className="block w-full"
            draggable={false}
          />

          {/* SVG overlay */}
          <svg className="pointer-events-none absolute inset-0 h-full w-full">
            {/* Filled polygon */}
            {points.length > 2 && (
              <path d={polygonPath} fill="rgba(34, 197, 94, 0.3)" stroke="none" />
            )}

            {/* Polygon outline */}
            {points.length > 1 && (
              <path d={polygonPath} fill="none" stroke="#22c55e" strokeWidth="2" />
            )}

            {/* Lines connecting points (when not yet a polygon) */}
            {points.length >= 2 &&
              points
                .slice(0, -1)
                .map((p, i) => (
                  <line
                    key={`line-${String(i)}`}
                    x1={`${String(p.x * 100)}%`}
                    y1={`${String(p.y * 100)}%`}
                    x2={`${String(points[i + 1].x * 100)}%`}
                    y2={`${String(points[i + 1].y * 100)}%`}
                    stroke="#22c55e"
                    strokeWidth="2"
                  />
                ))}

            {/* Points */}
            {points.map((p, i) => (
              <g
                key={i}
                className="pointer-events-auto cursor-pointer"
                onMouseEnter={() => {
                  setHoveredIndex(i)
                }}
                onMouseLeave={() => {
                  setHoveredIndex(null)
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemovePoint(i)
                }}
              >
                <circle
                  cx={`${String(p.x * 100)}%`}
                  cy={`${String(p.y * 100)}%`}
                  r={hoveredIndex === i ? 10 : 6}
                  fill={hoveredIndex === i ? '#ef4444' : '#22c55e'}
                  stroke="white"
                  strokeWidth="2"
                />
                {/* Point number */}
                <text
                  x={`${String(p.x * 100)}%`}
                  y={`${String(p.y * 100)}%`}
                  fill="white"
                  fontSize="10"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="pointer-events-none font-bold"
                >
                  {i + 1}
                </text>
              </g>
            ))}
          </svg>

          {/* Instructions overlay */}
          {points.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <p className="rounded bg-black/50 px-4 py-2 text-sm text-white">
                Haz clic para agregar puntos del poligono
              </p>
            </div>
          )}

          {/* Max points warning */}
          {points.length >= LIMITS.maxPolygonVertices && (
            <div className="absolute bottom-2 left-2 right-2 rounded bg-amber-500/90 px-2 py-1 text-center text-xs text-white">
              Maximo de puntos alcanzado
            </div>
          )}
        </div>

        {/* Point count */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {points.length} / {LIMITS.maxPolygonVertices} puntos
          </span>
          {points.length > 0 && (
            <span className="text-xs text-muted-foreground">
              Haz clic en un punto para eliminarlo
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleUndo} disabled={points.length === 0}>
              <Undo2 className="mr-2 h-4 w-4" />
              Deshacer
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={points.length === 0}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reiniciar
            </Button>
            {onCancel && (
              <Button variant="ghost" size="sm" onClick={onCancel}>
                Cancelar
              </Button>
            )}
          </div>
          <Button size="sm" onClick={handleSave} disabled={!isValidPolygon}>
            <Check className="mr-2 h-4 w-4" />
            Guardar Zona
          </Button>
        </div>

        {/* Minimum points warning */}
        {points.length > 0 && points.length < LIMITS.minPolygonVertices && (
          <p className="text-center text-xs text-amber-600">
            <Plus className="mr-1 inline h-3 w-3" />
            Agrega al menos {LIMITS.minPolygonVertices - points.length} punto(s) mas
          </p>
        )}
      </CardContent>
    </Card>
  )
}
