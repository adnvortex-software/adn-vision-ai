import { useMemo, useCallback } from 'react'
import { hasPermission, canManageRole, type Permission } from '@/lib/permissions'
import type { Role } from '@/config/constants'
import type { Usuario } from '@/types/auth'

interface UsePermissionsOptions {
  usuario: Usuario | null
}

interface UsePermissionsReturn {
  can: (permission: Permission) => boolean
  canManage: (targetRole: Role) => boolean
  hasAnyPermission: (permissions: Permission[]) => boolean
  hasAllPermissions: (permissions: Permission[]) => boolean
  role: Role | null
  isInternal: boolean
  isClient: boolean
  isSuperAdmin: boolean
  clienteId: string | null
  sucursalIds: string[] | null
}

/**
 * Hook para validar permisos del usuario actual
 */
export function usePermissions({ usuario }: UsePermissionsOptions): UsePermissionsReturn {
  const role = usuario?.rol ?? null

  /**
   * Verifica si el usuario tiene un permiso específico
   */
  const can = useCallback(
    (permission: Permission): boolean => {
      if (!role) return false
      return hasPermission(role, permission)
    },
    [role]
  )

  /**
   * Verifica si el usuario puede gestionar usuarios de un rol específico
   */
  const canManage = useCallback(
    (targetRole: Role): boolean => {
      if (!role) return false
      return canManageRole(role, targetRole)
    },
    [role]
  )

  /**
   * Verifica si el usuario tiene al menos uno de los permisos
   */
  const hasAnyPermission = useCallback(
    (permissions: Permission[]): boolean => {
      if (!role) return false
      return permissions.some((permission) => hasPermission(role, permission))
    },
    [role]
  )

  /**
   * Verifica si el usuario tiene todos los permisos
   */
  const hasAllPermissions = useCallback(
    (permissions: Permission[]): boolean => {
      if (!role) return false
      return permissions.every((permission) => hasPermission(role, permission))
    },
    [role]
  )

  /**
   * Propiedades derivadas del rol
   */
  const isInternal = useMemo(() => {
    return (
      role === 'super_admin' || role === 'ops_admin' || role === 'analyst' || role === 'support'
    )
  }, [role])

  const isClient = useMemo(() => {
    return role === 'client_admin' || role === 'client_viewer'
  }, [role])

  const isSuperAdmin = useMemo(() => {
    return role === 'super_admin'
  }, [role])

  return {
    can,
    canManage,
    hasAnyPermission,
    hasAllPermissions,
    role,
    isInternal,
    isClient,
    isSuperAdmin,
    clienteId: usuario?.clienteId ?? null,
    sucursalIds: usuario?.sucursalIds ?? null,
  }
}

/**
 * Hook compuesto que combina auth y permisos
 */
export function useAuthPermissions(usuario: Usuario | null) {
  const permissions = usePermissions({ usuario })

  return {
    ...permissions,
    isAuthenticated: !!usuario,
    usuario,
  }
}
