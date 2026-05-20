import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import {
  ReporteFiltros,
  ReportePreview,
  type ReporteFiltrosData,
  type ReporteData,
} from '@/components/reportes'
import type { Sucursal } from '@/types/cliente'
import type { BusConDetalles } from '@/types/bus'
import type { Entity } from '@/types/firestore'

// Mock data - replace with actual data fetching
const mockSucursales: Entity<Sucursal>[] = []
const mockBuses: BusConDetalles[] = []

export default function ReporteNovedadesPage() {
  const navigate = useNavigate()
  const [isGenerando, setIsGenerando] = useState(false)
  const [reporteData, setReporteData] = useState<ReporteData | null>(null)

  const handleGenerar = async (filtros: ReporteFiltrosData) => {
    setIsGenerando(true)
    try {
      // TODO: Implement actual report generation
      // TODO: Generate novedades report with filters
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Mock report data
      setReporteData({
        tipo: 'novedades',
        fechaInicio: filtros.fechaInicio,
        fechaFin: filtros.fechaFin,
        cliente: {
          nombre: 'Cliente Demo',
          nit: '900123456-1',
        },
        eventos: [],
        resumen: {
          totalEventos: 0,
          porTipo: {},
          porEstado: {},
        },
      })
    } finally {
      setIsGenerando(false)
    }
  }

  return (
    <div className="container mx-auto space-y-6 py-6">
      <PageHeader
        title={
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6" />
            Reporte de Novedades
          </div>
        }
        description="Genera reportes de eventos detectados por tipo y estado"
        actions={
          <Button
            variant="outline"
            onClick={() => {
              navigate('/reportes')
            }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <ReporteFiltros
            sucursales={mockSucursales}
            buses={mockBuses}
            onGenerar={(filtros) => {
              void handleGenerar(filtros)
            }}
            isGenerando={isGenerando}
          />
        </div>
        <div className="lg:col-span-2">
          <ReportePreview
            data={reporteData}
            isLoading={isGenerando}
            onRefresh={() => {
              if (reporteData) {
                void handleGenerar({
                  tipo: reporteData.tipo,
                  fechaInicio: reporteData.fechaInicio,
                  fechaFin: reporteData.fechaFin,
                  busIds: [],
                })
              }
            }}
          />
        </div>
      </div>
    </div>
  )
}
