/** Lunes como inicio de semana (estilo CrossFit / ES). */
export function startOfWeek(date = new Date(), weekStartsOn = 1) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  const diff = (day - weekStartsOn + 7) % 7
  d.setDate(d.getDate() - diff)
  return d
}

export function addDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export function toDateKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function parseDateKey(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
}

export function formatHeaderDate(date, lang) {
  const locale = lang === 'es' ? 'es-AR' : 'en-US'
  return date.toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatDayLabel(date, lang) {
  const locale = lang === 'es' ? 'es-AR' : 'en-US'
  const wd = date.toLocaleDateString(locale, { weekday: 'short' }).toUpperCase().replace('.', '')
  return `${wd} ${date.getDate()}`
}

export function isSameDay(a, b) {
  return toDateKey(a) === toDateKey(b)
}

export function isToday(date) {
  return isSameDay(date, new Date())
}

/** Rango legible de la semana que empieza en weekStartKey (lunes). */
export function formatWeekRangeFromStartKey(weekStartKey, lang = 'es') {
  const start = parseDateKey(weekStartKey)
  const end = addDays(start, 6)
  if (lang === 'es') {
    return `${start.getDate()}–${end.getDate()} ${end.toLocaleDateString('es-AR', { month: 'long' })}`
  }
  return `${start.toLocaleDateString('en-US', { month: 'short' })} ${start.getDate()}–${end.getDate()}`
}
