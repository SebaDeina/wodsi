import { daysOverdue } from './membership.js'

const FALLBACKS = {
  nombre: 'atleta',
  monto: '—',
  alias: '—',
  vencimiento: '—',
}

export function renderTemplate(template, vars = {}) {
  if (!template) return ''
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const v = vars[key]
    if (v != null && v !== '') return String(v)
    return FALLBACKS[key] ?? ''
  })
}

function formatDateKeyEs(key) {
  if (!key) return ''
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key)
  if (!m) return key
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])))
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
}

export function varsForAthlete(athlete, billing = {}) {
  const first = (athlete?.name || '').trim().split(/\s+/)[0] || 'atleta'
  const overdue = athlete?.paidUntil ? daysOverdue(athlete.paidUntil) : null
  return {
    nombre: first,
    monto: billing.membershipAmount || '',
    alias: billing.paymentAlias || '',
    vencimiento: formatDateKeyEs(athlete?.paidUntil) || '',
    slug: athlete?.id?.slice(0, 8) || '',
    dias: overdue != null && overdue > 0 ? String(overdue) : '',
    movimiento: '',
    peso: '',
    racha: '',
    sesiones: '',
  }
}
