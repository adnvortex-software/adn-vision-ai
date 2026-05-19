import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Calendar as CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export interface DateRangeValue {
  from: Date | undefined
  to?: Date | undefined
}

interface DateRangePickerProps {
  value?: DateRangeValue
  onChange?: (range: DateRangeValue | undefined) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  numberOfMonths?: 1 | 2
}

export function DateRangePicker({
  value,
  onChange,
  placeholder = 'Seleccionar rango',
  className,
  disabled = false,
  numberOfMonths = 2,
}: DateRangePickerProps) {
  const formatRange = () => {
    if (!value?.from) {
      return placeholder
    }

    if (value.to) {
      return `${format(value.from, 'dd/MM/yyyy', { locale: es })} - ${format(
        value.to,
        'dd/MM/yyyy',
        { locale: es }
      )}`
    }

    return format(value.from, 'dd/MM/yyyy', { locale: es })
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal',
            !value?.from && 'text-muted-foreground',
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {formatRange()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          initialFocus
          mode="range"
          defaultMonth={value?.from}
          selected={value}
          onSelect={onChange}
          numberOfMonths={numberOfMonths}
          locale={es}
        />
      </PopoverContent>
    </Popover>
  )
}

interface SingleDatePickerProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  minDate?: Date
  maxDate?: Date
}

export function SingleDatePicker({
  value,
  onChange,
  placeholder = 'Seleccionar fecha',
  className,
  disabled = false,
  minDate,
  maxDate,
}: SingleDatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal',
            !value && 'text-muted-foreground',
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, 'dd/MM/yyyy', { locale: es }) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          initialFocus
          locale={es}
          disabled={(date) => {
            if (minDate && date < minDate) return true
            if (maxDate && date > maxDate) return true
            return false
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
