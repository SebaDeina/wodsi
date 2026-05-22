const FALLBACKS = {
  nombre: 'atleta',
  monto: '—',
  alias: '—',
}

export function renderTemplate(template, vars = {}) {
  if (!template) return ''
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const v = vars[key]
    if (v != null && v !== '') return String(v)
    return FALLBACKS[key] ?? ''
  })
}

export function varsForAthlete(athlete, billing = {}) {
  const first = (athlete?.name || '').trim().split(/\s+/)[0] || 'atleta'
  return {
    nombre: first,
    monto: billing.membershipAmount || '',
    alias: billing.paymentAlias || '',
    slug: athlete?.id?.slice(0, 8) || '',
    dias: '',
    movimiento: '',
    peso: '',
    racha: '',
    sesiones: '',
  }
}
