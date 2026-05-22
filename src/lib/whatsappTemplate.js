/** Reemplaza variables {{clave}} en plantillas de WhatsApp. */

const FALLBACKS = {
  nombre: 'atleta',
  monto: '—',
  alias: '—',
}

export function renderWhatsAppTemplate(template, vars = {}) {
  if (!template) return ''
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const v = vars[key]
    if (v != null && v !== '') return String(v)
    return FALLBACKS[key] ?? ''
  })
}

export function athleteTemplateVars(athlete, extra = {}, billing = {}) {
  const first = (athlete?.name || '').trim().split(/\s+/)[0] || 'atleta'
  return {
    nombre: first,
    monto: extra.monto ?? billing.membershipAmount ?? '',
    slug: extra.slug ?? '',
    dias: extra.dias != null ? String(extra.dias) : '',
    alias: extra.alias ?? billing.paymentAlias ?? '',
    movimiento: extra.movimiento ?? '',
    peso: extra.peso ?? '',
    racha: extra.racha ?? '',
    sesiones: extra.sesiones ?? '',
  }
}
