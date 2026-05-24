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

export function billingMonthKey(date = new Date()) {
  return todayDateKey(date).slice(0, 7)
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

export function clampPlanDueDay(day) {
  const n = parseInt(day, 10)
  if (Number.isNaN(n)) return 1
  return Math.min(31, Math.max(1, n))
}

/** Fecha de vencimiento del mes YYYY-MM según el día del plan (1–31). */
export function dueDateKeyForMonth(yearMonth, planDueDay) {
  if (!yearMonth || !/^\d{4}-\d{2}$/.test(yearMonth)) return null
  const [y, m] = yearMonth.split('-').map(Number)
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate()
  const day = Math.min(clampPlanDueDay(planDueDay), lastDay)
  return `${yearMonth}-${String(day).padStart(2, '0')}`
}

export function isPaidForBillingMonth(paidForMonth, billingMonth = billingMonthKey()) {
  if (!paidForMonth) return false
  return paidForMonth >= billingMonth
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

/**
 * Estado de membresía: plan mensual (planDueDay + paidForMonth) o legacy paidUntil.
 * @param {object} athlete
 */
export function membershipStatusFromAthlete(athlete) {
  const manual = athlete?.status
  if (manual === 'paused' || manual === 'new') return manual

  const planDueDay = athlete?.planDueDay
  const paidForMonth = athlete?.paidForMonth

  if (planDueDay == null && !paidForMonth) {
    return membershipStatusFromDates(athlete?.paidUntil, manual)
  }

  const month = billingMonthKey()
  const dueKey = dueDateKeyForMonth(month, planDueDay || 1)
  const today = todayDateKey()

  if (isPaidForBillingMonth(paidForMonth, month)) return 'active'
  if (dueKey && today > dueKey) return 'overdue'
  return manual || 'active'
}

/** true si falta marcar pago del mes actual pero aún no pasó el día de vencimiento. */
export function isPaymentPendingThisMonth(athlete) {
  const month = billingMonthKey()
  if (isPaidForBillingMonth(athlete?.paidForMonth, month)) return false
  const dueKey = dueDateKeyForMonth(month, athlete?.planDueDay || 1)
  if (!dueKey) return false
  return todayDateKey() <= dueKey
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

export function formatBillingMonth(yearMonth, lang = 'es') {
  if (!yearMonth) return '—'
  const [y, m] = yearMonth.split('-').map(Number)
  if (!y || !m) return yearMonth
  const d = new Date(Date.UTC(y, m - 1, 1))
  return d.toLocaleDateString(lang === 'es' ? 'es-AR' : 'en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export function planDueDayLabel(planDueDay, lang = 'es') {
  const d = clampPlanDueDay(planDueDay)
  if (lang === 'es') return `Día ${d} de cada mes`
  return `Day ${d} of each month`
}

/** Marca pago del mes en curso y sincroniza paidUntil para WhatsApp / legacy. */
export function paymentPatchForCurrentMonth(planDueDay = 1) {
  const day = clampPlanDueDay(planDueDay)
  const month = billingMonthKey()
  const lastPaidAt = todayDateKey()
  return {
    planDueDay: day,
    paidForMonth: month,
    lastPaidAt,
    paidUntil: dueDateKeyForMonth(month, day),
    status: 'active',
  }
}

export function clearCurrentMonthPaymentPatch(planDueDay = 1) {
  const month = billingMonthKey()
  const dueKey = dueDateKeyForMonth(month, planDueDay)
  const today = todayDateKey()
  return {
    paidForMonth: null,
    lastPaidAt: null,
    paidUntil: dueKey,
    status: dueKey && today > dueKey ? 'overdue' : 'active',
  }
}

/** @deprecated Usar paymentPatchForCurrentMonth */
export function defaultPaymentPatch(planDueDay = 1) {
  return paymentPatchForCurrentMonth(planDueDay)
}
