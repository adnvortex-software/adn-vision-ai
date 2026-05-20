/**
 * ReportePDF - PDF Generation using @react-pdf/renderer
 *
 * This is a placeholder component. Full implementation requires:
 * 1. @react-pdf/renderer package
 * 2. Custom PDF Document components
 * 3. Server-side or client-side PDF generation logic
 *
 * For now, we export type definitions and placeholder components
 * that can be implemented when the PDF generation feature is ready.
 */

import type { EventoConDetalles } from '@/types/novedad'
import type { ConteoDiario } from '@/types/novedad'

// Report data types
export interface ReporteNovedadesData {
  tipo: 'novedades'
  fechaInicio: Date
  fechaFin: Date
  cliente: {
    nombre: string
    nit: string
  }
  eventos: EventoConDetalles[]
  resumen: {
    totalEventos: number
    porTipo: Record<string, number>
    porEstado: Record<string, number>
  }
}

export interface ReporteConteoData {
  tipo: 'conteo'
  fechaInicio: Date
  fechaFin: Date
  cliente: {
    nombre: string
    nit: string
  }
  buses: Array<{
    placa: string
    conteos: ConteoDiario[]
    totales: {
      entradas: number
      salidas: number
      aforoMaximo: number
    }
  }>
}

export interface ReporteConsolidadoData {
  tipo: 'consolidado'
  fechaInicio: Date
  fechaFin: Date
  cliente: {
    nombre: string
    nit: string
  }
  flota: {
    totalBuses: number
    busesActivos: number
    novedadesPeriodo: number
    entradasTotales: number
    salidasTotales: number
  }
  topNovedades: Array<{
    tipo: string
    cantidad: number
  }>
  topBusesPorConteo: Array<{
    placa: string
    entradas: number
    salidas: number
  }>
}

export type ReporteData = ReporteNovedadesData | ReporteConteoData | ReporteConsolidadoData

// Placeholder for PDF generation
// In production, this would use @react-pdf/renderer
export function generateReportePDF(_data: ReporteData): Promise<Blob | null> {
  // TODO: Implement with @react-pdf/renderer
  // Example structure:
  // const doc = (
  //   <Document>
  //     <Page>
  //       <ReporteHeader cliente={data.cliente} />
  //       <ReporteBody data={data} />
  //       <ReporteFooter />
  //     </Page>
  //   </Document>
  // )
  // return pdf(doc).toBlob()

  console.warn('PDF generation not implemented yet')
  return Promise.resolve(null)
}

// Placeholder for getting report title
export function getReporteTitulo(tipo: ReporteData['tipo']): string {
  const titulos: Record<ReporteData['tipo'], string> = {
    novedades: 'Reporte de Novedades',
    conteo: 'Reporte de Conteo de Pasajeros',
    consolidado: 'Reporte Consolidado de Operación',
  }
  return titulos[tipo]
}

// Placeholder for formatting report filename
export function getReporteFilename(data: ReporteData): string {
  const { tipo, fechaInicio, fechaFin, cliente } = data
  const startStr = fechaInicio.toISOString().split('T')[0] ?? ''
  const endStr = fechaFin.toISOString().split('T')[0] ?? ''
  const clienteSlug = cliente.nombre.toLowerCase().replace(/\s+/g, '_')
  return `${tipo}_${clienteSlug}_${startStr}_${endStr}.pdf`
}
