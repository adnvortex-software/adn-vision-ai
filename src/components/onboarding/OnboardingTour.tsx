import { useEffect, useCallback, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
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

// Tour steps - all visible from dashboard (no page navigation needed)
const TOUR_STEPS: TourStep[] = [
  // ═══════════════════════════════════════════════════════════════
  // WELCOME
  // ═══════════════════════════════════════════════════════════════
  {
    popover: {
      title: '👋 Bienvenido a ADN VISION AI',
      description:
        'Tu plataforma de monitoreo inteligente de flotas. En este tour aprenderás a usar todas las funcionalidades del sistema.',
      side: 'over',
      align: 'center',
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // DASHBOARD OVERVIEW
  // ═══════════════════════════════════════════════════════════════
  {
    element: '[data-tour="kpi-grid"]',
    popover: {
      title: '📊 Indicadores Clave (KPIs)',
      description:
        'Resumen en tiempo real: buses activos, novedades pendientes, despachos completados y más. Los números se actualizan automáticamente.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="passenger-chart"]',
    popover: {
      title: '👥 Gráfico de Pasajeros',
      description:
        'Conteo de pasajeros por día. Si administras varios clientes, verás una línea por cada uno. El promedio se calcula entre entradas y salidas.',
      side: 'top',
      align: 'start',
    },
  },
  {
    element: '[data-tour="date-filter"]',
    popover: {
      title: '📅 Filtro de Fechas',
      description:
        'Cambia el período: hoy, últimos 7, 14 o 30 días. Todos los gráficos y KPIs se actualizarán según el rango seleccionado.',
      side: 'bottom',
      align: 'end',
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // SIDEBAR - MAIN NAVIGATION
  // ═══════════════════════════════════════════════════════════════
  {
    element: 'aside',
    popover: {
      title: '📋 Menú Principal',
      description:
        'Tu centro de navegación. El menú se adapta según tu rol y permisos. Puedes colapsarlo haciendo clic en el botón de la esquina.',
      side: 'right',
      align: 'start',
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // CLIENTS (Admin only)
  // ═══════════════════════════════════════════════════════════════
  {
    element: '[href="/clientes"]',
    popover: {
      title: '🏢 Clientes',
      description:
        'Administra empresas de transporte. Crea clientes, gestiona sucursales y propietarios. Haz clic para ver la lista completa y crear nuevos.',
      side: 'right',
      align: 'start',
    },
    requiredPermission: 'clientes.read',
    forInternalOnly: true,
  },

  // ═══════════════════════════════════════════════════════════════
  // BUSES
  // ═══════════════════════════════════════════════════════════════
  {
    element: '[href="/buses"]',
    popover: {
      title: '🚌 Buses',
      description:
        'El corazón del sistema. Ve el estado de cada vehículo, conteo de pasajeros en tiempo real, accede a cámaras en vivo y grabaciones DVR.',
      side: 'right',
      align: 'start',
    },
    requiredPermission: 'buses.read',
  },

  // ═══════════════════════════════════════════════════════════════
  // CONDUCTORES
  // ═══════════════════════════════════════════════════════════════
  {
    element: '[href="/conductores"]',
    popover: {
      title: '👨‍✈️ Conductores',
      description:
        'Registro de conductores con licencias. El sistema te alertará automáticamente cuando una licencia esté próxima a vencer.',
      side: 'right',
      align: 'start',
    },
    requiredPermission: 'conductores.read',
  },

  // ═══════════════════════════════════════════════════════════════
  // DESPACHOS
  // ═══════════════════════════════════════════════════════════════
  {
    element: '[href="/despachos"]',
    popover: {
      title: '📝 Despachos',
      description:
        'Gestiona salidas diarias. Asigna bus, conductor, ruta y horario. Genera tirillas de despacho y controla el estado de cada viaje.',
      side: 'right',
      align: 'start',
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // NOVEDADES
  // ═══════════════════════════════════════════════════════════════
  {
    element: '[href="/novedades"]',
    popover: {
      title: '⚠️ Novedades',
      description:
        'Eventos detectados por las cámaras de IA: sobrecupo, infracciones, incidentes. Revisa cada evento, cambia su estado y genera informes disciplinarios.',
      side: 'right',
      align: 'start',
    },
    requiredPermission: 'eventos.read',
  },

  // ═══════════════════════════════════════════════════════════════
  // REPORTES
  // ═══════════════════════════════════════════════════════════════
  {
    element: '[href="/reportes"]',
    popover: {
      title: '📊 Reportes',
      description:
        'Genera informes de novedades y conteo de pasajeros. Filtra por fechas, buses o conductores. Exporta a PDF para compartir.',
      side: 'right',
      align: 'start',
    },
    requiredPermission: 'reportes.download',
  },

  // ═══════════════════════════════════════════════════════════════
  // USUARIOS
  // ═══════════════════════════════════════════════════════════════
  {
    element: '[href="/usuarios"]',
    popover: {
      title: '👤 Usuarios',
      description:
        'Gestiona accesos al sistema. Crea cuentas, asigna roles (admin, operador, visor) y vincula usuarios a clientes específicos.',
      side: 'right',
      align: 'start',
    },
    requiredPermission: 'usuarios.read',
  },

  // ═══════════════════════════════════════════════════════════════
  // CONFIGURACION
  // ═══════════════════════════════════════════════════════════════
  {
    element: '[href="/configuracion"]',
    popover: {
      title: '⚙️ Configuración',
      description:
        'Personaliza tu experiencia: tema claro/oscuro, idioma español/inglés. También puedes repetir este tour desde aquí.',
      side: 'right',
      align: 'start',
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // HEADER
  // ═══════════════════════════════════════════════════════════════
  {
    element: '[data-tour="header-user-menu"]',
    popover: {
      title: '👤 Tu Perfil',
      description:
        'Accede a tu perfil, cambia contraseña o cierra sesión. También verás notificaciones pendientes cuando las haya.',
      side: 'bottom',
      align: 'end',
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // FINAL
  // ═══════════════════════════════════════════════════════════════
  {
    popover: {
      title: '🎉 ¡Listo para comenzar!',
      description:
        'Ya conoces ADN VISION AI. Explora cada sección haciendo clic en el menú. Si necesitas ayuda, contacta al equipo de soporte. Puedes repetir este tour desde Configuración.',
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
  const navigate = useNavigate()
  const location = useLocation()
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

    // Ensure we're on dashboard to start
    if (location.pathname !== '/dashboard') {
      navigate('/dashboard')
      // Wait for navigation then start
      setTimeout(() => {
        runTour()
      }, 800)
      return
    }

    runTour()

    function runTour() {
      // Filter steps based on user role
      const filteredSteps = filterStepsForRole(TOUR_STEPS, usuario!.rol)

      if (filteredSteps.length === 0) {
        void markOnboardingComplete()
        return
      }

      const driverConfig: Config = {
        showProgress: true,
        animate: true,
        allowClose: true,
        allowKeyboardControl: true,
        stagePadding: 10,
        stageRadius: 8,
        popoverClass: 'adn-lynx-popover',
        progressText: '{{current}} de {{total}}',
        nextBtnText: 'Siguiente →',
        prevBtnText: '← Anterior',
        doneBtnText: '✓ Finalizar',
        showButtons: ['next', 'previous', 'close'],
        onCloseClick: () => {
          void markOnboardingComplete()
        },
        onDestroyStarted: () => {
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
    }
  }, [usuario, tourStarted, markOnboardingComplete, navigate, location.pathname])

  useEffect(() => {
    // Only start tour if user hasn't completed onboarding
    if (usuario && usuario.onboardingCompleted !== true && !tourStarted) {
      // Small delay to ensure DOM is ready
      const timeout = setTimeout(() => {
        startTour()
      }, 1500)

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
