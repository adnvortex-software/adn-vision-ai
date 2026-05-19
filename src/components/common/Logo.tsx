import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  showText?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl',
}

export function Logo({ className, showText = true, size = 'md' }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Placeholder para logo - reemplazar con SVG real */}
      <div
        className={cn(
          'flex items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground',
          size === 'sm' && 'h-7 w-7 text-xs',
          size === 'md' && 'h-8 w-8 text-sm',
          size === 'lg' && 'h-10 w-10 text-base'
        )}
      >
        AL
      </div>
      {showText && (
        <span className={cn('font-semibold tracking-tight', sizeClasses[size])}>
          ADN <span className="text-primary">LYNX</span> AI
        </span>
      )}
    </div>
  )
}
