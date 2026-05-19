import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { AlertCircle } from 'lucide-react'

interface FormFieldProps {
  label?: string
  description?: string
  error?: string
  required?: boolean
  children: ReactNode
  className?: string
  id?: string
}

export function FormField({
  label,
  description,
  error,
  required,
  children,
  className,
  id,
}: FormFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label htmlFor={id} className={cn(error && 'text-destructive')}>
          {label}
          {required && <span className="ml-1 text-destructive">*</span>}
        </Label>
      )}
      {children}
      {description && !error && <p className="text-sm text-muted-foreground">{description}</p>}
      {error && (
        <p className="flex items-center gap-1 text-sm text-destructive">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  )
}

interface FormSectionProps {
  title: string
  description?: string
  children: ReactNode
  className?: string
}

export function FormSection({ title, description, children, className }: FormSectionProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="space-y-1">
        <h3 className="text-lg font-medium">{title}</h3>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      <div className="grid gap-4">{children}</div>
    </div>
  )
}

interface FormGridProps {
  children: ReactNode
  columns?: 1 | 2 | 3 | 4
  className?: string
}

export function FormGrid({ children, columns = 2, className }: FormGridProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }

  return <div className={cn('grid gap-4', gridCols[columns], className)}>{children}</div>
}
