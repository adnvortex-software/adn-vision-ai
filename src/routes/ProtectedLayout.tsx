import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { useMemo, useCallback, useEffect } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { LoadingState } from '@/components/common/LoadingState'
import { OnboardingTour } from '@/components/onboarding'
import { useAuthStore } from '@/stores/auth.store'
import { useDataStore } from '@/stores/data.store'
import { logout } from '@/services/auth.service'
import { isClientRole } from '@/lib/permissions'

/**
 * Layout for authenticated routes.
 * Wraps content with AppShell (sidebar, header) and handles auth checking.
 */
export function ProtectedLayout() {
  const location = useLocation()
  const { usuario, isLoading, isAuthenticated } = useAuthStore()
  const { loadClientes, loadBuses, subscribeBuses, clearCache } = useDataStore()

  // Memoize the redirect state to prevent infinite re-renders
  const redirectState = useMemo(() => ({ from: location.pathname }), [location.pathname])

  const handleLogout = useCallback(() => {
    clearCache()
    void logout()
  }, [clearCache])

  // Load and cache data when authenticated
  useEffect(() => {
    if (isAuthenticated && usuario) {
      // For client users, filter data by their clienteId
      const clienteIdFilter = isClientRole(usuario.rol)
        ? (usuario.clienteId ?? undefined)
        : undefined

      // Load clientes first, then buses (buses need cliente names)
      void loadClientes().then(() => {
        void loadBuses(false, clienteIdFilter)
        subscribeBuses(clienteIdFilter) // Subscribe to real-time updates
      })
    }
  }, [isAuthenticated, usuario, loadClientes, loadBuses, subscribeBuses])

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
