import { ChevronRight, Home } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[]
  className?: string
  showHome?: boolean
}

// Mapeo de rutas a labels
const ROUTE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  clientes: 'Clientes',
  buses: 'Buses',
  conductores: 'Conductores',
  novedades: 'Novedades',
  eventos: 'Eventos',
  reportes: 'Reportes',
  usuarios: 'Usuarios',
  configuracion: 'Configuración',
  perfil: 'Mi Perfil',
  nuevo: 'Nuevo',
  editar: 'Editar',
}

function getRouteLabel(segment: string): string {
  return ROUTE_LABELS[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1)
}

export function Breadcrumbs({ items, className, showHome = true }: BreadcrumbsProps) {
  const location = useLocation()

  // Si no se proporcionan items, generar desde la URL
  const breadcrumbItems: BreadcrumbItem[] = items ?? generateBreadcrumbs(location.pathname)

  if (breadcrumbItems.length === 0 && !showHome) {
    return null
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center text-sm text-muted-foreground', className)}
    >
      <ol className="flex items-center gap-1">
        {showHome && (
          <li className="flex items-center">
            <Link to="/" className="flex items-center transition-colors hover:text-foreground">
              <Home className="h-4 w-4" />
              <span className="sr-only">Inicio</span>
            </Link>
          </li>
        )}

        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1

          return (
            <li key={item.label} className="flex items-center">
              <ChevronRight className="mx-1 h-4 w-4" />
              {isLast || !item.href ? (
                <span
                  className={cn(isLast && 'font-medium text-foreground')}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <Link to={item.href} className="transition-colors hover:text-foreground">
                  {item.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean)
  const items: BreadcrumbItem[] = []

  let currentPath = ''

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]
    if (!segment) continue

    currentPath += `/${segment}`
    const isLast = i === segments.length - 1

    // Skip IDs (assumed to be long strings or UUIDs)
    if (segment.length > 20 || /^[a-f0-9-]{36}$/i.test(segment)) {
      continue
    }

    items.push({
      label: getRouteLabel(segment),
      href: isLast ? undefined : currentPath,
    })
  }

  return items
}
