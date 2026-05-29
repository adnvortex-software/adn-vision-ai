#!/usr/bin/env node
/**
 * Script para ejecutar el backfill de conteosDiarios
 * Lee todos los eventos de conteos/{busId}/eventos y los agrupa por fecha
 *
 * Uso: node scripts/backfill-conteos.mjs
 */

import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Cargar credenciales
const serviceAccountPath = join(__dirname, '..', 'adn-lynx-fb-firebase-adminsdk-fbsvc-d3ec607a23.json')
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'))

// Inicializar Firebase Admin
initializeApp({
  credential: cert(serviceAccount)
})

const db = getFirestore()

// Colecciones
const CONTEOS_COLLECTION = 'conteos'
const CONTEOS_DIARIOS_COLLECTION = 'conteosDiarios'

/**
 * Formatea una fecha a YYYY-MM-DD
 */
function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Formatea una fecha a HH (hora)
 */
function formatHour(date) {
  return String(date.getHours()).padStart(2, '0')
}

/**
 * Obtiene todos los eventos de un bus
 */
async function getAllEventos(busId) {
  const eventosRef = db.collection(CONTEOS_COLLECTION).doc(busId).collection('eventos')
  const snapshot = await eventosRef.orderBy('timestamp', 'asc').get()

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }))
}

/**
 * Agrupa eventos por fecha
 */
function aggregateEventosByDate(eventos, busId, clienteId) {
  const dailyData = new Map()

  for (const evento of eventos) {
    if (!evento.timestamp) continue

    const date = evento.timestamp.toDate()
    const fecha = formatDate(date)
    const hora = formatHour(date)

    if (!dailyData.has(fecha)) {
      dailyData.set(fecha, {
        busId,
        clienteId,
        fecha,
        totalEntradas: 0,
        totalSalidas: 0,
        aforoMaximoDia: 0,
        franjasHorarias: {}
      })
    }

    const dayData = dailyData.get(fecha)

    // Actualizar totales
    if (evento.tipo === 'entrada') {
      dayData.totalEntradas++
    } else {
      dayData.totalSalidas++
    }

    // Actualizar aforo maximo
    if ((evento.aforoTrasEvento || 0) > dayData.aforoMaximoDia) {
      dayData.aforoMaximoDia = evento.aforoTrasEvento || 0
    }

    // Actualizar franjas horarias
    if (!dayData.franjasHorarias[hora]) {
      dayData.franjasHorarias[hora] = { entradas: 0, salidas: 0 }
    }
    if (evento.tipo === 'entrada') {
      dayData.franjasHorarias[hora].entradas++
    } else {
      dayData.franjasHorarias[hora].salidas++
    }
  }

  return dailyData
}

/**
 * Escribe un ConteoDiario en Firestore
 */
async function writeConteoDiario(data) {
  const docId = `${data.busId}_${data.fecha}`
  await db.collection(CONTEOS_DIARIOS_COLLECTION).doc(docId).set(data)
}

/**
 * Ejecuta backfill para un bus
 */
async function backfillBus(busId, clienteId) {
  console.log(`\n[${busId}] Iniciando backfill...`)

  // Obtener todos los eventos
  const eventos = await getAllEventos(busId)
  console.log(`[${busId}] ${eventos.length} eventos encontrados`)

  if (eventos.length === 0) {
    console.log(`[${busId}] Sin eventos para procesar`)
    return { busId, totalEventos: 0, diasProcesados: 0, fechas: [] }
  }

  // Agrupar por fecha
  const dailyData = aggregateEventosByDate(eventos, busId, clienteId)
  console.log(`[${busId}] ${dailyData.size} dias encontrados`)

  // Escribir cada dia
  const fechas = []
  for (const [fecha, data] of dailyData) {
    await writeConteoDiario(data)
    fechas.push(fecha)
    console.log(`[${busId}] Dia ${fecha}: ${data.totalEntradas} entradas, ${data.totalSalidas} salidas`)
  }

  console.log(`[${busId}] Backfill completado`)
  return { busId, totalEventos: eventos.length, diasProcesados: dailyData.size, fechas }
}

/**
 * Ejecuta backfill para todos los buses
 */
async function backfillAll() {
  console.log('=== INICIANDO BACKFILL DE CONTEOS ===\n')

  // Obtener lista de buses con conteos
  const conteosSnapshot = await db.collection(CONTEOS_COLLECTION).get()
  const buses = conteosSnapshot.docs.map(doc => ({
    busId: doc.id,
    clienteId: doc.data().clienteId || ''
  }))

  console.log(`${buses.length} buses encontrados con conteos\n`)

  const results = []
  for (const bus of buses) {
    const result = await backfillBus(bus.busId, bus.clienteId)
    results.push(result)
  }

  // Resumen
  const totalDias = results.reduce((sum, r) => sum + r.diasProcesados, 0)
  const totalEventos = results.reduce((sum, r) => sum + r.totalEventos, 0)

  console.log('\n=== RESUMEN ===')
  console.log(`Buses procesados: ${results.length}`)
  console.log(`Total dias: ${totalDias}`)
  console.log(`Total eventos: ${totalEventos}`)

  // Mostrar fechas por bus
  console.log('\n=== DETALLE POR BUS ===')
  for (const r of results) {
    if (r.fechas.length > 0) {
      console.log(`${r.busId}: ${r.fechas.join(', ')}`)
    }
  }

  console.log('\n=== BACKFILL COMPLETADO ===')
}

// Ejecutar
backfillAll()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err)
    process.exit(1)
  })
