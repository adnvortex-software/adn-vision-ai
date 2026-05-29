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
  navigateTo?: string
}

// Create comprehensive tour steps
function createTourSteps(navigate: (path: string) => void): TourStep[] {
  return [
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
          'Aquí ves un resumen rápido: buses activos, novedades pendientes, despachos del día y más. Los números se actualizan en tiempo real.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tour="passenger-chart"]',
      popover: {
        title: '👥 Gráfico de Pasajeros',
        description:
          'Este gráfico muestra el conteo de pasajeros por día. Si administras varios clientes, verás una línea por cada uno. Puedes filtrar por rango de fechas.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '[data-tour="date-filter"]',
      popover: {
        title: '📅 Filtro de Fechas',
        description:
          'Cambia el rango de fechas para ver datos de hoy, últimos 7, 14 o 30 días. Todos los gráficos y estadísticas se actualizarán.',
        side: 'bottom',
        align: 'end',
      },
    },

    // ═══════════════════════════════════════════════════════════════
    // SIDEBAR NAVIGATION
    // ═══════════════════════════════════════════════════════════════
    {
      element: 'aside',
      popover: {
        title: '📋 Menú de Navegación',
        description:
          'Desde aquí accedes a todas las secciones. El menú se adapta según tu rol y permisos. Puedes colapsarlo para más espacio.',
        side: 'right',
        align: 'start',
      },
    },

    // ═══════════════════════════════════════════════════════════════
    // CLIENTS SECTION (Admin only)
    // ═══════════════════════════════════════════════════════════════
    {
      element: '[href="/clientes"]',
      popover: {
        title: '🏢 Gestión de Clientes',
        description:
          'Aquí administras las empresas de transporte. Cada cliente puede tener múltiples sucursales, buses y usuarios.',
        side: 'right',
        align: 'start',
        onNextClick: () => {
          navigate('/clientes')
        },
      },
      requiredPermission: 'clientes.read',
      forInternalOnly: true,
    },
    {
      element: '[data-tour="new-client-btn"]',
      popover: {
        title: '➕ Crear Nuevo Cliente',
        description:
          'Haz clic aquí para registrar una nueva empresa. Necesitarás: nombre, NIT, logo (opcional) y plan contratado.',
        side: 'bottom',
        align: 'start',
      },
      requiredPermission: 'clientes.create',
      forInternalOnly: true,
      navigateTo: '/clientes',
    },
    {
      element: '[data-tour="clients-table"]',
      popover: {
        title: '📋 Tabla de Clientes',
        description:
          'Lista de todos los clientes. Puedes ver detalles, editar información, gestionar sucursales o eliminar. Usa el buscador para encontrar rápidamente.',
        side: 'top',
        align: 'center',
      },
      requiredPermission: 'clientes.read',
      forInternalOnly: true,
      navigateTo: '/clientes',
    },

    // ═══════════════════════════════════════════════════════════════
    // USERS SECTION
    // ═══════════════════════════════════════════════════════════════
    {
      element: '[href="/usuarios"]',
      popover: {
        title: '👤 Administración de Usuarios',
        description:
          'Gestiona quién tiene acceso al sistema. Puedes crear cuentas, asignar roles y vincular usuarios a clientes específicos.',
        side: 'right',
        align: 'start',
        onNextClick: () => {
          navigate('/usuarios')
        },
      },
      requiredPermission: 'usuarios.read',
    },
    {
      element: '[data-tour="new-user-btn"]',
      popover: {
        title: '➕ Crear Usuario',
        description:
          'Para crear un usuario necesitas: email, nombre, rol y cliente (si aplica). El usuario recibirá un correo para establecer su contraseña.',
        side: 'bottom',
        align: 'start',
      },
      requiredPermission: 'usuarios.create',
      navigateTo: '/usuarios',
    },
    {
      element: '[data-tour="users-table"]',
      popover: {
        title: '📋 Lista de Usuarios',
        description:
          'Aquí ves todos los usuarios: su rol, cliente asignado, estado (activo/inactivo) y última conexión. Puedes filtrar por rol o buscar por nombre.',
        side: 'top',
        align: 'center',
      },
      requiredPermission: 'usuarios.read',
      navigateTo: '/usuarios',
    },

    // ═══════════════════════════════════════════════════════════════
    // BUSES SECTION
    // ═══════════════════════════════════════════════════════════════
    {
      element: '[href="/buses"]',
      popover: {
        title: '🚌 Gestión de Buses',
        description:
          'El corazón del sistema. Aquí ves todos los vehículos, su estado de conexión, conteos de pasajeros y acceso a cámaras en vivo.',
        side: 'right',
        align: 'start',
        onNextClick: () => {
          navigate('/buses')
        },
      },
      requiredPermission: 'buses.read',
    },
    {
      element: '[data-tour="buses-table"]',
      popover: {
        title: '📋 Tabla de Buses',
        description:
          'Cada fila muestra: placa, tipo, cliente, estado de conexión (verde = conectado), conteo del día y acciones rápidas.',
        side: 'top',
        align: 'center',
      },
      requiredPermission: 'buses.read',
      navigateTo: '/buses',
    },
    {
      element: '[data-tour="bus-count-column"]',
      popover: {
        title: '👥 Columna de Conteo',
        description:
          'Muestra entradas/salidas del día en tiempo real. El sistema cuenta automáticamente usando las cámaras de IA. Haz clic para ver detalles.',
        side: 'left',
        align: 'center',
      },
      requiredPermission: 'buses.read',
      navigateTo: '/buses',
    },
    {
      element: '[data-tour="bus-live-btn"]',
      popover: {
        title: '📹 Ver en Vivo',
        description:
          'Accede al stream en tiempo real de las cámaras del bus. Puedes ver hasta 4 cámaras simultáneamente.',
        side: 'left',
        align: 'center',
      },
      requiredPermission: 'buses.read',
      navigateTo: '/buses',
    },

    // ═══════════════════════════════════════════════════════════════
    // DISPATCHES SECTION
    // ═══════════════════════════════════════════════════════════════
    {
      element: '[href="/despachos"]',
      popover: {
        title: '📝 Despachos',
        description:
          'Gestiona los despachos diarios. Registra salidas de buses con conductor asignado, ruta y horario.',
        side: 'right',
        align: 'start',
        onNextClick: () => {
          navigate('/despachos')
        },
      },
    },
    {
      element: '[data-tour="new-despacho-btn"]',
      popover: {
        title: '➕ Crear Despacho',
        description:
          'Para crear un despacho: selecciona bus, conductor, ruta y horario. El sistema validará disponibilidad y te alertará de conflictos.',
        side: 'bottom',
        align: 'start',
      },
      navigateTo: '/despachos',
    },

    // ═══════════════════════════════════════════════════════════════
    // NOVELTIES SECTION
    // ═══════════════════════════════════════════════════════════════
    {
      element: '[href="/novedades"]',
      popover: {
        title: '⚠️ Novedades y Alertas',
        description:
          'Centro de eventos detectados por las cámaras de IA: sobrecupo, infracciones, incidentes. Revisa, clasifica y genera informes.',
        side: 'right',
        align: 'start',
        onNextClick: () => {
          navigate('/novedades')
        },
      },
      requiredPermission: 'eventos.read',
    },
    {
      element: '[data-tour="novedades-filters"]',
      popover: {
        title: '🔍 Filtros de Novedades',
        description:
          'Filtra por tipo de novedad, estado (nuevo/revisado/archivado), bus o rango de fechas. Los filtros se combinan para búsquedas precisas.',
        side: 'bottom',
        align: 'start',
      },
      requiredPermission: 'eventos.read',
      navigateTo: '/novedades',
    },

    // ═══════════════════════════════════════════════════════════════
    // REPORTS SECTION
    // ═══════════════════════════════════════════════════════════════
    {
      element: '[href="/reportes"]',
      popover: {
        title: '📊 Reportes',
        description:
          'Genera reportes de novedades, conteo de pasajeros y más. Exporta a PDF para compartir con clientes o gerencia.',
        side: 'right',
        align: 'start',
      },
      requiredPermission: 'reportes.download',
    },

    // ═══════════════════════════════════════════════════════════════
    // SETTINGS
    // ═══════════════════════════════════════════════════════════════
    {
      element: '[href="/configuracion"]',
      popover: {
        title: '⚙️ Configuración',
        description:
          'Personaliza tu experiencia: cambia el tema (claro/oscuro), idioma y otras preferencias. También puedes repetir este tour desde aquí.',
        side: 'right',
        align: 'start',
      },
    },

    // ═══════════════════════════════════════════════════════════════
    // HEADER ACTIONS
    // ═══════════════════════════════════════════════════════════════
    {
      element: '[data-tour="header-user-menu"]',
      popover: {
        title: '👤 Tu Perfil',
        description:
          'Haz clic aquí para ver tu perfil, cambiar contraseña o cerrar sesión. También muestra notificaciones pendientes.',
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
          'Ya conoces las funcionalidades principales de ADN VISION AI. Si tienes dudas, contacta al equipo de soporte. Puedes repetir este tour desde Configuración > "Repetir Tour".',
        side: 'over',
        align: 'center',
      },
    },
  ]
}

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

      // Navigate back to dashboard
      if (location.pathname !== '/dashboard') {
        navigate('/dashboard')
      }

      onComplete?.()
    } catch (error) {
      console.error('Error marking onboarding complete:', error)
    }
  }, [usuario, setUsuario, onComplete, navigate, location.pathname])

  const startTour = useCallback(() => {
    if (!usuario?.rol || tourStarted) return

    // Ensure we're on dashboard to start
    if (location.pathname !== '/dashboard') {
      navigate('/dashboard')
      // Wait for navigation then start
      setTimeout(() => {
        startTourInternal()
      }, 500)
      return
    }

    startTourInternal()

    function startTourInternal() {
      if (!usuario?.rol) return

      // Create steps with navigate function
      const allSteps = createTourSteps(navigate)

      // Filter steps based on user role
      const filteredSteps = filterStepsForRole(allSteps, usuario.rol)

      if (filteredSteps.length === 0) {
        void markOnboardingComplete()
        return
      }

      const driverConfig: Config = {
        showProgress: true,
        animate: true,
        allowClose: true,
        stagePadding: 10,
        stageRadius: 8,
        popoverClass: 'adn-lynx-popover',
        progressText: '{{current}} de {{total}}',
        nextBtnText: 'Siguiente →',
        prevBtnText: '← Anterior',
        doneBtnText: '✓ Finalizar',
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
