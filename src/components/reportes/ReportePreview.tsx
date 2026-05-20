import { useState } from 'react'
import {
  FileText,
  Download,
  Printer,
  RefreshCw,
  Calendar,
  Building2,
  AlertTriangle,
  Users,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import {
  type ReporteData,
  type ReporteNovedadesData,
  type ReporteConteoData,
  type ReporteConsolidadoData,
  getReporteTitulo,
  generateReportePDF,
  getReporteFilename,
} from './ReportePDF'

interface ReportePreviewProps {
  data: ReporteData | null
  isLoading?: boolean
  onRefresh?: () => void
  className?: string
}

export function ReportePreview({
  data,
  isLoading = false,
  onRefresh,
  className,
}: ReportePreviewProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    if (!data) return
    setIsDownloading(true)
    try {
      const blob = await generateReportePDF(data)
      if (blob) {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = getReporteFilename(data)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }
    } finally {
      setIsDownloading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (isLoading) {
    return (
      <Card className={cn(className)}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">Generando reporte...</p>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card className={cn(className)}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground/30" />
          <p className="mt-4 text-sm font-medium">Sin reporte</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Configura los filtros y genera un reporte
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn(className)}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {getReporteTitulo(data.tipo)}
          </CardTitle>
          <CardDescription className="mt-1 space-y-1">
            <div className="flex items-center gap-2">
              <Building2 className="h-3 w-3" />
              {data.cliente.nombre} (NIT: {data.cliente.nit})
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3" />
              {format(data.fechaInicio, "d 'de' MMMM", { locale: es })} -{' '}
              {format(data.fechaFin, "d 'de' MMMM 'de' yyyy", { locale: es })}
            </div>
          </CardDescription>
        </div>
        <div className="flex gap-2">
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            onClick={() => {
              void handleDownload()
            }}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            PDF
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Render based on report type */}
        {data.tipo === 'novedades' && <NovedadesPreview data={data} />}
        {data.tipo === 'conteo' && <ConteoPreview data={data} />}
        {data.tipo === 'consolidado' && <ConsolidadoPreview data={data} />}
      </CardContent>
    </Card>
  )
}

function NovedadesPreview({ data }: { data: ReporteNovedadesData }) {
  return (
    <div className="space-y-4">
      {/* Resumen */}
      <div className="rounded-lg bg-muted/50 p-4">
        <h4 className="font-medium">Resumen</h4>
        <div className="mt-2 grid grid-cols-3 gap-4">
          <div>
            <div className="text-2xl font-bold">{data.resumen.totalEventos}</div>
            <div className="text-xs text-muted-foreground">Total eventos</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{Object.keys(data.resumen.porTipo).length}</div>
            <div className="text-xs text-muted-foreground">Tipos detectados</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {data.resumen.porEstado['resuelto'] ?? 0}
            </div>
            <div className="text-xs text-muted-foreground">Resueltos</div>
          </div>
        </div>
      </div>

      {/* Por tipo */}
      <div>
        <h4 className="font-medium">Por Tipo de Novedad</h4>
        <div className="mt-2 space-y-2">
          {Object.entries(data.resumen.porTipo).map(([tipo, cantidad]) => (
            <div key={tipo} className="flex items-center justify-between rounded-lg border p-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <span className="text-sm">{tipo}</span>
              </div>
              <span className="font-mono font-medium">{cantidad}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ConteoPreview({ data }: { data: ReporteConteoData }) {
  const totalEntradas = data.buses.reduce((sum, b) => sum + b.totales.entradas, 0)
  const totalSalidas = data.buses.reduce((sum, b) => sum + b.totales.salidas, 0)

  return (
    <div className="space-y-4">
      {/* Totales */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg bg-green-50 p-4 text-center">
          <Users className="mx-auto h-6 w-6 text-green-600" />
          <div className="mt-2 text-2xl font-bold text-green-600">{totalEntradas}</div>
          <div className="text-xs text-muted-foreground">Entradas totales</div>
        </div>
        <div className="rounded-lg bg-red-50 p-4 text-center">
          <Users className="mx-auto h-6 w-6 text-red-600" />
          <div className="mt-2 text-2xl font-bold text-red-600">{totalSalidas}</div>
          <div className="text-xs text-muted-foreground">Salidas totales</div>
        </div>
        <div className="rounded-lg bg-muted p-4 text-center">
          <div className="mt-2 text-2xl font-bold">{data.buses.length}</div>
          <div className="text-xs text-muted-foreground">Buses reportados</div>
        </div>
      </div>

      {/* Por bus */}
      <div>
        <h4 className="font-medium">Por Vehiculo</h4>
        <div className="mt-2 space-y-2">
          {data.buses.slice(0, 5).map((bus) => (
            <div
              key={bus.placa}
              className="flex items-center justify-between rounded-lg border p-2"
            >
              <span className="font-mono font-medium">{bus.placa}</span>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-green-600">+{bus.totales.entradas}</span>
                <span className="text-red-600">-{bus.totales.salidas}</span>
              </div>
            </div>
          ))}
          {data.buses.length > 5 && (
            <p className="text-center text-sm text-muted-foreground">
              ... y {data.buses.length - 5} buses mas
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function ConsolidadoPreview({ data }: { data: ReporteConsolidadoData }) {
  return (
    <div className="space-y-4">
      {/* Resumen de flota */}
      <div className="rounded-lg bg-muted/50 p-4">
        <h4 className="font-medium">Estado de la Flota</h4>
        <div className="mt-2 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <div className="text-2xl font-bold">{data.flota.totalBuses}</div>
            <div className="text-xs text-muted-foreground">Total buses</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{data.flota.busesActivos}</div>
            <div className="text-xs text-muted-foreground">Activos</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-600">{data.flota.novedadesPeriodo}</div>
            <div className="text-xs text-muted-foreground">Novedades</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{data.flota.entradasTotales}</div>
            <div className="text-xs text-muted-foreground">Pasajeros</div>
          </div>
        </div>
      </div>

      {/* Top novedades */}
      {data.topNovedades.length > 0 && (
        <div>
          <h4 className="font-medium">Top Novedades</h4>
          <div className="mt-2 space-y-1">
            {data.topNovedades.map((item, i) => (
              <div key={item.tipo} className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">{i + 1}.</span>
                <span className="flex-1">{item.tipo}</span>
                <span className="font-medium">{item.cantidad}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
