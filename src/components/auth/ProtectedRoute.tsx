import { Navigate, useLocation } from 'react-router-dom'
import { LoadingState } from '@/components/common/LoadingState'
import type { Usuario } from '@/types/auth'

interface ProtectedRouteProps {
  children: React.ReactNode
  usuario: Usuario | null
  isLoading: boolean
  isAuthenticated: boolean
  redirectTo?: string
}

export function ProtectedRoute({
  children,
  usuario,
  isLoading,
  isAuthenticated,
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const location = useLocation()

  // Show loading while checking auth state
  if (isLoading) {
    return <LoadingState fullScreen message="Verificando autenticación..." />
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !usuario) {
    return <Navigate to={redirectTo} state={{ from: location.pathname }} replace />
  }

  // Check if user is active
  if (!usuario.activo) {
    return <Navigate to="/cuenta-desactivada" replace />
  }

  return <>{children}</>
}

interface PublicRouteProps {
  children: React.ReactNode
  isAuthenticated: boolean
  isLoading: boolean
  redirectTo?: string
}

/**
 * Route that redirects authenticated users away (e.g., login page)
 */
export function PublicRoute({
  children,
  isAuthenticated,
  isLoading,
  redirectTo = '/dashboard',
}: PublicRouteProps) {
  const location = useLocation()

  if (isLoading) {
    return <LoadingState fullScreen message="Cargando..." />
  }

  // Redirect to dashboard if already authenticated
  if (isAuthenticated) {
    // Try to redirect to the page they came from, or default to dashboard
    const state = location.state as { from?: string } | null
    const from = state?.from ?? redirectTo
    return <Navigate to={from} replace />
  }

  return <>{children}</>
}
