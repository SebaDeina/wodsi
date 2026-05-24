const TZ = process.env.TZ || 'America/Argentina/Buenos_Aires'

export function todayDateKey(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function parseDateKey(key) {
  if (!key || typeof key !== 'string') return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key.trim())
  if (!m) return null
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])))
  return Number.isNaN(d.getTime()) ? null : d
}

function daysFromDateKey(fromKey, toKey) {
  const a = parseDateKey(fromKey)
  const b = parseDateKey(toKey)
  if (!a || !b) return null
  return Math.round((b.getTime() - a.getTime()) / 86400000)
}

export function daysOverdue(paidUntil) {
  if (!paidUntil) return null
  const diff = daysFromDateKey(paidUntil, todayDateKey())
  return diff == null ? null : Math.max(0, diff)
}

export function isDueToday(paidUntil) {
  return paidUntil && paidUntil === todayDateKey()
}
