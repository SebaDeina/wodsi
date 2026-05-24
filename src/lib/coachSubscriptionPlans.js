/** Planes de suscripción mensual del coach (Wodsi → Mercado Pago). */
export const COACH_SUBSCRIPTION_PLANS = [
  {
    id: 'starter',
    minAthletes: 0,
    maxAthletes: 20,
    amountARS: 12000,
    name: { es: 'Hasta 20 atletas', en: 'Up to 20 athletes' },
    description: {
      es: 'Ideal para boxes chicos o que recién arrancan.',
      en: 'Ideal for smaller or growing gyms.',
    },
  },
  {
    id: 'growth',
    minAthletes: 21,
    maxAthletes: 80,
    amountARS: 28000,
    name: { es: '21 a 80 atletas', en: '21 to 80 athletes' },
    description: {
      es: 'Para boxes con roster en crecimiento.',
      en: 'For gyms with a growing roster.',
    },
  },
]

export function planById(planId) {
  return COACH_SUBSCRIPTION_PLANS.find(p => p.id === planId) || null
}

/** Plan recomendado según cantidad de atletas en el roster. */
export function recommendedPlanForAthleteCount(count) {
  const n = Math.max(0, Number(count) || 0)
  if (n <= 20) return COACH_SUBSCRIPTION_PLANS[0]
  if (n <= 80) return COACH_SUBSCRIPTION_PLANS[1]
  return null
}

export function planIncludesAthleteCount(plan, count) {
  if (!plan) return false
  const n = Math.max(0, Number(count) || 0)
  return n >= plan.minAthletes && n <= plan.maxAthletes
}

export function formatPlanPriceARS(amount, lang = 'es') {
  const formatted = new Intl.NumberFormat(lang === 'es' ? 'es-AR' : 'en-US', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(amount)
  return lang === 'es' ? `${formatted} / mes` : `${formatted} / month`
}

export function subscriptionIsActive(status) {
  return status === 'active' || status === 'authorized'
}
