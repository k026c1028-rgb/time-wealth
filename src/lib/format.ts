export function clampNumber(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

export function formatMoney(amount: number, currency: string) {
  const safe = Number.isFinite(amount) ? amount : 0
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: safe < 1 ? 4 : 2,
    }).format(safe)
  } catch {
    // Fallback for invalid/unsupported currency codes
    return `${safe.toFixed(safe < 1 ? 4 : 2)} ${currency}`
  }
}

export function formatJPY(amount: number) {
  const safe = Number.isFinite(amount) ? amount : 0
  try {
    // Force "JP¥" prefix for consistency with the requirement.
    const digits = safe < 1 ? 2 : 0
    const num = new Intl.NumberFormat(undefined, {
      style: 'decimal',
      maximumFractionDigits: digits,
      minimumFractionDigits: digits,
    }).format(safe)
    return `JP¥${num}`
  } catch {
    return `JP¥${safe.toFixed(safe < 1 ? 2 : 0)}`
  }
}

export function formatHours(hours: number) {
  const safe = Number.isFinite(hours) ? hours : 0
  return `${safe.toFixed(safe < 10 ? 1 : 1)}`
}

export function formatCompactNumber(n: number) {
  const safe = Number.isFinite(n) ? n : 0
  return new Intl.NumberFormat(undefined, { notation: 'compact' }).format(safe)
}

export function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0s'
  const s = Math.floor(seconds)
  const days = Math.floor(s / 86400)
  const hours = Math.floor((s % 86400) / 3600)
  const minutes = Math.floor((s % 3600) / 60)
  const secs = s % 60

  const parts: string[] = []
  if (days) parts.push(`${days}d`)
  if (hours) parts.push(`${hours}h`)
  if (minutes) parts.push(`${minutes}m`)
  if (!parts.length) parts.push(`${secs}s`)
  return parts.join(' ')
}

export function formatDateTime(tsMs: number) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(tsMs))
  } catch {
    return new Date(tsMs).toLocaleString()
  }
}
