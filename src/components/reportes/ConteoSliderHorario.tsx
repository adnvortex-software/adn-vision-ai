import { useState, useMemo } from 'react'
import { Clock, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface FranjaHoraria {
  hora: string
  entradas: number
  salidas: number
}

interface ConteoSliderHorarioProps {
  data: FranjaHoraria[]
  fecha: string
  busPlaca?: string
  className?: string
}

export function ConteoSliderHorario({
  data,
  fecha,
  busPlaca,
  className,
}: ConteoSliderHorarioProps) {
  const [selectedHora, setSelectedHora] = useState<string | null>(null)

  // Calculate max value for scaling
  const maxValue = useMemo(() => {
    return Math.max(...data.flatMap((d) => [d.entradas, d.salidas]), 1)
  }, [data])

  // Calculate totals
  const totals = useMemo(() => {
    return data.reduce(
      (acc, d) => ({
        entradas: acc.entradas + d.entradas,
        salidas: acc.salidas + d.salidas,
      }),
      { entradas: 0, salidas: 0 }
    )
  }, [data])

  // Find peak hour
  const peakHour = useMemo(() => {
    let maxTotal = 0
    let peak = ''
    data.forEach((d) => {
      const total = d.entradas + d.salidas
      if (total > maxTotal) {
        maxTotal = total
        peak = d.hora
      }
    })
    return { hora: peak, total: maxTotal }
  }, [data])

  const selectedData = selectedHora ? data.find((d) => d.hora === selectedHora) : null

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Conteo por Hora
        </CardTitle>
        <CardDescription>
          {busPlaca && <span className="font-mono">{busPlaca} - </span>}
          {fecha}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-lg bg-green-50 p-3">
            <div className="text-2xl font-bold text-green-600">{totals.entradas}</div>
            <div className="text-xs text-muted-foreground">Entradas</div>
          </div>
          <div className="rounded-lg bg-red-50 p-3">
            <div className="text-2xl font-bold text-red-600">{totals.salidas}</div>
            <div className="text-xs text-muted-foreground">Salidas</div>
          </div>
          <div className="rounded-lg bg-primary/10 p-3">
            <div className="flex items-center justify-center gap-1">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-lg font-bold text-primary">{peakHour.hora}</span>
            </div>
            <div className="text-xs text-muted-foreground">Hora pico</div>
          </div>
        </div>

        {/* Hour slider/chart */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>6:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>22:00</span>
          </div>

          <div className="flex items-end gap-1">
            {data.map((franja) => {
              const entradasHeight = (franja.entradas / maxValue) * 100
              const salidasHeight = (franja.salidas / maxValue) * 100
              const isSelected = selectedHora === franja.hora

              return (
                <button
                  key={franja.hora}
                  className={cn(
                    'group relative flex flex-1 flex-col items-center gap-0.5 rounded-t transition-all',
                    isSelected && 'bg-muted'
                  )}
                  onClick={() => {
                    setSelectedHora(isSelected ? null : franja.hora)
                  }}
                >
                  {/* Bars */}
                  <div className="flex h-24 w-full items-end justify-center gap-0.5">
                    <div
                      className="w-2 rounded-t bg-green-500 transition-all group-hover:bg-green-600"
                      style={{
                        height: `${String(entradasHeight)}%`,
                        minHeight: franja.entradas > 0 ? '4px' : '0',
                      }}
                    />
                    <div
                      className="w-2 rounded-t bg-red-500 transition-all group-hover:bg-red-600"
                      style={{
                        height: `${String(salidasHeight)}%`,
                        minHeight: franja.salidas > 0 ? '4px' : '0',
                      }}
                    />
                  </div>

                  {/* Hour label */}
                  <span
                    className={cn(
                      'text-[10px] text-muted-foreground',
                      isSelected && 'font-medium text-foreground'
                    )}
                  >
                    {franja.hora.replace(':00', '')}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Selected hour details */}
        {selectedData && (
          <div className="rounded-lg border bg-muted/50 p-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">{selectedData.hora}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedHora(null)
                }}
              >
                Cerrar
              </Button>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-green-500" />
                <span className="text-sm">
                  <span className="font-bold">{selectedData.entradas}</span> entradas
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-red-500" />
                <span className="text-sm">
                  <span className="font-bold">{selectedData.salidas}</span> salidas
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 text-xs">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded bg-green-500" />
            <span className="text-muted-foreground">Entradas</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded bg-red-500" />
            <span className="text-muted-foreground">Salidas</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
