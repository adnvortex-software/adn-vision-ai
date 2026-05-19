import type { Role } from '@/config/constants'

// Acciones del sistema
export type Permission =
  | 'clientes.create'
  | 'clientes.read'
  | 'clientes.update'
  | 'clientes.delete'
  | 'sucursales.create'
  | 'sucursales.read'
  | 'sucursales.update'
  | 'sucursales.delete'
  | 'propietarios.create'
  | 'propietarios.read'
  | 'propietarios.update'
  | 'propietarios.delete'
  | 'conductores.create'
  | 'conductores.read'
  | 'conductores.update'
  | 'conductores.delete'
  | 'buses.create'
  | 'buses.read'
  | 'buses.update'
  | 'buses.delete'
  | 'camaras.configure'
  | 'novedades.configure'
  | 'eventos.read'
  | 'eventos.resolve'
  | 'reportes.generate'
  | 'reportes.download'
  | 'usuarios.create'
  | 'usuarios.read'
  | 'usuarios.update'
  | 'usuarios.delete'
  | 'catalogo.manage'
  | 'audit.read'

// Matriz de permisos por rol
const PERMISSION_MATRIX: Record<Role, Permission[]> = {
  super_admin: [
    'clientes.create',
    'clientes.read',
    'clientes.update',
    'clientes.delete',
    'sucursales.create',
    'sucursales.read',
    'sucursales.update',
    'sucursales.delete',
    'propietarios.create',
    'propietarios.read',
    'propietarios.update',
    'propietarios.delete',
    'conductores.create',
    'conductores.read',
    'conductores.update',
    'conductores.delete',
    'buses.create',
    'buses.read',
    'buses.update',
    'buses.delete',
    'camaras.configure',
    'novedades.configure',
    'eventos.read',
    'eventos.resolve',
    'reportes.generate',
    'reportes.download',
    'usuarios.create',
    'usuarios.read',
    'usuarios.update',
    'usuarios.delete',
    'catalogo.manage',
    'audit.read',
  ],
  ops_admin: [
    'clientes.create',
    'clientes.read',
    'clientes.update',
    'sucursales.create',
    'sucursales.read',
    'sucursales.update',
    'sucursales.delete',
    'propietarios.create',
    'propietarios.read',
    'propietarios.update',
    'propietarios.delete',
    'conductores.create',
    'conductores.read',
    'conductores.update',
    'conductores.delete',
    'buses.create',
    'buses.read',
    'buses.update',
    'buses.delete',
    'camaras.configure',
    'novedades.configure',
    'eventos.read',
    'eventos.resolve',
    'reportes.generate',
    'reportes.download',
    'usuarios.read',
    'audit.read',
  ],
  analyst: [
    'clientes.read',
    'sucursales.read',
    'propietarios.read',
    'conductores.read',
    'buses.read',
    'eventos.read',
    'eventos.resolve',
    'reportes.generate',
    'reportes.download',
    'usuarios.create', // Solo puede crear client_admin y client_viewer
    'usuarios.read',
  ],
  support: [
    'clientes.read',
    'sucursales.read',
    'propietarios.read',
    'conductores.read',
    'buses.read',
    'eventos.read',
    'reportes.download',
    'usuarios.read',
  ],
  client_admin: [
    'buses.read', // Solo sus buses
    'conductores.read', // Solo sus conductores
    'eventos.read', // Solo sus eventos
    'reportes.generate',
    'reportes.download',
    'usuarios.create', // Solo client_viewer de su cliente
    'usuarios.read', // Solo usuarios de su cliente
    'usuarios.update', // Solo client_viewer de su cliente
  ],
  client_viewer: [
    'buses.read', // Limitado por sucursal/propietario
    'conductores.read',
    'eventos.read',
    'reportes.download',
  ],
}

/**
 * Verifica si un rol tiene un permiso específico
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  return PERMISSION_MATRIX[role].includes(permission)
}

/**
 * Verifica si un rol es interno (empleado de ADN Lynx)
 */
export function isInternalRole(role: Role): boolean {
  return ['super_admin', 'ops_admin', 'analyst', 'support'].includes(role)
}

/**
 * Verifica si un rol es de cliente
 */
export function isClientRole(role: Role): boolean {
  return ['client_admin', 'client_viewer'].includes(role)
}

/**
 * Obtiene todos los permisos de un rol
 */
export function getPermissions(role: Role): Permission[] {
  return PERMISSION_MATRIX[role]
}

/**
 * Verifica si un rol puede gestionar a otro rol
 */
export function canManageRole(managerRole: Role, targetRole: Role): boolean {
  const roleHierarchy: Record<Role, number> = {
    super_admin: 100,
    ops_admin: 80,
    analyst: 60,
    support: 40,
    client_admin: 30,
    client_viewer: 20,
  }

  // Solo super_admin puede gestionar otros super_admin
  if (targetRole === 'super_admin') {
    return managerRole === 'super_admin'
  }

  // analyst solo puede crear usuarios de cliente
  if (managerRole === 'analyst') {
    return isClientRole(targetRole)
  }

  // client_admin solo puede gestionar client_viewer de su mismo cliente
  if (managerRole === 'client_admin') {
    return targetRole === 'client_viewer'
  }

  return roleHierarchy[managerRole] > roleHierarchy[targetRole]
}
