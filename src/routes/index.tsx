import { createBrowserRouter, Navigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { LoadingState } from '@/components/common/LoadingState'
import { ProtectedLayout } from './ProtectedLayout'
import { PublicLayout } from './PublicLayout'

// Lazy load pages for better performance
// Auth pages
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const RecuperarPasswordPage = lazy(() => import('@/pages/auth/RecuperarPasswordPage'))
const SetupPage = lazy(() => import('@/pages/auth/SetupPage'))

// Main pages
const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))
const ForbiddenPage = lazy(() => import('@/pages/ForbiddenPage'))

// Cliente pages
const ClientesListPage = lazy(() => import('@/pages/clientes/ClientesListPage'))
const ClienteDetailPage = lazy(() => import('@/pages/clientes/ClienteDetailPage'))
const ClienteNuevoPage = lazy(() => import('@/pages/clientes/ClienteNuevoPage'))

// Bus pages
const BusesListPage = lazy(() => import('@/pages/buses/BusesListPage'))
const BusDetailPage = lazy(() => import('@/pages/buses/BusDetailPage'))
const BusNuevoPage = lazy(() => import('@/pages/buses/BusNuevoPage'))
const BusEditPage = lazy(() => import('@/pages/buses/BusEditPage'))
const BusConfigCamarasPage = lazy(() => import('@/pages/buses/BusConfigCamarasPage'))

// Novedades pages
const NovedadesEventosPage = lazy(() => import('@/pages/novedades/NovedadesEventosPage'))
const NovedadEventoDetailPage = lazy(() => import('@/pages/novedades/NovedadEventoDetailPage'))

// Conductores pages
const ConductoresListPage = lazy(() => import('@/pages/conductores/ConductoresListPage'))
const ConductorDetailPage = lazy(() => import('@/pages/conductores/ConductorDetailPage'))

// Reportes pages
const ReportesGeneralPage = lazy(() => import('@/pages/reportes/ReportesGeneralPage'))
const ReporteConteoPage = lazy(() => import('@/pages/reportes/ReporteConteoPage'))
const ReporteNovedadesPage = lazy(() => import('@/pages/reportes/ReporteNovedadesPage'))

// Usuarios pages
const UsuariosListPage = lazy(() => import('@/pages/usuarios/UsuariosListPage'))
const UsuarioCreatePage = lazy(() => import('@/pages/usuarios/UsuarioCreatePage'))
const UsuarioDetailPage = lazy(() => import('@/pages/usuarios/UsuarioDetailPage'))

// Configuracion pages
const ConfiguracionPage = lazy(() => import('@/pages/configuracion/ConfiguracionPage'))

// Helper to wrap lazy components with Suspense - defined inline to avoid react-refresh warning
export const router = createBrowserRouter([
  // Public routes (login, password reset)
  {
    element: <PublicLayout />,
    children: [
      {
        path: '/login',
        element: (
          <Suspense fallback={<LoadingState fullScreen />}>
            <LoginPage />
          </Suspense>
        ),
      },
      {
        path: '/recuperar-password',
        element: (
          <Suspense fallback={<LoadingState fullScreen />}>
            <RecuperarPasswordPage />
          </Suspense>
        ),
      },
      {
        path: '/setup',
        element: (
          <Suspense fallback={<LoadingState fullScreen />}>
            <SetupPage />
          </Suspense>
        ),
      },
    ],
  },

  // Protected routes (require authentication)
  {
    element: <ProtectedLayout />,
    children: [
      // Dashboard
      {
        path: '/',
        element: (
          <Suspense fallback={<LoadingState fullScreen />}>
            <DashboardPage />
          </Suspense>
        ),
      },
      {
        path: '/dashboard',
        element: <Navigate to="/" replace />,
      },

      // Clientes
      {
        path: '/clientes',
        element: (
          <Suspense fallback={<LoadingState fullScreen />}>
            <ClientesListPage />
          </Suspense>
        ),
      },
      {
        path: '/clientes/nuevo',
        element: (
          <Suspense fallback={<LoadingState fullScreen />}>
            <ClienteNuevoPage />
          </Suspense>
        ),
      },
      {
        path: '/clientes/:clienteId',
        element: (
          <Suspense fallback={<LoadingState fullScreen />}>
            <ClienteDetailPage />
          </Suspense>
        ),
      },
      {
        path: '/clientes/:clienteId/editar',
        element: (
          <Suspense fallback={<LoadingState fullScreen />}>
            <ClienteNuevoPage />
          </Suspense>
        ),
      },

      // Buses
      {
        path: '/buses',
        element: (
          <Suspense fallback={<LoadingState fullScreen />}>
            <BusesListPage />
          </Suspense>
        ),
      },
      {
        path: '/buses/nuevo',
        element: (
          <Suspense fallback={<LoadingState fullScreen />}>
            <BusNuevoPage />
          </Suspense>
        ),
      },
      {
        path: '/buses/:busId',
        element: (
          <Suspense fallback={<LoadingState fullScreen />}>
            <BusDetailPage />
          </Suspense>
        ),
      },
      {
        path: '/buses/:busId/editar',
        element: (
          <Suspense fallback={<LoadingState fullScreen />}>
            <BusEditPage />
          </Suspense>
        ),
      },
      {
        path: '/buses/:busId/camaras',
        element: (
          <Suspense fallback={<LoadingState fullScreen />}>
            <BusConfigCamarasPage />
          </Suspense>
        ),
      },

      // Novedades
      {
        path: '/novedades',
        element: (
          <Suspense fallback={<LoadingState fullScreen />}>
            <NovedadesEventosPage />
          </Suspense>
        ),
      },
      {
        path: '/novedades/:eventoId',
        element: (
          <Suspense fallback={<LoadingState fullScreen />}>
            <NovedadEventoDetailPage />
          </Suspense>
        ),
      },

      // Conductores
      {
        path: '/conductores',
        element: (
          <Suspense fallback={<LoadingState fullScreen />}>
            <ConductoresListPage />
          </Suspense>
        ),
      },
      {
        path: '/conductores/nuevo',
        element: (
          <Suspense fallback={<LoadingState fullScreen />}>
            <ConductorDetailPage />
          </Suspense>
        ),
      },
      {
        path: '/conductores/:conductorId',
        element: (
          <Suspense fallback={<LoadingState fullScreen />}>
            <ConductorDetailPage />
          </Suspense>
        ),
      },
      {
        path: '/conductores/:conductorId/editar',
        element: (
          <Suspense fallback={<LoadingState fullScreen />}>
            <ConductorDetailPage />
          </Suspense>
        ),
      },

      // Reportes
      {
        path: '/reportes',
        element: (
          <Suspense fallback={<LoadingState fullScreen />}>
            <ReportesGeneralPage />
          </Suspense>
        ),
      },
      {
        path: '/reportes/conteo',
        element: (
          <Suspense fallback={<LoadingState fullScreen />}>
            <ReporteConteoPage />
          </Suspense>
        ),
      },
      {
        path: '/reportes/novedades',
        element: (
          <Suspense fallback={<LoadingState fullScreen />}>
            <ReporteNovedadesPage />
          </Suspense>
        ),
      },

      // Usuarios
      {
        path: '/usuarios',
        element: (
          <Suspense fallback={<LoadingState fullScreen />}>
            <UsuariosListPage />
          </Suspense>
        ),
      },
      {
        path: '/usuarios/nuevo',
        element: (
          <Suspense fallback={<LoadingState fullScreen />}>
            <UsuarioCreatePage />
          </Suspense>
        ),
      },
      {
        path: '/usuarios/:usuarioId',
        element: (
          <Suspense fallback={<LoadingState fullScreen />}>
            <UsuarioDetailPage />
          </Suspense>
        ),
      },
      {
        path: '/usuarios/:usuarioId/editar',
        element: (
          <Suspense fallback={<LoadingState fullScreen />}>
            <UsuarioDetailPage />
          </Suspense>
        ),
      },

      // Configuracion
      {
        path: '/configuracion',
        element: (
          <Suspense fallback={<LoadingState fullScreen />}>
            <ConfiguracionPage />
          </Suspense>
        ),
      },

      // Error pages
      {
        path: '/403',
        element: (
          <Suspense fallback={<LoadingState fullScreen />}>
            <ForbiddenPage />
          </Suspense>
        ),
      },
    ],
  },

  // Catch-all for 404
  {
    path: '*',
    element: (
      <Suspense fallback={<LoadingState fullScreen />}>
        <NotFoundPage />
      </Suspense>
    ),
  },
])
