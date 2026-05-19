import { PLACA_REGEX } from '@/config/constants'

/**
 * Formatea un número con separadores de miles (formato colombiano)
 */
export function formatNumber(value: number, decimals = 0): string {
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

/**
 * Formatea un valor como moneda (COP)
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

/**
 * Formatea un porcentaje
 */
export function formatPercent(value: number, decimals = 1): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100)
}

/**
 * Normaliza una placa a mayúsculas y sin espacios
 */
export function normalizePlaca(placa: string): string {
  return placa.toUpperCase().replace(/\s/g, '')
}

/**
 * Valida formato de placa colombiana
 */
export function isValidPlaca(placa: string): boolean {
  return PLACA_REGEX.test(normalizePlaca(placa))
}

/**
 * Formatea una placa para mostrar (ABC-123)
 */
export function formatPlaca(placa: string): string {
  const normalized = normalizePlaca(placa)
  if (normalized.length >= 6) {
    return `${normalized.slice(0, 3)}-${normalized.slice(3)}`
  }
  return normalized
}

/**
 * Formatea una cédula o NIT colombiano
 */
export function formatDocumento(documento: string): string {
  // Eliminar caracteres no numéricos
  const cleaned = documento.replace(/\D/g, '')

  // Formatear con puntos cada 3 dígitos
  return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

/**
 * Formatea un número de teléfono colombiano
 */
export function formatTelefono(telefono: string): string {
  const cleaned = telefono.replace(/\D/g, '')

  // Celular: 320 123 4567
  if (cleaned.length === 10 && cleaned.startsWith('3')) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`
  }

  // Fijo con indicativo: (601) 234 5678
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`
  }

  // Fijo sin indicativo: 234 5678
  if (cleaned.length === 7) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`
  }

  return telefono
}

/**
 * Formatea una dirección IP
 */
export function formatIP(ip: string): string {
  // Validar formato básico de IP
  const parts = ip.split('.')
  if (parts.length === 4 && parts.every((p) => /^\d{1,3}$/.test(p))) {
    return ip
  }
  return ip
}

/**
 * Formatea bytes a unidad legible
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes: readonly string[] = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const safeIndex = Math.min(i, sizes.length - 1)
  const size = sizes[safeIndex] ?? 'Bytes'
  const value = parseFloat((bytes / Math.pow(k, safeIndex)).toFixed(decimals))

  return `${String(value)} ${size}`
}
