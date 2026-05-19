import { type ReactNode } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { MobileMenu } from './MobileMenu'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/ui.store'
import type { Usuario } from '@/types/auth'

interface AppShellProps {
  usuario: Usuario
  onLogout: () => void
  children?: ReactNode
}

export function AppShell({ usuario, onLogout, children }: AppShellProps) {
  const { sidebarCollapsed } = useUIStore()

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar - Desktop */}
      <div className="hidden md:block">
        <Sidebar usuario={usuario} />
      </div>

      {/* Mobile Menu */}
      <MobileMenu usuario={usuario} onLogout={onLogout} />

      {/* Header */}
      <Header usuario={usuario} onLogout={onLogout} />

      {/* Main Content */}
      <main
        className={cn(
          'min-h-[calc(100vh-4rem)] pt-16 transition-all duration-300',
          sidebarCollapsed ? 'md:ml-16' : 'md:ml-64'
        )}
      >
        <div className="container mx-auto p-4 md:p-6">{children ?? <Outlet />}</div>
      </main>
    </div>
  )
}
