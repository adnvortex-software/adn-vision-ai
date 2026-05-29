import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard,
  Building2,
  Bus,
  ClipboardList,
  Users,
  AlertTriangle,
  Settings,
  X,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Logo } from '@/components/common/Logo'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useUIStore } from '@/stores/ui.store'
import { usePermissions } from '@/hooks/usePermissions'
import type { Usuario } from '@/types/auth'
import type { Permission } from '@/lib/permissions'

interface NavItem {
  labelKey: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  permission?: Permission
}

const NAV_ITEMS: NavItem[] = [
  {
    labelKey: 'nav.dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    labelKey: 'nav.clientes',
    href: '/clientes',
    icon: Building2,
    permission: 'clientes.read',
  },
  {
    labelKey: 'nav.buses',
    href: '/buses',
    icon: Bus,
    permission: 'buses.read',
  },
  {
    labelKey: 'nav.despachos',
    href: '/despachos',
    icon: ClipboardList,
    permission: 'buses.read',
  },
  {
    labelKey: 'nav.novedades',
    href: '/novedades',
    icon: AlertTriangle,
    permission: 'eventos.read',
  },
  {
    labelKey: 'nav.usuarios',
    href: '/usuarios',
    icon: Users,
    permission: 'usuarios.read',
  },
]

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

interface MobileMenuProps {
  usuario: Usuario | null
  onLogout: () => void
}

export function MobileMenu({ usuario, onLogout }: MobileMenuProps) {
  const location = useLocation()
  const { t } = useTranslation()
  const { mobileMenuOpen, setMobileMenuOpen } = useUIStore()
  const { can } = usePermissions({ usuario })

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (!item.permission) return true
    return can(item.permission)
  })

  const handleNavClick = () => {
    setMobileMenuOpen(false)
  }

  return (
    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="border-b p-4">
          <div className="flex items-center justify-between">
            <SheetTitle asChild>
              <Logo className="h-8" />
            </SheetTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setMobileMenuOpen(false)
              }}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </SheetHeader>

        {/* User info */}
        {usuario && (
          <div className="border-b p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={(usuario as { fotoUrl?: string }).fotoUrl ?? undefined}
                  alt={usuario.nombre}
                />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getInitials(usuario.nombre)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <p className="truncate font-medium">{usuario.nombre}</p>
                <p className="truncate text-sm text-muted-foreground">{usuario.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-2">
          {visibleItems.map((item) => {
            const isActive = location.pathname.startsWith(item.href)
            const Icon = item.icon
            const label = t(item.labelKey)

            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={handleNavClick}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span>{label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Bottom actions */}
        <div className="border-t p-2">
          <Link
            to="/configuracion"
            onClick={handleNavClick}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Settings className="h-5 w-5 flex-shrink-0" />
            <span>{t('nav.configuracion')}</span>
          </Link>
          <button
            onClick={() => {
              handleNavClick()
              onLogout()
            }}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            <span>{t('auth.logout')}</span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
