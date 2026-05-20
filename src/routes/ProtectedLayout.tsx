import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { LoadingState } from '@/components/common/LoadingState'
import { useAuthStore } from '@/stores/auth.store'
import { logout } from '@/services/auth.service'

/**
 * Layout for authenticated routes.
 * Wraps content with AppShell (sidebar, header) and handles auth checking.
 */
export function ProtectedLayout() {
  const location = useLocation()
  const { usuario, isLoading, isAuthenticated } = useAuthStore()

  // Show loading while checking auth state
  if (isLoading) {
    return <LoadingState fullScreen message="Verificando autenticacion..." />
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !usuario) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  // Check if user is active
  if (!usuario.activo) {
    return <Navigate to="/cuenta-desactivada" replace />
  }

  const handleLogout = () => {
    void logout()
  }

  return (
    <AppShell usuario={usuario} onLogout={handleLogout}>
      <Outlet />
    </AppShell>
  )
}
