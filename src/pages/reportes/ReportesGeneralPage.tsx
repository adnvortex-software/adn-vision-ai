import { useNavigate } from 'react-router-dom'
import { FileText, BarChart2, AlertTriangle, Download } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface ReporteTipoCard {
  tipo: string
  titulo: string
  descripcion: string
  icon: React.ComponentType<{ className?: string }>
  href: string
}

const reportesTipos: ReporteTipoCard[] = [
  {
    tipo: 'conteo',
    titulo: 'Reporte de Conteo',
    descripcion: 'Conteo de pasajeros por bus, ruta y periodo',
    icon: BarChart2,
    href: '/reportes/conteo',
  },
  {
    tipo: 'novedades',
    titulo: 'Reporte de Novedades',
    descripcion: 'Eventos detectados agrupados por tipo y estado',
    icon: AlertTriangle,
    href: '/reportes/novedades',
  },
  {
    tipo: 'consolidado',
    titulo: 'Reporte Consolidado',
    descripcion: 'Resumen general de operacion con KPIs',
    icon: FileText,
    href: '/reportes/consolidado',
  },
]

export default function ReportesGeneralPage() {
  const navigate = useNavigate()

  return (
    <div className="container mx-auto space-y-6 py-6">
      <PageHeader
        title="Centro de Reportes"
        description="Genera y descarga reportes de tu operacion"
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {reportesTipos.map((reporte) => {
          const Icon = reporte.icon
          return (
            <Card
              key={reporte.tipo}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => {
                navigate(reporte.href)
              }}
            >
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-primary/10 p-3">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{reporte.titulo}</CardTitle>
                    <CardDescription>{reporte.descripcion}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  <FileText className="mr-2 h-4 w-4" />
                  Generar Reporte
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Reportes recientes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Reportes Recientes
          </CardTitle>
          <CardDescription>Ultimos reportes generados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">
            <FileText className="mx-auto h-8 w-8 text-muted-foreground/30" />
            <p className="mt-2 text-sm text-muted-foreground">
              No hay reportes generados recientemente
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
