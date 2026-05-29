import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Play, CheckCircle, AlertCircle, Loader2, Database } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/stores/auth.store'
import {
  backfillAllConteos,
  listBusesWithConteos,
  type BackfillProgress,
} from '@/services/conteos.service'

export default function BackfillConteosPage() {
  const navigate = useNavigate()
  const { usuario } = useAuthStore()
  const [isRunning, setIsRunning] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [results, setResults] = useState<BackfillProgress[] | null>(null)
  const [busCount, setBusCount] = useState<number | null>(null)

  const addLog = useCallback((msg: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs((prev) => [...prev, `[${timestamp}] ${msg}`])
  }, [])

  // Solo super_admin puede acceder
  if (usuario?.rol !== 'super_admin') {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardContent className="py-10">
            <div className="flex flex-col items-center gap-4 text-center">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <h2 className="text-xl font-semibold">Acceso Denegado</h2>
              <p className="text-muted-foreground">
                Solo los super administradores pueden acceder a esta página.
              </p>
              <Button
                onClick={() => {
                  navigate('/')
                }}
              >
                Volver al Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleCheckBuses = async () => {
    try {
      const buses = await listBusesWithConteos()
      setBusCount(buses.length)
      addLog(`Encontrados ${String(buses.length)} buses con datos de conteo`)
      buses.forEach((bus) => {
        addLog(`  - ${bus.busId} (cliente: ${bus.clienteId || 'sin cliente'})`)
      })
    } catch (error) {
      addLog(`Error al verificar buses: ${error instanceof Error ? error.message : 'Error'}`)
    }
  }

  const handleRunBackfill = async () => {
    if (isRunning) return

    setIsRunning(true)
    setResults(null)
    addLog('=== INICIANDO BACKFILL ===')

    try {
      const backfillResults = await backfillAllConteos(addLog)
      setResults(backfillResults)
      addLog('=== BACKFILL COMPLETADO ===')
    } catch (error) {
      addLog(`ERROR FATAL: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    } finally {
      setIsRunning(false)
    }
  }

  const totalDias = results?.reduce((sum, r) => sum + r.diasProcesados, 0) ?? 0
  const totalEventos = results?.reduce((sum, r) => sum + r.totalEventos, 0) ?? 0
  const busesConError = results?.filter((r) => r.status === 'error').length ?? 0

  return (
    <div className="container mx-auto space-y-6 py-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            navigate(-1)
          }}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Backfill de Conteos</h1>
          <p className="text-muted-foreground">
            Reconstruye la colección conteosDiarios desde los eventos históricos
          </p>
        </div>
      </div>

      {/* Warning */}
      <Card className="border-amber-500 bg-amber-50 dark:bg-amber-950">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <div className="text-sm">
              <p className="font-medium text-amber-800 dark:text-amber-200">
                Operación de Mantenimiento
              </p>
              <p className="text-amber-700 dark:text-amber-300">
                Este proceso lee todos los eventos de conteo y los agrupa por día en la colección
                conteosDiarios. Es seguro ejecutarlo múltiples veces ya que sobreescribe los
                documentos existentes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4">
        <Button variant="outline" onClick={handleCheckBuses} disabled={isRunning}>
          <Database className="mr-2 h-4 w-4" />
          Verificar Buses
        </Button>
        <Button onClick={handleRunBackfill} disabled={isRunning}>
          {isRunning ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Play className="mr-2 h-4 w-4" />
          )}
          {isRunning ? 'Ejecutando...' : 'Ejecutar Backfill'}
        </Button>
      </div>

      {/* Stats */}
      {(busCount !== null || results) && (
        <div className="grid gap-4 sm:grid-cols-4">
          {busCount !== null && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Buses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{busCount}</div>
              </CardContent>
            </Card>
          )}
          {results && (
            <>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Días Procesados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-600">{totalDias}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Eventos Totales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalEventos}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Errores</CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className={`text-2xl font-bold ${busesConError > 0 ? 'text-red-600' : 'text-emerald-600'}`}
                  >
                    {busesConError}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {/* Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isRunning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : results ? (
              <CheckCircle className="h-4 w-4 text-emerald-600" />
            ) : null}
            Registro de Operaciones
          </CardTitle>
          <CardDescription>Salida del proceso de backfill</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] overflow-y-auto rounded-md border bg-muted/30 p-4">
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Haz clic en "Verificar Buses" para ver los datos disponibles, luego "Ejecutar
                Backfill" para reconstruir los conteos diarios.
              </p>
            ) : (
              <pre className="whitespace-pre-wrap font-mono text-xs">{logs.join('\n')}</pre>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Detail */}
      {results && results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Detalle por Bus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {results.map((r) => (
                <div
                  key={r.busId}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    {r.status === 'completed' ? (
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="font-mono text-sm">{r.busId}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{r.totalEventos} eventos</span>
                    <span>{r.diasProcesados} días</span>
                    {r.fechas.length > 0 && (
                      <span>
                        {r.fechas[0]} → {r.fechas[r.fechas.length - 1]}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
