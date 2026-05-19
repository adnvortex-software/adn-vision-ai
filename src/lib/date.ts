import { format, parseISO, isValid } from 'date-fns'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'
import { es } from 'date-fns/locale'
import { TIMEZONE, DATE_FORMATS } from '@/config/constants'

/**
 * Convierte una fecha UTC a zona horaria de Bogotá
 */
export function toBogotaTime(date: Date | string | number): Date {
  const parsed = typeof date === 'string' ? parseISO(date) : new Date(date)
  return toZonedTime(parsed, TIMEZONE)
}

/**
 * Convierte una fecha en zona horaria de Bogotá a UTC
 */
export function fromBogotaTime(date: Date): Date {
  return fromZonedTime(date, TIMEZONE)
}

/**
 * Formatea una fecha para mostrar en UI (zona Bogotá)
 */
export function formatDate(date: Date | string | number, formatStr?: string): string {
  const bogotaDate = toBogotaTime(date)
  return format(bogotaDate, formatStr ?? DATE_FORMATS.display, { locale: es })
}

/**
 * Formatea una fecha con hora para mostrar en UI
 */
export function formatDateTime(date: Date | string | number): string {
  return formatDate(date, DATE_FORMATS.displayWithTime)
}

/**
 * Formatea solo la hora
 */
export function formatTime(date: Date | string | number): string {
  return formatDate(date, DATE_FORMATS.time)
}

/**
 * Formatea una fecha completa legible
 */
export function formatDateFull(date: Date | string | number): string {
  return formatDate(date, DATE_FORMATS.displayFull)
}

/**
 * Obtiene la fecha operativa actual en formato ISO (YYYY-MM-DD)
 * La fecha operativa cambia a medianoche hora Bogotá
 */
export function getCurrentOperativeDate(): string {
  const now = toBogotaTime(new Date())
  return format(now, DATE_FORMATS.iso)
}

/**
 * Verifica si una fecha es válida
 */
export function isValidDate(date: unknown): date is Date {
  return date instanceof Date && isValid(date)
}

/**
 * Obtiene el inicio del día en zona Bogotá
 */
export function startOfDayBogota(date: Date | string | number): Date {
  const bogotaDate = toBogotaTime(date)
  bogotaDate.setHours(0, 0, 0, 0)
  return fromBogotaTime(bogotaDate)
}

/**
 * Obtiene el fin del día en zona Bogotá
 */
export function endOfDayBogota(date: Date | string | number): Date {
  const bogotaDate = toBogotaTime(date)
  bogotaDate.setHours(23, 59, 59, 999)
  return fromBogotaTime(bogotaDate)
}
