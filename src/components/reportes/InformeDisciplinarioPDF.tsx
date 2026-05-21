/**
 * InformeDisciplinarioPDF - Informe Disciplinario formal
 *
 * Replica la estructura exacta del informe de COLFENIX GPS:
 * - Header con logo, empresa, NIT, título, consecutivo y fecha
 * - Datos del cliente (Operador, Placa, Número interno)
 * - Saludo formal y texto introductorio
 * - Novedad numerada con descripción detallada
 * - Sección de pruebas con screenshots
 * - Sección de derechos y disclaimer legal
 * - Cierre con firmas
 */

import { Document, Page, View, Text, Image, StyleSheet, Font, pdf } from '@react-pdf/renderer'
import type { EventoConDetalles } from '@/types/novedad'

// Register fonts
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

// Styles matching the COLFENIX GPS report structure
const styles = StyleSheet.create({
  page: {
    padding: 40,
    paddingBottom: 60,
    fontFamily: 'Inter',
    fontSize: 10,
    color: '#1f2937',
    backgroundColor: '#ffffff',
  },
  // Header styles
  headerContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#000000',
  },
  logoSection: {
    width: 100,
    padding: 10,
    borderRightWidth: 1,
    borderRightColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  logoSubtext: {
    fontSize: 6,
    color: '#6b7280',
    marginTop: 2,
  },
  companySection: {
    flex: 1,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  companyName: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  companyNit: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
  },
  reportTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 4,
  },
  metaSection: {
    width: 100,
    padding: 10,
    borderLeftWidth: 1,
    borderLeftColor: '#000000',
    justifyContent: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  metaLabel: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  metaValue: {
    fontSize: 9,
  },
  // Client data table
  clientDataHeader: {
    backgroundColor: '#f3f4f6',
    padding: 6,
    borderWidth: 1,
    borderColor: '#000000',
    marginBottom: 0,
  },
  clientDataHeaderText: {
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  clientDataRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#000000',
  },
  clientDataCell: {
    flex: 1,
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: '#000000',
  },
  clientDataCellLast: {
    flex: 1,
    padding: 8,
  },
  clientDataLabel: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  clientDataValue: {
    fontSize: 9,
    marginTop: 2,
  },
  // Main content sections
  section: {
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#000000',
  },
  sectionContent: {
    padding: 12,
  },
  greeting: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  introText: {
    fontSize: 10,
    lineHeight: 1.4,
  },
  // Novedad section
  novedadHeader: {
    backgroundColor: '#f3f4f6',
    padding: 8,
    borderWidth: 1,
    borderColor: '#000000',
    marginTop: 15,
  },
  novedadHeaderText: {
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  novedadContent: {
    padding: 12,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#000000',
  },
  novedadTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  novedadDescription: {
    fontSize: 10,
    lineHeight: 1.5,
    textAlign: 'justify',
  },
  // Pruebas section
  pruebasSection: {
    marginTop: 15,
  },
  pruebasTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  pruebasIntro: {
    fontSize: 10,
    marginBottom: 12,
  },
  screenshotContainer: {
    borderWidth: 1,
    borderColor: '#000000',
    padding: 10,
    marginBottom: 10,
  },
  screenshotLabel: {
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: 'bold',
  },
  screenshot: {
    width: '100%',
    maxHeight: 250,
    objectFit: 'contain',
  },
  screenshotPlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#9ca3af',
    fontSize: 10,
  },
  // Derechos section
  derechosSection: {
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#000000',
    padding: 12,
  },
  derechosTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  derechosText: {
    fontSize: 9,
    lineHeight: 1.4,
    textAlign: 'justify',
  },
  // Legal disclaimer
  disclaimerSection: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#000000',
    padding: 12,
  },
  disclaimerText: {
    fontSize: 8,
    lineHeight: 1.4,
    textAlign: 'justify',
    color: '#374151',
  },
  disclaimerHighlight: {
    fontWeight: 'bold',
  },
  // Closing section
  closingSection: {
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#000000',
    padding: 12,
  },
  closingText: {
    fontSize: 10,
    marginBottom: 20,
  },
  atentamente: {
    fontSize: 10,
    marginBottom: 30,
  },
  firmaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  firma: {
    width: '45%',
    textAlign: 'center',
  },
  firmaLinea: {
    borderTopWidth: 1,
    borderTopColor: '#000000',
    marginBottom: 4,
  },
  firmaNombre: {
    fontSize: 9,
    fontWeight: 'bold',
    marginTop: 4,
  },
  firmaEmpresa: {
    fontSize: 8,
    color: '#6b7280',
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#9ca3af',
  },
})

// Report data interface
export interface InformeDisciplinarioData {
  // Número consecutivo del informe
  consecutivo: number
  // Fecha del informe
  fecha: Date
  // Empresa que genera el informe
  empresa: {
    nombre: string
    nit: string
  }
  // Cliente destinatario
  cliente: {
    nombre: string
    razonSocial: string
  }
  // Datos del vehículo/operador
  operador: {
    nombre: string
    cedula?: string
  }
  vehiculo: {
    placa: string
    numeroInterno?: string
    ruta?: string
  }
  // Novedad
  novedad: {
    numero: number
    titulo: string
    descripcion: string
    fecha: Date
    hora: string
  }
  // Screenshots
  screenshotInicio?: string
  screenshotFin?: string
}

// Helper to format date in Spanish
function formatFechaEspanol(date: Date): string {
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  const meses = [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre',
  ]

  const dia = dias[date.getDay()] ?? ''
  const diaNum = date.getDate()
  const mes = meses[date.getMonth()] ?? ''
  const anio = date.getFullYear()

  return `${dia} ${String(diaNum)} de ${mes} del ${String(anio)}`
}

function formatFechaCorta(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${String(year)}-${month}-${day}`
}

// Main PDF Document
function InformeDisciplinarioPDFDocument({ data }: { data: InformeDisciplinarioData }) {
  const {
    consecutivo,
    fecha,
    empresa,
    cliente,
    operador,
    vehiculo,
    novedad,
    screenshotInicio,
    screenshotFin,
  } = data

  // Build description paragraph
  const descripcionCompleta = `${formatFechaEspanol(novedad.fecha)}, siendo las ${novedad.hora} horas, ${novedad.descripcion}`

  return (
    <Document>
      {/* Page 1 */}
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.logoSection}>
            <Text style={styles.logoText}>ADN VISION</Text>
            <Text style={styles.logoSubtext}>AI MONITORING</Text>
          </View>
          <View style={styles.companySection}>
            <Text style={styles.companyName}>{empresa.nombre}</Text>
            <Text style={styles.companyNit}>NIT. {empresa.nit}</Text>
            <Text style={styles.reportTitle}>INFORME DISCIPLINARIO</Text>
          </View>
          <View style={styles.metaSection}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>No. </Text>
              <Text style={styles.metaValue}>{consecutivo}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Fecha </Text>
              <Text style={styles.metaValue}>{formatFechaCorta(fecha)}</Text>
            </View>
          </View>
        </View>

        {/* Client Data */}
        <View style={styles.clientDataHeader}>
          <Text style={styles.clientDataHeaderText}>Datos del cliente</Text>
        </View>
        <View style={styles.clientDataRow}>
          <View style={styles.clientDataCell}>
            <Text style={styles.clientDataLabel}>Operador :</Text>
            <Text style={styles.clientDataValue}>{operador.nombre}</Text>
          </View>
          <View style={styles.clientDataCell}>
            <Text style={styles.clientDataLabel}>Placa:</Text>
            <Text style={styles.clientDataValue}>{vehiculo.placa}</Text>
          </View>
          <View style={styles.clientDataCellLast}>
            <Text style={styles.clientDataLabel}>Numero interno :</Text>
            <Text style={styles.clientDataValue}>{vehiculo.numeroInterno ?? '-'}</Text>
          </View>
        </View>

        {/* Greeting */}
        <View style={styles.section}>
          <View style={styles.sectionContent}>
            <Text style={styles.greeting}>RESPETADOS SEÑORES</Text>
            <Text style={styles.introText}>
              Se presenta el siguiente informe /novedad para los fines determinados :
            </Text>
          </View>
        </View>

        {/* Novedad */}
        <View style={styles.novedadHeader}>
          <Text style={styles.novedadHeaderText}>NOVEDAD {novedad.numero}</Text>
        </View>
        <View style={styles.novedadContent}>
          <Text style={styles.novedadTitle}>
            {novedad.numero}- {novedad.titulo}
          </Text>
          <Text style={styles.novedadDescription}>{descripcionCompleta}</Text>
        </View>

        {/* Pruebas */}
        <View style={styles.pruebasSection}>
          <Text style={styles.pruebasTitle}>II - PRUEBAS:</Text>
          <Text style={styles.pruebasIntro}>
            Para el presente informe , se tengan las siguientes :
          </Text>

          <View style={styles.screenshotContainer}>
            <Text style={styles.screenshotLabel}>Inicio de la novedad</Text>
            {screenshotInicio ? (
              <Image src={screenshotInicio} style={styles.screenshot} />
            ) : (
              <View style={styles.screenshotPlaceholder}>
                <Text style={styles.placeholderText}>Sin captura disponible</Text>
              </View>
            )}
          </View>
        </View>

        <Text style={styles.footer}>ADN VISION AI - Sistema de Monitoreo de Flotas</Text>
      </Page>

      {/* Page 2 */}
      <Page size="A4" style={styles.page}>
        {/* Screenshot Fin */}
        <View style={styles.screenshotContainer}>
          <Text style={styles.screenshotLabel}>Fin de la novedad</Text>
          {screenshotFin ? (
            <Image src={screenshotFin} style={styles.screenshot} />
          ) : screenshotInicio ? (
            <Image src={screenshotInicio} style={styles.screenshot} />
          ) : (
            <View style={styles.screenshotPlaceholder}>
              <Text style={styles.placeholderText}>Sin captura disponible</Text>
            </View>
          )}
        </View>

        {/* Derechos */}
        <View style={styles.derechosSection}>
          <Text style={styles.derechosTitle}>DERECHOS :</Text>
          <Text style={styles.derechosText}>
            Como fundamento para los efectos que contienen este escrito , a potestad de los
            descargos se citaran las que correspondan .
          </Text>
        </View>

        {/* Legal Disclaimer */}
        <View style={styles.disclaimerSection}>
          <Text style={styles.disclaimerText}>
            En apoyo del avance tecnológico para el control y seguimiento de vehículos , basado en
            las políticas de seguridad de los usuarios y control de procesos internos , a su vez
            respeta la administración y protección de datos de conformidad con lo previsto en la{' '}
            <Text style={styles.disclaimerHighlight}>LEY 1581 DEL 17 DE OCTUBRE DE 2012</Text> , se
            presenta informe , aportando además a la{' '}
            <Text style={styles.disclaimerHighlight}>
              RESPONSABILIDAD SOCIAL EMPRESARIAL {empresa.nombre}
            </Text>{' '}
            , respetando la autonomía . Cabe decir además que sus funcionarios /analistas no tienen
            injerencia en las decisiones tomadas por el cliente .
          </Text>
        </View>

        {/* Closing */}
        <View style={styles.closingSection}>
          <Text style={styles.closingText}>
            Sirvase tomar este informe , en los terminos y para los fines correspondientes .
          </Text>
          <Text style={styles.atentamente}>Atentamente ,</Text>

          <View style={styles.firmaContainer}>
            <View style={styles.firma}>
              <View style={styles.firmaLinea} />
              <Text style={styles.firmaNombre}>{cliente.nombre}</Text>
              <Text style={styles.firmaEmpresa}>{cliente.razonSocial}</Text>
            </View>
            <View style={styles.firma}>
              <View style={styles.firmaLinea} />
              <Text style={styles.firmaNombre}>{empresa.nombre}</Text>
              <Text style={styles.firmaEmpresa}>Sistema de Monitoreo</Text>
            </View>
          </View>
        </View>

        <Text style={styles.footer}>ADN VISION AI - Sistema de Monitoreo de Flotas</Text>
      </Page>
    </Document>
  )
}

// Convert EventoConDetalles to InformeDisciplinarioData
export function eventToInformeDisciplinario(
  evento: EventoConDetalles,
  options: {
    consecutivo: number
    empresa: { nombre: string; nit: string }
    cliente: { nombre: string; razonSocial: string }
    operador: { nombre: string; cedula?: string }
    vehiculo: { placa: string; numeroInterno?: string; ruta?: string }
  }
): InformeDisciplinarioData {
  // Extract timestamp
  let eventoFecha = new Date()
  let eventoHora = '00:00:00'

  if (typeof evento.timestamp === 'object' && 'toDate' in evento.timestamp) {
    const date = (evento.timestamp as { toDate: () => Date }).toDate()
    eventoFecha = date
    eventoHora = date.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
  }

  // Build description from event data
  const descripcionBase = evento.notas ?? `se observa ${evento.novedadNombre ?? evento.tipoNovedad}`

  return {
    consecutivo: options.consecutivo,
    fecha: new Date(),
    empresa: options.empresa,
    cliente: options.cliente,
    operador: options.operador,
    vehiculo: options.vehiculo,
    novedad: {
      numero: 1,
      titulo: evento.novedadNombre ?? evento.tipoNovedad,
      descripcion: descripcionBase,
      fecha: eventoFecha,
      hora: eventoHora,
    },
    screenshotInicio: evento.screenshotUrl ?? undefined,
    screenshotFin: evento.screenshotUrl ?? undefined,
  }
}

// Generate PDF blob
export async function generateInformeDisciplinarioPDF(
  data: InformeDisciplinarioData
): Promise<Blob> {
  const doc = <InformeDisciplinarioPDFDocument data={data} />
  return pdf(doc).toBlob()
}

// Generate filename
export function getInformeDisciplinarioFilename(data: InformeDisciplinarioData): string {
  const fecha = formatFechaCorta(data.fecha)
  return `Informe_Novedad_Consecutivo_${String(data.consecutivo)}_${fecha}.pdf`
}

// Export the component for preview
export { InformeDisciplinarioPDFDocument }
