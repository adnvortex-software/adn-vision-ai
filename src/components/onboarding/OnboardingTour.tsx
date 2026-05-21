import { useEffect, useCallback, useState } from 'react'
import { driver, type DriveStep, type Config } from 'driver.js'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/config/firebase'
import { useAuthStore } from '@/stores/auth.store'
import { hasPermission, isInternalRole, isClientRole } from '@/lib/permissions'
import type { Role } from '@/config/constants'
import type { Permission } from '@/lib/permissions'
import 'driver.js/dist/driver.css'
import './onboarding.css'

interface OnboardingTourProps {
  onComplete?: () => void
}

// Define tour steps with role-based filtering
interface TourStep extends DriveStep {
  requiredPermission?: Permission
  forInternalOnly?: boolean
  forClientOnly?: boolean
  forRoles?: Role[]
}

const ALL_TOUR_STEPS: TourStep[] = [
  // Welcome step (for everyone)
  {
    popover: {
      title: 'Bienvenido a ADN VISION AI',
      description:
        'Este es tu centro de control para monitoreo de flotas. Te guiaremos por las principales funcionalidades del sistema.',
      side: 'over',
      align: 'center',
    },
  },
  // Sidebar navigation
  {
    element: 'aside',
    popover: {
      title: 'Menu de Navegacion',
      description:
        'Desde aqui puedes acceder a todas las secciones del sistema. El menu se adapta segun tus permisos.',
      side: 'right',
      align: 'start',
    },
  },
  // Dashboard
  {
    element: '[href="/dashboard"]',
    popover: {
      title: 'Dashboard',
      description:
        'Vista general con estadisticas en tiempo real, alertas activas y resumen de actividad de tu flota.',
      side: 'right',
      align: 'start',
    },
  },
  // Clientes - only for internal users with permission
  {
    element: '[href="/clientes"]',
    popover: {
      title: 'Gestion de Clientes',
      description:
        'Administra los clientes del sistema, sus sucursales y propietarios. Aqui puedes crear, editar y gestionar toda la estructura organizacional.',
      side: 'right',
      align: 'start',
    },
    requiredPermission: 'clientes.read',
    forInternalOnly: true,
  },
  // Buses
  {
    element: '[href="/buses"]',
    popover: {
      title: 'Gestion de Buses',
      description:
        'Visualiza y administra todos los vehiculos. Puedes ver el estado de conexion, configurar camaras y monitorear en tiempo real.',
      side: 'right',
      align: 'start',
    },
    requiredPermission: 'buses.read',
  },
  // Conductores
  {
    element: '[href="/conductores"]',
    popover: {
      title: 'Conductores',
      description:
        'Registro de conductores con informacion de licencias. El sistema te alertara cuando las licencias esten proximas a vencer.',
      side: 'right',
      align: 'start',
    },
    requiredPermission: 'conductores.read',
  },
  // Novedades
  {
    element: '[href="/novedades"]',
    popover: {
      title: 'Novedades y Alertas',
      description:
        'Centro de eventos detectados por las camaras. Aqui puedes revisar incidentes, cambiar estados y generar informes disciplinarios.',
      side: 'right',
      align: 'start',
    },
    requiredPermission: 'eventos.read',
  },
  // Reportes
  {
    element: '[href="/reportes"]',
    popover: {
      title: 'Reportes',
      description:
        'Genera reportes de novedades, conteo de pasajeros y mas. Puedes exportar a PDF y filtrar por fechas, buses o conductores.',
      side: 'right',
      align: 'start',
    },
    requiredPermission: 'reportes.download',
  },
  // Usuarios - only for those with permission
  {
    element: '[href="/usuarios"]',
    popover: {
      title: 'Administracion de Usuarios',
      description:
        'Gestiona los usuarios del sistema. Puedes crear nuevas cuentas, asignar roles y controlar accesos.',
      side: 'right',
      align: 'start',
    },
    requiredPermission: 'usuarios.read',
  },
  // Settings
  {
    element: '[href="/configuracion"]',
    popover: {
      title: 'Configuracion',
      description:
        'Personaliza tu experiencia, cambia tema de colores y ajusta preferencias del sistema.',
      side: 'right',
      align: 'start',
    },
  },
  // Final step
  {
    popover: {
      title: 'Listo para comenzar!',
      description:
        'Ya conoces las funcionalidades principales. Si tienes dudas, contacta al equipo de soporte. Puedes volver a ver este tour desde Configuracion.',
      side: 'over',
      align: 'center',
    },
  },
]

function filterStepsForRole(steps: TourStep[], role: Role): DriveStep[] {
  return steps.filter((step) => {
    // Check role-based filters
    if (step.forInternalOnly && !isInternalRole(role)) return false
    if (step.forClientOnly && !isClientRole(role)) return false
    if (step.forRoles && !step.forRoles.includes(role)) return false

    // Check permission-based filter
    if (step.requiredPermission && !hasPermission(role, step.requiredPermission)) return false

    // Check if element exists (for dynamic elements)
    if (step.element) {
      const element = document.querySelector(step.element as string)
      if (!element) return false
    }

    return true
  })
}

export function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const { usuario, setUsuario } = useAuthStore()
  const [tourStarted, setTourStarted] = useState(false)

  const markOnboardingComplete = useCallback(async () => {
    if (!usuario?.uid) return

    try {
      const userRef = doc(db, 'usuarios', usuario.uid)
      await updateDoc(userRef, {
        onboardingCompleted: true,
      })

      // Update local state
      setUsuario({
        ...usuario,
        onboardingCompleted: true,
      })

      onComplete?.()
    } catch (error) {
      console.error('Error marking onboarding complete:', error)
    }
  }, [usuario, setUsuario, onComplete])

  const startTour = useCallback(() => {
    if (!usuario?.rol || tourStarted) return

    // Filter steps based on user role
    const filteredSteps = filterStepsForRole(ALL_TOUR_STEPS, usuario.rol)

    if (filteredSteps.length === 0) {
      void markOnboardingComplete()
      return
    }

    const driverConfig: Config = {
      showProgress: true,
      animate: true,
      allowClose: true,
      stagePadding: 8,
      stageRadius: 8,
      popoverClass: 'adn-lynx-popover',
      progressText: '{{current}} de {{total}}',
      nextBtnText: 'Siguiente',
      prevBtnText: 'Anterior',
      doneBtnText: 'Finalizar',
      onDestroyStarted: () => {
        // User clicked skip or closed
        void markOnboardingComplete()
      },
      onDestroyed: () => {
        setTourStarted(false)
      },
      steps: filteredSteps,
    }

    const driverObj = driver(driverConfig)
    setTourStarted(true)
    driverObj.drive()
  }, [usuario, tourStarted, markOnboardingComplete])

  useEffect(() => {
    // Only start tour if user hasn't completed onboarding
    if (usuario && usuario.onboardingCompleted !== true && !tourStarted) {
      // Small delay to ensure DOM is ready
      const timeout = setTimeout(() => {
        startTour()
      }, 1000)

      return () => {
        clearTimeout(timeout)
      }
    }
    return undefined
  }, [usuario, tourStarted, startTour])

  return null // This component doesn't render anything visible
}

// Export function to manually trigger tour
export function useTriggerOnboarding() {
  const { usuario, setUsuario } = useAuthStore()

  const triggerTour = useCallback(async () => {
    if (!usuario?.uid) return

    // Reset onboarding status
    try {
      const userRef = doc(db, 'usuarios', usuario.uid)
      await updateDoc(userRef, {
        onboardingCompleted: false,
      })

      // Update local state
      setUsuario({
        ...usuario,
        onboardingCompleted: false,
      })

      // Reload page to trigger tour
      window.location.reload()
    } catch (error) {
      console.error('Error resetting onboarding:', error)
    }
  }, [usuario, setUsuario])

  return { triggerTour }
}

// Export function for admin to reset another user's onboarding
export async function resetUserOnboarding(userId: string): Promise<void> {
  const userRef = doc(db, 'usuarios', userId)
  await updateDoc(userRef, {
    onboardingCompleted: false,
  })
}
