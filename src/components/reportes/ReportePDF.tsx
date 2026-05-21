/**
 * ReportePDF - PDF Generation using @react-pdf/renderer
 *
 * Provides PDF templates for:
 * - Novedades report: Individual event report with screenshot
 * - Conteo report: Passenger count summary
 * - Consolidado report: Fleet operation summary
 */

import { Document, Page, View, Text, Image, StyleSheet, Font, pdf } from '@react-pdf/renderer'
import type { EventoConDetalles, ConteoDiario } from '@/types/novedad'

// Register fonts (Inter is commonly available, fallback to Helvetica)
Font.register({
  family: 'Inter',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2',
    },
    {
      src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hiJ-Ek-_EeA.woff2',
      fontWeight: 'bold',
    },
  ],
})

// Styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Inter',
    fontSize: 10,
    color: '#1f2937',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottom: '1px solid #e5e7eb',
  },
  logo: {
    width: 120,
    height: 40,
  },
  logoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  logoSubtext: {
    fontSize: 8,
    color: '#6b7280',
  },
  headerRight: {
    textAlign: 'right',
  },
  clienteName: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  clienteNit: {
    fontSize: 9,
    color: '#6b7280',
  },
  reportDate: {
    fontSize: 9,
    color: '#6b7280',
    marginTop: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#111827',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#374151',
    backgroundColor: '#f3f4f6',
    padding: 6,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    width: 120,
    fontSize: 9,
    color: '#6b7280',
  },
  value: {
    flex: 1,
    fontSize: 9,
    fontWeight: 'bold',
  },
  screenshot: {
    width: '100%',
    maxHeight: 280,
    objectFit: 'contain',
    marginVertical: 10,
    border: '1px solid #e5e7eb',
  },
  screenshotPlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  placeholderText: {
    color: '#9ca3af',
    fontSize: 12,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTop: '1px solid #e5e7eb',
    fontSize: 8,
    color: '#9ca3af',
  },
  pageNumber: {
    fontSize: 8,
  },
  badge: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
    padding: '2 6',
    fontSize: 8,
    borderRadius: 2,
  },
  badgeDanger: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
  badgeSuccess: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderBottom: '1px solid #e5e7eb',
    padding: 6,
  },
  tableHeaderCell: {
    flex: 1,
    fontSize: 9,
    fontWeight: 'bold',
    color: '#374151',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #f3f4f6',
    padding: 6,
  },
  tableCell: {
    flex: 1,
    fontSize: 9,
  },
  summary: {
    backgroundColor: '#f9fafb',
    padding: 12,
    marginTop: 10,
    borderRadius: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 9,
    color: '#6b7280',
  },
  summaryValue: {
    fontSize: 10,
    fontWeight: 'bold',
  },
})

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

// Single event report data (for individual novedad PDF)
export interface ReporteEventoData {
  evento: EventoConDetalles
  cliente: {
    nombre: string
    nit: string
  }
  bus: {
    placa: string
    ruta: string | null
    tipoVehiculo: string
    sucursal: string
    conductor: string | null
  }
  camara: {
    nombre: string
    perfil: string
  }
}

// Shared components
function ReporteHeader({
  cliente,
  fechaGeneracion,
}: {
  cliente: { nombre: string; nit: string }
  fechaGeneracion: Date
}) {
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.logoText}>ADN VISION AI</Text>
        <Text style={styles.logoSubtext}>Sistema de Monitoreo de Flotas</Text>
      </View>
      <View style={styles.headerRight}>
        <Text style={styles.clienteName}>{cliente.nombre}</Text>
        <Text style={styles.clienteNit}>NIT: {cliente.nit}</Text>
        <Text style={styles.reportDate}>
          Generado: {fechaGeneracion.toLocaleDateString('es-CO')}{' '}
          {fechaGeneracion.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  )
}

function ReporteFooter({
  pageNumber,
  fechaGeneracion,
}: {
  pageNumber?: number
  fechaGeneracion: Date
}) {
  return (
    <View style={styles.footer}>
      <Text>ADN VISION AI - Reporte automatizado</Text>
      <Text>{fechaGeneracion.toLocaleDateString('es-CO')}</Text>
      {pageNumber && <Text style={styles.pageNumber}>Pagina {pageNumber}</Text>}
    </View>
  )
}

function formatTimestamp(timestamp: unknown): string {
  if (!timestamp) return '-'
  try {
    if (typeof timestamp === 'object' && 'toDate' in timestamp) {
      const date = (timestamp as { toDate: () => Date }).toDate()
      return date.toLocaleString('es-CO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    }
    return '-'
  } catch {
    return '-'
  }
}

// Individual event PDF document
function EventoReportePDF({ data }: { data: ReporteEventoData }) {
  const { evento, cliente, bus, camara } = data
  const now = new Date()

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <ReporteHeader cliente={cliente} fechaGeneracion={now} />

        <Text style={styles.title}>
          Reporte de Novedad: {evento.novedadNombre ?? evento.tipoNovedad}
        </Text>

        {/* Event info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informacion del Evento</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Tipo de novedad:</Text>
            <Text style={styles.value}>{evento.novedadNombre ?? evento.tipoNovedad}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Categoria:</Text>
            <Text style={styles.value}>{evento.novedadCategoria ?? '-'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Fecha y hora:</Text>
            <Text style={styles.value}>{formatTimestamp(evento.timestamp)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Estado:</Text>
            <Text style={styles.value}>{evento.estado}</Text>
          </View>
          {evento.notas && (
            <View style={styles.row}>
              <Text style={styles.label}>Notas:</Text>
              <Text style={styles.value}>{evento.notas}</Text>
            </View>
          )}
        </View>

        {/* Vehicle info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos del Vehiculo</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Placa:</Text>
            <Text style={styles.value}>{bus.placa}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Tipo:</Text>
            <Text style={styles.value}>{bus.tipoVehiculo}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Sucursal:</Text>
            <Text style={styles.value}>{bus.sucursal}</Text>
          </View>
          {bus.ruta && (
            <View style={styles.row}>
              <Text style={styles.label}>Ruta:</Text>
              <Text style={styles.value}>{bus.ruta}</Text>
            </View>
          )}
          {bus.conductor && (
            <View style={styles.row}>
              <Text style={styles.label}>Conductor:</Text>
              <Text style={styles.value}>{bus.conductor}</Text>
            </View>
          )}
        </View>

        {/* Camera info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos Tecnicos</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Camara:</Text>
            <Text style={styles.value}>{camara.nombre}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Perfil:</Text>
            <Text style={styles.value}>{camara.perfil}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>ID Evento:</Text>
            <Text style={styles.value}>{evento.id}</Text>
          </View>
        </View>

        {/* Screenshot */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Captura de Pantalla</Text>
          {evento.screenshotUrl ? (
            <Image src={evento.screenshotUrl} style={styles.screenshot} />
          ) : (
            <View style={styles.screenshotPlaceholder}>
              <Text style={styles.placeholderText}>Sin captura disponible</Text>
            </View>
          )}
        </View>

        <ReporteFooter fechaGeneracion={now} />
      </Page>
    </Document>
  )
}

// Novedades summary PDF document
function NovedadesReportePDF({ data }: { data: ReporteNovedadesData }) {
  const now = new Date()
  const { cliente, fechaInicio, fechaFin, eventos, resumen } = data

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <ReporteHeader cliente={cliente} fechaGeneracion={now} />

        <Text style={styles.title}>Reporte de Novedades</Text>

        {/* Period */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Periodo del Reporte</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Desde:</Text>
            <Text style={styles.value}>{fechaInicio.toLocaleDateString('es-CO')}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Hasta:</Text>
            <Text style={styles.value}>{fechaFin.toLocaleDateString('es-CO')}</Text>
          </View>
        </View>

        {/* Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumen</Text>
          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total de eventos:</Text>
              <Text style={styles.summaryValue}>{resumen.totalEventos}</Text>
            </View>
            {Object.entries(resumen.porTipo).map(([tipo, cantidad]) => (
              <View key={tipo} style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{tipo}:</Text>
                <Text style={styles.summaryValue}>{cantidad}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Events table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalle de Eventos</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 0.8 }]}>Fecha</Text>
              <Text style={styles.tableHeaderCell}>Tipo</Text>
              <Text style={[styles.tableHeaderCell, { flex: 0.6 }]}>Placa</Text>
              <Text style={[styles.tableHeaderCell, { flex: 0.6 }]}>Estado</Text>
            </View>
            {eventos.slice(0, 20).map((evento) => (
              <View key={evento.id} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 0.8 }]}>
                  {formatTimestamp(evento.timestamp)}
                </Text>
                <Text style={styles.tableCell}>{evento.novedadNombre ?? evento.tipoNovedad}</Text>
                <Text style={[styles.tableCell, { flex: 0.6 }]}>{evento.busPlaca ?? '-'}</Text>
                <Text style={[styles.tableCell, { flex: 0.6 }]}>{evento.estado}</Text>
              </View>
            ))}
            {eventos.length > 20 && (
              <View style={styles.tableRow}>
                <Text style={styles.tableCell}>... y {eventos.length - 20} eventos mas</Text>
              </View>
            )}
          </View>
        </View>

        <ReporteFooter fechaGeneracion={now} pageNumber={1} />
      </Page>
    </Document>
  )
}

// Conteo summary PDF document
function ConteoReportePDF({ data }: { data: ReporteConteoData }) {
  const now = new Date()
  const { cliente, fechaInicio, fechaFin, buses } = data

  const totales = buses.reduce(
    (acc, bus) => ({
      entradas: acc.entradas + bus.totales.entradas,
      salidas: acc.salidas + bus.totales.salidas,
      aforoMaximo: Math.max(acc.aforoMaximo, bus.totales.aforoMaximo),
    }),
    { entradas: 0, salidas: 0, aforoMaximo: 0 }
  )

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <ReporteHeader cliente={cliente} fechaGeneracion={now} />

        <Text style={styles.title}>Reporte de Conteo de Pasajeros</Text>

        {/* Period */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Periodo del Reporte</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Desde:</Text>
            <Text style={styles.value}>{fechaInicio.toLocaleDateString('es-CO')}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Hasta:</Text>
            <Text style={styles.value}>{fechaFin.toLocaleDateString('es-CO')}</Text>
          </View>
        </View>

        {/* Totals */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Totales del Periodo</Text>
          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total entradas:</Text>
              <Text style={styles.summaryValue}>{totales.entradas.toLocaleString('es-CO')}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total salidas:</Text>
              <Text style={styles.summaryValue}>{totales.salidas.toLocaleString('es-CO')}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Aforo maximo registrado:</Text>
              <Text style={styles.summaryValue}>{totales.aforoMaximo}</Text>
            </View>
          </View>
        </View>

        {/* Buses table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conteo por Vehiculo</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 0.8 }]}>Placa</Text>
              <Text style={styles.tableHeaderCell}>Entradas</Text>
              <Text style={styles.tableHeaderCell}>Salidas</Text>
              <Text style={styles.tableHeaderCell}>Aforo Max</Text>
            </View>
            {buses.map((bus) => (
              <View key={bus.placa} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 0.8, fontWeight: 'bold' }]}>
                  {bus.placa}
                </Text>
                <Text style={styles.tableCell}>{bus.totales.entradas.toLocaleString('es-CO')}</Text>
                <Text style={styles.tableCell}>{bus.totales.salidas.toLocaleString('es-CO')}</Text>
                <Text style={styles.tableCell}>{bus.totales.aforoMaximo}</Text>
              </View>
            ))}
          </View>
        </View>

        <ReporteFooter fechaGeneracion={now} pageNumber={1} />
      </Page>
    </Document>
  )
}

// Consolidated PDF document
function ConsolidadoReportePDF({ data }: { data: ReporteConsolidadoData }) {
  const now = new Date()
  const { cliente, fechaInicio, fechaFin, flota, topNovedades, topBusesPorConteo } = data

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <ReporteHeader cliente={cliente} fechaGeneracion={now} />

        <Text style={styles.title}>Reporte Consolidado de Operacion</Text>

        {/* Period */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Periodo del Reporte</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Desde:</Text>
            <Text style={styles.value}>{fechaInicio.toLocaleDateString('es-CO')}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Hasta:</Text>
            <Text style={styles.value}>{fechaFin.toLocaleDateString('es-CO')}</Text>
          </View>
        </View>

        {/* Fleet summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estado de la Flota</Text>
          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total de buses:</Text>
              <Text style={styles.summaryValue}>{flota.totalBuses}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Buses activos:</Text>
              <Text style={styles.summaryValue}>{flota.busesActivos}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Novedades en periodo:</Text>
              <Text style={styles.summaryValue}>{flota.novedadesPeriodo}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Pasajeros transportados:</Text>
              <Text style={styles.summaryValue}>
                {flota.entradasTotales.toLocaleString('es-CO')}
              </Text>
            </View>
          </View>
        </View>

        {/* Top novedades */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Novedades</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderCell}>Tipo</Text>
              <Text style={[styles.tableHeaderCell, { flex: 0.5 }]}>Cantidad</Text>
            </View>
            {topNovedades.map((item) => (
              <View key={item.tipo} style={styles.tableRow}>
                <Text style={styles.tableCell}>{item.tipo}</Text>
                <Text style={[styles.tableCell, { flex: 0.5 }]}>{item.cantidad}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Top buses por conteo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Buses por Conteo</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 0.8 }]}>Placa</Text>
              <Text style={styles.tableHeaderCell}>Entradas</Text>
              <Text style={styles.tableHeaderCell}>Salidas</Text>
            </View>
            {topBusesPorConteo.map((bus) => (
              <View key={bus.placa} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 0.8 }]}>{bus.placa}</Text>
                <Text style={styles.tableCell}>{bus.entradas.toLocaleString('es-CO')}</Text>
                <Text style={styles.tableCell}>{bus.salidas.toLocaleString('es-CO')}</Text>
              </View>
            ))}
          </View>
        </View>

        <ReporteFooter fechaGeneracion={now} pageNumber={1} />
      </Page>
    </Document>
  )
}

// PDF generation functions
export async function generateEventoReportePDF(data: ReporteEventoData): Promise<Blob> {
  const doc = <EventoReportePDF data={data} />
  return pdf(doc).toBlob()
}

export async function generateReportePDF(data: ReporteData): Promise<Blob> {
  let doc: React.ReactElement

  switch (data.tipo) {
    case 'novedades':
      doc = <NovedadesReportePDF data={data} />
      break
    case 'conteo':
      doc = <ConteoReportePDF data={data} />
      break
    case 'consolidado':
      doc = <ConsolidadoReportePDF data={data} />
      break
    default:
      throw new Error(`Unknown report type`)
  }

  return pdf(doc).toBlob()
}

// Helper to get report title
export function getReporteTitulo(tipo: ReporteData['tipo']): string {
  const titulos: Record<ReporteData['tipo'], string> = {
    novedades: 'Reporte de Novedades',
    conteo: 'Reporte de Conteo de Pasajeros',
    consolidado: 'Reporte Consolidado de Operacion',
  }
  return titulos[tipo]
}

// Helper to format report filename
export function getReporteFilename(data: ReporteData): string {
  const { tipo, fechaInicio, fechaFin, cliente } = data
  const startStr = fechaInicio.toISOString().split('T')[0] ?? ''
  const endStr = fechaFin.toISOString().split('T')[0] ?? ''
  const clienteSlug = cliente.nombre.toLowerCase().replace(/\s+/g, '_')
  return `${tipo}_${clienteSlug}_${startStr}_${endStr}.pdf`
}

// Helper to format event report filename
export function getEventoReporteFilename(data: ReporteEventoData): string {
  const { evento, bus } = data
  const timestamp = evento.timestamp as { toDate?: () => Date } | null
  let dateStr = new Date().toISOString().split('T')[0] ?? ''
  if (timestamp?.toDate) {
    const date = timestamp.toDate()
    dateStr = date.toISOString().split('T')[0] ?? dateStr
  }
  return `novedad_${bus.placa}_${evento.tipoNovedad}_${dateStr}.pdf`
}

// Helper to download a PDF blob
export function downloadPDF(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
