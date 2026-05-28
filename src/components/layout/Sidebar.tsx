import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Building2,
  Bus,
  Users,
  AlertTriangle,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/common/Logo'
import { useUIStore } from '@/stores/ui.store'
import { usePermissions } from '@/hooks/usePermissions'
import type { Usuario } from '@/types/auth'
import type { Permission } from '@/lib/permissions'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  permission?: Permission
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Clientes',
    href: '/clientes',
    icon: Building2,
    permission: 'clientes.read',
  },
  {
    label: 'Buses',
    href: '/buses',
    icon: Bus,
    permission: 'buses.read',
  },
  {
    label: 'Novedades',
    href: '/novedades',
    icon: AlertTriangle,
    permission: 'eventos.read',
  },
  {
    label: 'Reportes',
    href: '/reportes',
    icon: FileText,
    permission: 'reportes.download',
  },
  {
    label: 'Usuarios',
    href: '/usuarios',
    icon: Users,
    permission: 'usuarios.read',
  },
]

interface SidebarProps {
  usuario: Usuario | null
}

export function Sidebar({ usuario }: SidebarProps) {
  const location = useLocation()
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const { can } = usePermissions({ usuario })

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (!item.permission) return true
    return can(item.permission)
  })

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen border-r bg-card transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div
          className={cn(
            'flex h-16 items-center border-b px-4',
            sidebarCollapsed ? 'justify-center' : 'justify-between'
          )}
        >
          {!sidebarCollapsed && <Logo className="h-8" />}
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="h-8 w-8">
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-2">
          {visibleItems.map((item) => {
            const isActive = location.pathname.startsWith(item.href)
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  sidebarCollapsed && 'justify-center px-2'
                )}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Settings (bottom) */}
        <div className="border-t p-2">
          <Link
            to="/configuracion"
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
              sidebarCollapsed && 'justify-center px-2'
            )}
            title={sidebarCollapsed ? 'Configuración' : undefined}
          >
            <Settings className="h-5 w-5 flex-shrink-0" />
            {!sidebarCollapsed && <span>Configuración</span>}
          </Link>
        </div>
      </div>
    </aside>
  )
}
