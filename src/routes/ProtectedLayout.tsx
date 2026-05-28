import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { useMemo, useCallback } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { LoadingState } from '@/components/common/LoadingState'
import { OnboardingTour } from '@/components/onboarding'
import { useAuthStore } from '@/stores/auth.store'
import { logout } from '@/services/auth.service'

/**
 * Layout for authenticated routes.
 * Wraps content with AppShell (sidebar, header) and handles auth checking.
 */
export function ProtectedLayout() {
  const location = useLocation()
  const { usuario, isLoading, isAuthenticated } = useAuthStore()

  // Memoize the redirect state to prevent infinite re-renders
  const redirectState = useMemo(() => ({ from: location.pathname }), [location.pathname])

  const handleLogout = useCallback(() => {
    void logout()
  }, [])

  // Show loading while checking auth state
  if (isLoading) {
    return <LoadingState fullScreen message="Verificando autenticacion..." />
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !usuario) {
    return <Navigate to="/login" state={redirectState} replace />
  }

  // Check if user is active - redirect to login with message instead of separate page
  if (!usuario.activo) {
    return <Navigate to="/login" state={{ error: 'cuenta_desactivada' }} replace />
  }

  return (
    <AppShell usuario={usuario} onLogout={handleLogout}>
      <OnboardingTour />
      <Outlet />
    </AppShell>
  )
}
