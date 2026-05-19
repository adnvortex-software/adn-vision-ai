import { type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { usePermissions } from '@/hooks/usePermissions'
import type { Usuario } from '@/types/auth'
import type { Role } from '@/config/constants'
import type { Permission } from '@/lib/permissions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface RoleGateProps {
  children: ReactNode
  usuario: Usuario | null
  allowedRoles?: Role[]
  requiredPermission?: Permission
  requiredPermissions?: Permission[]
  requireAll?: boolean
  fallback?: ReactNode
  redirectTo?: string
}

/**
 * Component that conditionally renders children based on user role/permissions
 */
export function RoleGate({
  children,
  usuario,
  allowedRoles,
  requiredPermission,
  requiredPermissions,
  requireAll = false,
  fallback,
  redirectTo,
}: RoleGateProps) {
  const { can, hasAnyPermission, hasAllPermissions, role } = usePermissions({
    usuario,
  })

  // Check role-based access
  if (allowedRoles && role) {
    if (!allowedRoles.includes(role)) {
      if (redirectTo) {
        return <Navigate to={redirectTo} replace />
      }
      return <>{fallback ?? <AccessDenied />}</>
    }
  }

  // Check single permission
  if (requiredPermission) {
    if (!can(requiredPermission)) {
      if (redirectTo) {
        return <Navigate to={redirectTo} replace />
      }
      return <>{fallback ?? <AccessDenied />}</>
    }
  }

  // Check multiple permissions
  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasAccess = requireAll
      ? hasAllPermissions(requiredPermissions)
      : hasAnyPermission(requiredPermissions)

    if (!hasAccess) {
      if (redirectTo) {
        return <Navigate to={redirectTo} replace />
      }
      return <>{fallback ?? <AccessDenied />}</>
    }
  }

  return <>{children}</>
}

/**
 * Default access denied component
 */
function AccessDenied() {
  return (
    <div className="flex min-h-[400px] items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 w-fit rounded-full bg-destructive/10 p-3">
            <ShieldAlert className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle>Acceso Denegado</CardTitle>
          <CardDescription>No tienes permisos para acceder a esta sección.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={() => {
              window.history.back()
            }}
          >
            Volver
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

interface CanProps {
  children: ReactNode
  usuario: Usuario | null
  permission: Permission
  fallback?: ReactNode
}

/**
 * Simpler component for permission-based rendering
 */
export function Can({ children, usuario, permission, fallback = null }: CanProps) {
  const { can } = usePermissions({ usuario })

  if (!can(permission)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

interface CanAnyProps {
  children: ReactNode
  usuario: Usuario | null
  permissions: Permission[]
  fallback?: ReactNode
}

/**
 * Component that renders if user has ANY of the permissions
 */
export function CanAny({ children, usuario, permissions, fallback = null }: CanAnyProps) {
  const { hasAnyPermission } = usePermissions({ usuario })

  if (!hasAnyPermission(permissions)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

interface CanAllProps {
  children: ReactNode
  usuario: Usuario | null
  permissions: Permission[]
  fallback?: ReactNode
}

/**
 * Component that renders if user has ALL of the permissions
 */
export function CanAll({ children, usuario, permissions, fallback = null }: CanAllProps) {
  const { hasAllPermissions } = usePermissions({ usuario })

  if (!hasAllPermissions(permissions)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
