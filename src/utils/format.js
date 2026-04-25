/**
 * Format a number to a compact string (e.g. 1500 → "1.5K")
 */
export function formatNumber(n) {
  if (n === null || n === undefined) return '0'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

/**
 * Format a price in ARS (Argentine Peso)
 */
export function formatCurrency(amount, currency = 'ARS') {
  return new Intl.NumberFormat('es-AR', {
    style:    'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format a percentage
 */
export function formatPercent(value, decimals = 1) {
  return `${Number(value).toFixed(decimals)}%`
}

/**
 * Truncate a string to maxLength
 */
export function truncate(str, maxLength = 60) {
  if (!str) return ''
  return str.length > maxLength ? `${str.slice(0, maxLength)}...` : str
}

/**
 * Format a relative time string (e.g. "hace 2 horas")
 */
export function timeAgo(date) {
  const now  = new Date()
  const diff = (now - new Date(date)) / 1000 // seconds

  if (diff < 60)      return 'ahora'
  if (diff < 3600)    return `hace ${Math.floor(diff / 60)} min`
  if (diff < 86400)   return `hace ${Math.floor(diff / 3600)} h`
  if (diff < 604800)  return `hace ${Math.floor(diff / 86400)} días`
  if (diff < 2592000) return `hace ${Math.floor(diff / 604800)} semanas`
  return new Date(date).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
}
