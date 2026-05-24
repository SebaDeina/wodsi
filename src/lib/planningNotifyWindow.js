/** Ventana de envío de avisos de planificación (hora local del box). */

export const PLANNING_NOTIFY_TZ = 'America/Argentina/Buenos_Aires'
export const PLANNING_NOTIFY_START_HOUR = 9
/** 20:00 = primer minuto fuera de ventana (se envía hasta las 19:59). */
export const PLANNING_NOTIFY_END_HOUR = 20

function getLocalParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: PLANNING_NOTIFY_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date)
  const get = type => Number(parts.find(p => p.type === type)?.value || 0)
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
  }
}

function buildDateInTz(year, month, day, hour, minute) {
  const pad = n => String(n).padStart(2, '0')
  return new Date(
    `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00-03:00`,
  )
}

function addCalendarDays(parts, delta) {
  const noon = buildDateInTz(parts.year, parts.month, parts.day, 12, 0)
  return getLocalParts(new Date(noon.getTime() + delta * 86400000))
}

/**
 * @returns {Date | null} Si está fuera de 9:00–20:00, próximo instante permitido (hoy o mañana 9:00).
 */
export function computePlanningSendAfter(now = new Date()) {
  const p = getLocalParts(now)
  const minutes = p.hour * 60 + p.minute
  const start = PLANNING_NOTIFY_START_HOUR * 60
  const end = PLANNING_NOTIFY_END_HOUR * 60

  if (minutes >= start && minutes < end) return null

  if (minutes < start) {
    return buildDateInTz(p.year, p.month, p.day, PLANNING_NOTIFY_START_HOUR, 0)
  }

  const tomorrow = addCalendarDays(p, 1)
  return buildDateInTz(
    tomorrow.year,
    tomorrow.month,
    tomorrow.day,
    PLANNING_NOTIFY_START_HOUR,
    0,
  )
}
