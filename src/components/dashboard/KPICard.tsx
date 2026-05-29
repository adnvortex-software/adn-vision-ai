import { type LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface KPICardProps {
  title: string
  value: string | number
  description?: string
  icon?: LucideIcon
  trend?: {
    value: number
    label?: string
    isPositive?: boolean
  }
  className?: string
  variant?: 'default' | 'success' | 'warning' | 'danger'
}

const VARIANT_STYLES = {
  default: 'bg-card',
  success: 'bg-green-50 border-green-200',
  warning: 'bg-amber-50 border-amber-200',
  danger: 'bg-red-50 border-red-200',
}

const ICON_STYLES = {
  default: 'bg-primary/10 text-primary',
  success: 'bg-green-100 text-green-600',
  warning: 'bg-amber-100 text-amber-600',
  danger: 'bg-red-100 text-red-600',
}

export function KPICard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
  variant = 'default',
}: KPICardProps) {
  const trendValue = trend?.value ?? 0
  const isPositiveTrend = trend?.isPositive ?? trendValue > 0

  const TrendIcon = trendValue === 0 ? Minus : isPositiveTrend ? TrendingUp : TrendingDown

  const trendColor =
    trendValue === 0 ? 'text-gray-500' : isPositiveTrend ? 'text-green-600' : 'text-red-600'

  return (
    <Card className={cn(VARIANT_STYLES[variant], className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {Icon && (
          <div className={cn('rounded-lg p-2', ICON_STYLES[variant])}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-bold">{value}</div>
          {trend && (
            <div className={cn('flex items-center text-xs font-medium', trendColor)}>
              <TrendIcon className="mr-1 h-3 w-3" />
              {trendValue > 0 && '+'}
              {String(trendValue)}%
              {trend.label && <span className="ml-1 text-muted-foreground">{trend.label}</span>}
            </div>
          )}
        </div>
        {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  )
}

interface KPIGridProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  columns?: 2 | 3 | 4
}

export function KPIGrid({ children, columns = 4, className, ...props }: KPIGridProps) {
  const gridClass = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }[columns]

  return (
    <div className={cn('grid gap-4', gridClass, className)} {...props}>
      {children}
    </div>
  )
}
