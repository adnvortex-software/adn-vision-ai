import {
  ref,
  uploadBytes,
  uploadString,
  getDownloadURL,
  deleteObject,
  listAll,
  type UploadMetadata,
} from 'firebase/storage'
import { storage } from '@/config/firebase'

/**
 * Rutas base en Storage
 */
const STORAGE_PATHS = {
  screenshots: 'screenshots',
  videoClips: 'video-clips',
  reportes: 'reportes',
  conductorFotos: 'conductor-fotos',
  profilePhotos: 'profile-photos',
} as const

/**
 * Genera path para screenshot de cámara
 */
function getScreenshotPath(busId: string, camaraId: string, filename: string): string {
  return `${STORAGE_PATHS.screenshots}/${busId}/${camaraId}/${filename}`
}

/**
 * Genera path para video clip
 */
function getVideoClipPath(busId: string, eventoId: string, filename: string): string {
  return `${STORAGE_PATHS.videoClips}/${busId}/${eventoId}/${filename}`
}

/**
 * Genera path para reporte PDF
 */
function getReportePath(clienteId: string, tipo: string, filename: string): string {
  return `${STORAGE_PATHS.reportes}/${clienteId}/${tipo}/${filename}`
}

/**
 * Genera path para foto de conductor
 */
function getConductorFotoPath(conductorId: string, filename: string): string {
  return `${STORAGE_PATHS.conductorFotos}/${conductorId}/${filename}`
}

/**
 * Genera path para foto de perfil
 */
function getProfilePhotoPath(uid: string, filename: string): string {
  return `${STORAGE_PATHS.profilePhotos}/${uid}/${filename}`
}

/**
 * Sube un archivo a Firebase Storage
 */
export async function uploadFile(
  path: string,
  file: File | Blob,
  metadata?: UploadMetadata
): Promise<string> {
  const storageRef = ref(storage, path)
  const snapshot = await uploadBytes(storageRef, file, metadata)
  return getDownloadURL(snapshot.ref)
}

/**
 * Sube una imagen en base64 a Firebase Storage
 */
export async function uploadBase64Image(
  path: string,
  base64Data: string,
  contentType: string = 'image/jpeg'
): Promise<string> {
  const storageRef = ref(storage, path)
  const snapshot = await uploadString(storageRef, base64Data, 'base64', {
    contentType,
  })
  return getDownloadURL(snapshot.ref)
}

/**
 * Obtiene URL de descarga de un archivo
 */
export async function getFileUrl(path: string): Promise<string> {
  const storageRef = ref(storage, path)
  return getDownloadURL(storageRef)
}

/**
 * Elimina un archivo de Storage
 */
export async function deleteFile(path: string): Promise<void> {
  const storageRef = ref(storage, path)
  await deleteObject(storageRef)
}

/**
 * Lista archivos en un directorio
 */
export async function listFiles(path: string): Promise<string[]> {
  const storageRef = ref(storage, path)
  const result = await listAll(storageRef)
  return result.items.map((item) => item.fullPath)
}

// ============ FUNCIONES ESPECÍFICAS ============

/**
 * Sube screenshot de cámara
 */
export async function uploadScreenshot(
  busId: string,
  camaraId: string,
  file: Blob,
  timestamp?: Date
): Promise<string> {
  const date = timestamp ?? new Date()
  const filename = `${String(date.getTime())}.jpg`
  const path = getScreenshotPath(busId, camaraId, filename)

  return uploadFile(path, file, {
    contentType: 'image/jpeg',
    customMetadata: {
      busId,
      camaraId,
      timestamp: date.toISOString(),
    },
  })
}

/**
 * Sube video clip de evento
 */
export async function uploadVideoClip(
  busId: string,
  eventoId: string,
  file: Blob
): Promise<string> {
  const filename = `${String(Date.now())}.mp4`
  const path = getVideoClipPath(busId, eventoId, filename)

  return uploadFile(path, file, {
    contentType: 'video/mp4',
    customMetadata: {
      busId,
      eventoId,
      timestamp: new Date().toISOString(),
    },
  })
}

/**
 * Sube reporte PDF
 */
export async function uploadReporte(
  clienteId: string,
  tipo: 'diario' | 'semanal' | 'mensual' | 'evento',
  file: Blob,
  fecha: string
): Promise<string> {
  const filename = `${tipo}_${fecha}_${String(Date.now())}.pdf`
  const path = getReportePath(clienteId, tipo, filename)

  return uploadFile(path, file, {
    contentType: 'application/pdf',
    customMetadata: {
      clienteId,
      tipo,
      fecha,
      generadoAt: new Date().toISOString(),
    },
  })
}

/**
 * Sube foto de conductor
 */
export async function uploadConductorFoto(conductorId: string, file: File | Blob): Promise<string> {
  const extension = file instanceof File ? (file.name.split('.').pop() ?? 'jpg') : 'jpg'
  const filename = `foto_${String(Date.now())}.${extension}`
  const path = getConductorFotoPath(conductorId, filename)

  return uploadFile(path, file, {
    contentType: file.type || 'image/jpeg',
    customMetadata: {
      conductorId,
      uploadedAt: new Date().toISOString(),
    },
  })
}

/**
 * Elimina foto anterior de conductor
 */
export async function deleteConductorFoto(conductorId: string): Promise<void> {
  try {
    const files = await listFiles(`${STORAGE_PATHS.conductorFotos}/${conductorId}`)
    for (const filePath of files) {
      await deleteFile(filePath)
    }
  } catch (error) {
    // Ignorar si no hay archivos
    console.warn('No se encontraron fotos para eliminar:', error)
  }
}

/**
 * Sube foto de perfil de usuario
 */
export async function uploadProfilePhoto(uid: string, file: File | Blob): Promise<string> {
  const extension = file instanceof File ? (file.name.split('.').pop() ?? 'jpg') : 'jpg'
  const filename = `profile_${String(Date.now())}.${extension}`
  const path = getProfilePhotoPath(uid, filename)

  // Eliminar foto anterior
  try {
    const existingFiles = await listFiles(`${STORAGE_PATHS.profilePhotos}/${uid}`)
    for (const filePath of existingFiles) {
      await deleteFile(filePath)
    }
  } catch {
    // Ignorar si no hay foto anterior
  }

  return uploadFile(path, file, {
    contentType: file.type || 'image/jpeg',
    customMetadata: {
      uid,
      uploadedAt: new Date().toISOString(),
    },
  })
}

/**
 * Lista screenshots de una cámara ordenados por fecha
 */
export async function listCamaraScreenshots(busId: string, camaraId: string): Promise<string[]> {
  const path = `${STORAGE_PATHS.screenshots}/${busId}/${camaraId}`
  return listFiles(path)
}

/**
 * Limpia screenshots antiguos de una cámara (mantiene últimos N)
 */
export async function cleanupOldScreenshots(
  busId: string,
  camaraId: string,
  keepLast: number = 10
): Promise<number> {
  const files = await listCamaraScreenshots(busId, camaraId)

  if (files.length <= keepLast) {
    return 0
  }

  // Ordenar por timestamp en nombre de archivo (más antiguos primero)
  const sorted = files.sort()
  const toDelete = sorted.slice(0, files.length - keepLast)

  for (const filePath of toDelete) {
    await deleteFile(filePath)
  }

  return toDelete.length
}
