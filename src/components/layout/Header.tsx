import { Menu, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from './ThemeToggle'
import { LanguageToggle } from './LanguageToggle'
import { UserMenu } from './UserMenu'
import { Breadcrumbs } from './Breadcrumbs'
import { useUIStore } from '@/stores/ui.store'
import { cn } from '@/lib/utils'
import type { Usuario } from '@/types/auth'

interface HeaderProps {
  usuario: Usuario
  onLogout: () => void
  showBreadcrumbs?: boolean
}

export function Header({ usuario, onLogout, showBreadcrumbs = true }: HeaderProps) {
  const { sidebarCollapsed, setMobileMenuOpen } = useUIStore()

  return (
    <header
      className={cn(
        'fixed top-0 z-30 h-16 border-b bg-background/95 backdrop-blur transition-all duration-300 supports-[backdrop-filter]:bg-background/60',
        sidebarCollapsed ? 'left-16' : 'left-64',
        'right-0'
      )}
    >
      <div className="flex h-full items-center justify-between px-4">
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => {
              setMobileMenuOpen(true)
            }}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Abrir menú</span>
          </Button>

          {/* Breadcrumbs */}
          {showBreadcrumbs && <Breadcrumbs className="hidden md:flex" />}
        </div>

        <div className="flex items-center gap-2">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {/* Notification badge - uncomment when implementing notifications */}
            {/* <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" /> */}
            <span className="sr-only">Notificaciones</span>
          </Button>

          {/* Language toggle */}
          <LanguageToggle />

          {/* Theme toggle */}
          <ThemeToggle />

          {/* User menu */}
          <div data-tour="header-user-menu">
            <UserMenu usuario={usuario} onLogout={onLogout} />
          </div>
        </div>
      </div>
    </header>
  )
}
