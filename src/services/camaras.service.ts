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
  serverTimestamp,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '@/config/firebase'
import { camaraFirestoreSchema } from '@/schemas/camara.schema'
import type { Camara, CreateCamaraData } from '@/types/bus'
import type { Entity, FirestoreDocData } from '@/types/firestore'
import { DEFAULT_INFERENCE_CONFIG } from '@/config/constants'

const BUSES_COLLECTION = 'buses'
const CAMARAS_SUBCOLLECTION = 'camaras'

/**
 * Obtiene una cámara por ID
 */
export async function getCamara(busId: string, camaraId: string): Promise<Entity<Camara> | null> {
  const docRef = doc(db, BUSES_COLLECTION, busId, CAMARAS_SUBCOLLECTION, camaraId)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) {
    return null
  }

  const data = docSnap.data() as FirestoreDocData
  const parsed = camaraFirestoreSchema.safeParse(data)

  if (!parsed.success) {
    console.error('Error validando cámara:', parsed.error)
    return null
  }

  return {
    id: docSnap.id,
    ...parsed.data,
    ultimoScreenshotAt:
      ((data as { ultimoScreenshotAt?: unknown })
        .ultimoScreenshotAt as Camara['ultimoScreenshotAt']) ?? null,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  }
}

/**
 * Lista cámaras de un bus
 */
export async function listCamaras(busId: string): Promise<Entity<Camara>[]> {
  const q = query(
    collection(db, BUSES_COLLECTION, busId, CAMARAS_SUBCOLLECTION),
    where('habilitada', '==', true),
    orderBy('canal')
  )

  const snapshot = await getDocs(q)

  const camaras = snapshot.docs
    .map((docSnap) => {
      const data = docSnap.data() as FirestoreDocData
      const parsed = camaraFirestoreSchema.safeParse(data)
      if (!parsed.success) return null
      return {
        id: docSnap.id,
        ...parsed.data,
        ultimoScreenshotAt:
          ((data as { ultimoScreenshotAt?: unknown })
            .ultimoScreenshotAt as Camara['ultimoScreenshotAt']) ?? null,
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        createdAt: data.createdAt as Camara['createdAt'],
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        updatedAt: data.updatedAt as Camara['updatedAt'],
      }
    })
    .filter((item): item is Entity<Camara> => item !== null)
  return camaras
}

/**
 * Crea una nueva cámara para un bus
 */
export async function createCamara(
  busId: string,
  data: CreateCamaraData,
  createdBy: string
): Promise<string> {
  // Verificar que no exista otra cámara con el mismo canal
  const existingCameras = await listCamaras(busId)
  const canalExists = existingCameras.some((c) => c.canal === data.canal)
  if (canalExists) {
    throw new Error(`Ya existe una cámara en el canal ${String(data.canal)}`)
  }

  const docRef = await addDoc(collection(db, BUSES_COLLECTION, busId, CAMARAS_SUBCOLLECTION), {
    nombre: data.nombre,
    perfil: data.perfil,
    canal: data.canal,
    rtspUrl: data.rtspUrl,
    rtspSubstreamUrl: data.rtspSubstreamUrl ?? null,
    resolucionInferenciaW: data.resolucionInferenciaW ?? DEFAULT_INFERENCE_CONFIG.width,
    resolucionInferenciaH: data.resolucionInferenciaH ?? DEFAULT_INFERENCE_CONFIG.height,
    fpsInferencia: data.fpsInferencia ?? DEFAULT_INFERENCE_CONFIG.fps,
    habilitada: true,
    ultimoScreenshot: null,
    ultimoScreenshotAt: null,
    deleted: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy,
  })

  // Actualizar contador de cámaras en el bus
  const busRef = doc(db, BUSES_COLLECTION, busId)
  const currentCount = existingCameras.length
  await updateDoc(busRef, {
    numCamarasConfiguradas: currentCount + 1,
    updatedAt: serverTimestamp(),
  })

  return docRef.id
}

/**
 * Crea múltiples cámaras para un bus (usado en wizard)
 */
export async function createCamarasBatch(
  busId: string,
  camaras: CreateCamaraData[],
  createdBy: string
): Promise<string[]> {
  const ids: string[] = []

  for (const camara of camaras) {
    const docRef = await addDoc(collection(db, BUSES_COLLECTION, busId, CAMARAS_SUBCOLLECTION), {
      nombre: camara.nombre,
      perfil: camara.perfil,
      canal: camara.canal,
      rtspUrl: camara.rtspUrl,
      rtspSubstreamUrl: camara.rtspSubstreamUrl ?? null,
      resolucionInferenciaW: camara.resolucionInferenciaW ?? DEFAULT_INFERENCE_CONFIG.width,
      resolucionInferenciaH: camara.resolucionInferenciaH ?? DEFAULT_INFERENCE_CONFIG.height,
      fpsInferencia: camara.fpsInferencia ?? DEFAULT_INFERENCE_CONFIG.fps,
      habilitada: true,
      ultimoScreenshot: null,
      ultimoScreenshotAt: null,
      deleted: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy,
    })
    ids.push(docRef.id)
  }

  // Actualizar contador de cámaras en el bus
  const busRef = doc(db, BUSES_COLLECTION, busId)
  await updateDoc(busRef, {
    numCamarasConfiguradas: camaras.length,
    updatedAt: serverTimestamp(),
  })

  return ids
}

/**
 * Actualiza una cámara
 */
export async function updateCamara(
  busId: string,
  camaraId: string,
  data: Partial<Camara>
): Promise<void> {
  const docRef = doc(db, BUSES_COLLECTION, busId, CAMARAS_SUBCOLLECTION, camaraId)
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

/**
 * Soft delete de cámara
 */
export async function deleteCamara(busId: string, camaraId: string): Promise<void> {
  const docRef = doc(db, BUSES_COLLECTION, busId, CAMARAS_SUBCOLLECTION, camaraId)
  await updateDoc(docRef, {
    deleted: true,
    habilitada: false,
    updatedAt: serverTimestamp(),
  })

  // Actualizar contador de cámaras en el bus
  const remainingCameras = await listCamaras(busId)
  const busRef = doc(db, BUSES_COLLECTION, busId)
  await updateDoc(busRef, {
    numCamarasConfiguradas: remainingCameras.length,
    updatedAt: serverTimestamp(),
  })
}

/**
 * Habilita o deshabilita una cámara
 */
export async function toggleCamara(
  busId: string,
  camaraId: string,
  habilitada: boolean
): Promise<void> {
  const docRef = doc(db, BUSES_COLLECTION, busId, CAMARAS_SUBCOLLECTION, camaraId)
  await updateDoc(docRef, {
    habilitada,
    updatedAt: serverTimestamp(),
  })
}

/**
 * Actualiza el screenshot de una cámara
 */
export async function updateCamaraScreenshot(
  busId: string,
  camaraId: string,
  screenshotUrl: string
): Promise<void> {
  const docRef = doc(db, BUSES_COLLECTION, busId, CAMARAS_SUBCOLLECTION, camaraId)
  await updateDoc(docRef, {
    ultimoScreenshot: screenshotUrl,
    ultimoScreenshotAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

/**
 * Suscribe a cambios en tiempo real de cámaras de un bus
 */
export function subscribeToCamaras(
  busId: string,
  callback: (camaras: Entity<Camara>[]) => void
): Unsubscribe {
  const q = query(
    collection(db, BUSES_COLLECTION, busId, CAMARAS_SUBCOLLECTION),
    where('habilitada', '==', true),
    orderBy('canal')
  )

  return onSnapshot(q, (snapshot) => {
    const camaras = snapshot.docs
      .map((docSnap) => {
        const data = docSnap.data() as FirestoreDocData
        const parsed = camaraFirestoreSchema.safeParse(data)
        if (!parsed.success) return null
        return {
          id: docSnap.id,
          ...parsed.data,
          ultimoScreenshotAt:
            ((data as { ultimoScreenshotAt?: unknown })
              .ultimoScreenshotAt as Camara['ultimoScreenshotAt']) ?? null,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        }
      })
      .filter((item): item is Entity<Camara> => item !== null)

    callback(camaras)
  })
}
