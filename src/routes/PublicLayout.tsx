import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { LoadingState } from '@/components/common/LoadingState'
import { useAuthStore } from '@/stores/auth.store'

/**
 * Layout for public routes (login, password reset, etc).
 * Redirects authenticated users to dashboard.
 */
export function PublicLayout() {
  const location = useLocation()
  const { isLoading, isAuthenticated } = useAuthStore()

  if (isLoading) {
    return <LoadingState fullScreen message="Cargando..." />
  }

  // Redirect to dashboard if already authenticated
  if (isAuthenticated) {
    // Try to redirect to the page they came from, or default to dashboard
    const state = location.state as { from?: string } | null
    const from = state?.from ?? '/'
    return <Navigate to={from} replace />
  }

  return <Outlet />
}
