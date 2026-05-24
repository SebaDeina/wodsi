const TZ = 'America/Argentina/Buenos_Aires'

/** YYYY-MM-DD en zona del box (Argentina por defecto). */
export function todayDateKey(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

export function parseDateKey(key) {
  if (!key || typeof key !== 'string') return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key.trim())
  if (!m) return null
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])))
  return Number.isNaN(d.getTime()) ? null : d
}

export function toDateInputValue(value) {
  if (!value) return ''
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  if (value?.toDate) return todayDateKey(value.toDate())
  if (value instanceof Date) return todayDateKey(value)
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? '' : todayDateKey(d)
}

export function addDaysToDateKey(key, days) {
  const d = parseDateKey(key) || parseDateKey(todayDateKey())
  d.setUTCDate(d.getUTCDate() + days)
  return todayDateKey(d)
}

export function daysFromDateKey(fromKey, toKey = todayDateKey()) {
  const a = parseDateKey(fromKey)
  const b = parseDateKey(toKey)
  if (!a || !b) return null
  return Math.round((b.getTime() - a.getTime()) / 86400000)
}

/** Días hasta vencimiento (negativo = vencido). */
export function daysUntilExpiry(paidUntil) {
  if (!paidUntil) return null
  return -daysFromDateKey(paidUntil, todayDateKey())
}

export function membershipStatusFromDates(paidUntil, manualStatus) {
  if (manualStatus === 'paused' || manualStatus === 'new') return manualStatus
  if (!paidUntil) return manualStatus || 'active'
  const left = daysUntilExpiry(paidUntil)
  if (left == null) return manualStatus || 'active'
  if (left < 0) return 'overdue'
  return 'active'
}

export function formatDateKey(key, lang = 'es') {
  const d = parseDateKey(key)
  if (!d) return '—'
  return d.toLocaleDateString(lang === 'es' ? 'es-AR' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

/** Registro rápido: pago hoy + vencimiento a 30 días. */
export function defaultPaymentPatch() {
  const lastPaidAt = todayDateKey()
  return {
    lastPaidAt,
    paidUntil: addDaysToDateKey(lastPaidAt, 30),
    status: 'active',
  }
}
