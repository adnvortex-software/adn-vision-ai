import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db } from '@/config/firebase'
import type { Entity, PaginatedQuery, PaginatedResult, FirestoreDocData } from '@/types/firestore'

const REPORTES_COLLECTION = 'reportes'

/**
 * Tipos de reporte
 */
export type TipoReporte = 'diario' | 'semanal' | 'mensual' | 'evento' | 'custom'

/**
 * Estado del reporte
 */
export type EstadoReporte = 'pendiente' | 'procesando' | 'completado' | 'error'

/**
 * Reporte generado
 */
export interface Reporte {
  tipo: TipoReporte
  clienteId: string
  sucursalId: string | null
  busId: string | null
  titulo: string
  descripcion: string | null
  fechaInicio: Date
  fechaFin: Date
  estado: EstadoReporte
  pdfUrl: string | null
  errorMensaje: string | null
  parametros: Record<string, unknown>
  solicitadoPor: string
  completadoAt: Date | null
}

/**
 * Datos para solicitar reporte
 */
export interface SolicitarReporteData {
  tipo: TipoReporte
  clienteId: string
  sucursalId?: string
  busId?: string
  titulo: string
  descripcion?: string
  fechaInicio: Date
  fechaFin: Date
  parametros?: Record<string, unknown>
}

/**
 * Obtiene un reporte por ID
 */
export async function getReporte(reporteId: string): Promise<Entity<Reporte> | null> {
  const docRef = doc(db, REPORTES_COLLECTION, reporteId)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) {
    return null
  }

  const data = docSnap.data() as FirestoreDocData

  return {
    id: docSnap.id,
    tipo: data.tipo as TipoReporte,
    clienteId: data.clienteId as string,
    sucursalId: data.sucursalId as string | null,
    busId: data.busId as string | null,
    titulo: data.titulo as string,
    descripcion: data.descripcion as string | null,
    fechaInicio: (data.fechaInicio as Timestamp).toDate(),
    fechaFin: (data.fechaFin as Timestamp).toDate(),
    estado: data.estado as EstadoReporte,
    pdfUrl: data.pdfUrl as string | null,
    errorMensaje: data.errorMensaje as string | null,
    parametros: data.parametros as Record<string, unknown>,
    solicitadoPor: data.solicitadoPor as string,
    completadoAt: data.completadoAt ? (data.completadoAt as Timestamp).toDate() : null,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    createdBy: data.createdBy as string,
    deleted: data.deleted as boolean | undefined,
  } as Entity<Reporte>
}

/**
 * Lista reportes con paginación y filtros
 */
export async function listReportes(
  options: PaginatedQuery & {
    clienteId?: string
    tipo?: TipoReporte
    estado?: EstadoReporte
    fechaDesde?: Date
    fechaHasta?: Date
  } = {}
): Promise<PaginatedResult<Entity<Reporte>>> {
  const { limit: pageLimit = 20, clienteId, tipo, estado, fechaDesde, fechaHasta } = options

  let q = query(
    collection(db, REPORTES_COLLECTION),
    where('deleted', '!=', true),
    orderBy('createdAt', 'desc'),
    limit(pageLimit + 1)
  )

  if (clienteId) {
    q = query(q, where('clienteId', '==', clienteId))
  }

  if (tipo) {
    q = query(q, where('tipo', '==', tipo))
  }

  if (estado) {
    q = query(q, where('estado', '==', estado))
  }

  if (fechaDesde) {
    q = query(q, where('fechaInicio', '>=', Timestamp.fromDate(fechaDesde)))
  }

  if (fechaHasta) {
    q = query(q, where('fechaFin', '<=', Timestamp.fromDate(fechaHasta)))
  }

  const snapshot = await getDocs(q)
  const docs = snapshot.docs.slice(0, pageLimit)
  const hasMore = snapshot.docs.length > pageLimit

  const data = docs.map((docSnap) => {
    const docData = docSnap.data() as FirestoreDocData
    return {
      id: docSnap.id,
      tipo: docData.tipo as TipoReporte,
      clienteId: docData.clienteId as string,
      sucursalId: docData.sucursalId as string | null,
      busId: docData.busId as string | null,
      titulo: docData.titulo as string,
      descripcion: docData.descripcion as string | null,
      fechaInicio: (docData.fechaInicio as Timestamp).toDate(),
      fechaFin: (docData.fechaFin as Timestamp).toDate(),
      estado: docData.estado as EstadoReporte,
      pdfUrl: docData.pdfUrl as string | null,
      errorMensaje: docData.errorMensaje as string | null,
      parametros: docData.parametros as Record<string, unknown>,
      solicitadoPor: docData.solicitadoPor as string,
      completadoAt: docData.completadoAt ? (docData.completadoAt as Timestamp).toDate() : null,
      createdAt: docData.createdAt,
      updatedAt: docData.updatedAt,
      createdBy: docData.createdBy as string,
      deleted: docData.deleted as boolean | undefined,
    } as Entity<Reporte>
  })

  return {
    data,
    hasMore,
    lastDoc: docs[docs.length - 1]?.id,
  }
}

/**
 * Solicita generación de un nuevo reporte
 * El reporte será procesado por un Cloud Function
 */
export async function solicitarReporte(
  data: SolicitarReporteData,
  solicitadoPor: string
): Promise<string> {
  const docRef = await addDoc(collection(db, REPORTES_COLLECTION), {
    tipo: data.tipo,
    clienteId: data.clienteId,
    sucursalId: data.sucursalId ?? null,
    busId: data.busId ?? null,
    titulo: data.titulo,
    descripcion: data.descripcion ?? null,
    fechaInicio: Timestamp.fromDate(data.fechaInicio),
    fechaFin: Timestamp.fromDate(data.fechaFin),
    estado: 'pendiente' as EstadoReporte,
    pdfUrl: null,
    errorMensaje: null,
    parametros: data.parametros ?? {},
    solicitadoPor,
    completadoAt: null,
    deleted: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return docRef.id
}

/**
 * Actualiza estado de reporte (usado por Cloud Functions)
 */
export async function updateReporteEstado(
  reporteId: string,
  estado: EstadoReporte,
  pdfUrl?: string,
  errorMensaje?: string
): Promise<void> {
  const docRef = doc(db, REPORTES_COLLECTION, reporteId)

  const updateData: Record<string, unknown> = {
    estado,
    updatedAt: serverTimestamp(),
  }

  if (pdfUrl) {
    updateData.pdfUrl = pdfUrl
  }

  if (errorMensaje) {
    updateData.errorMensaje = errorMensaje
  }

  if (estado === 'completado' || estado === 'error') {
    updateData.completadoAt = serverTimestamp()
  }

  await updateDoc(docRef, updateData)
}

/**
 * Lista reportes pendientes (para Cloud Functions)
 */
export async function listReportesPendientes(): Promise<Entity<Reporte>[]> {
  const q = query(
    collection(db, REPORTES_COLLECTION),
    where('estado', '==', 'pendiente'),
    where('deleted', '!=', true),
    orderBy('createdAt'),
    limit(10)
  )

  const snapshot = await getDocs(q)

  const reportes = snapshot.docs.map((docSnap) => {
    const docData = docSnap.data() as FirestoreDocData
    return {
      id: docSnap.id,
      tipo: docData.tipo as TipoReporte,
      clienteId: docData.clienteId as string,
      sucursalId: docData.sucursalId as string | null,
      busId: docData.busId as string | null,
      titulo: docData.titulo as string,
      descripcion: docData.descripcion as string | null,
      fechaInicio: (docData.fechaInicio as Timestamp).toDate(),
      fechaFin: (docData.fechaFin as Timestamp).toDate(),
      estado: docData.estado as EstadoReporte,
      pdfUrl: docData.pdfUrl as string | null,
      errorMensaje: docData.errorMensaje as string | null,
      parametros: docData.parametros as Record<string, unknown>,
      solicitadoPor: docData.solicitadoPor as string,
      completadoAt: docData.completadoAt ? (docData.completadoAt as Timestamp).toDate() : null,
      createdAt: docData.createdAt,
      updatedAt: docData.updatedAt,
      createdBy: docData.createdBy as string,
      deleted: docData.deleted as boolean | undefined,
    } as Entity<Reporte>
  })
  return reportes
}

/**
 * Elimina (soft delete) un reporte
 */
export async function deleteReporte(reporteId: string): Promise<void> {
  const docRef = doc(db, REPORTES_COLLECTION, reporteId)
  await updateDoc(docRef, {
    deleted: true,
    updatedAt: serverTimestamp(),
  })
}

// ============ REPORTES PREDEFINIDOS ============

/**
 * Solicita reporte diario de conteos
 */
export async function solicitarReporteDiarioConteos(
  clienteId: string,
  fecha: Date,
  solicitadoPor: string,
  sucursalId?: string
): Promise<string> {
  const fechaStr = fecha.toISOString().split('T')[0] ?? ''

  return solicitarReporte(
    {
      tipo: 'diario',
      clienteId,
      sucursalId,
      titulo: `Reporte Diario de Conteos - ${fechaStr}`,
      descripcion: 'Conteos de pasajeros por bus y hora',
      fechaInicio: new Date(fecha.setHours(0, 0, 0, 0)),
      fechaFin: new Date(fecha.setHours(23, 59, 59, 999)),
      parametros: {
        incluirGraficos: true,
        desglosePorBus: true,
        desglosePorHora: true,
      },
    },
    solicitadoPor
  )
}

/**
 * Solicita reporte semanal de novedades
 */
export async function solicitarReporteSemanalNovedades(
  clienteId: string,
  fechaInicio: Date,
  solicitadoPor: string,
  sucursalId?: string
): Promise<string> {
  const fechaFin = new Date(fechaInicio)
  fechaFin.setDate(fechaFin.getDate() + 6)
  fechaFin.setHours(23, 59, 59, 999)

  const fechaInicioStr = fechaInicio.toISOString().split('T')[0] ?? ''
  const fechaFinStr = fechaFin.toISOString().split('T')[0] ?? ''

  return solicitarReporte(
    {
      tipo: 'semanal',
      clienteId,
      sucursalId,
      titulo: `Reporte Semanal de Novedades - ${fechaInicioStr} a ${fechaFinStr}`,
      descripcion: 'Resumen de novedades detectadas durante la semana',
      fechaInicio: new Date(fechaInicio.setHours(0, 0, 0, 0)),
      fechaFin,
      parametros: {
        incluirGraficos: true,
        desglosePorTipoNovedad: true,
        desglosePorBus: true,
        incluirEventosRevisados: true,
      },
    },
    solicitadoPor
  )
}

/**
 * Solicita reporte mensual ejecutivo
 */
export async function solicitarReporteMensual(
  clienteId: string,
  year: number,
  month: number,
  solicitadoPor: string
): Promise<string> {
  const fechaInicio = new Date(year, month - 1, 1, 0, 0, 0, 0)
  const fechaFin = new Date(year, month, 0, 23, 59, 59, 999)

  const monthNames = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ]

  const monthName = monthNames[month - 1] ?? 'Mes'

  return solicitarReporte(
    {
      tipo: 'mensual',
      clienteId,
      titulo: `Reporte Mensual Ejecutivo - ${monthName} ${String(year)}`,
      descripcion: 'Resumen ejecutivo mensual con KPIs y tendencias',
      fechaInicio,
      fechaFin,
      parametros: {
        incluirKPIs: true,
        incluirTendencias: true,
        incluirComparativaMesAnterior: true,
        incluirTopNovedades: true,
        incluirEstadisticasConteo: true,
      },
    },
    solicitadoPor
  )
}
