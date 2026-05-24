/** Links o IDs de planes de suscripción en Mercado Pago. */
const LINKS = {
  starter: import.meta.env.VITE_MP_LINK_STARTER || '',
  growth: import.meta.env.VITE_MP_LINK_GROWTH || '',
}

const PLAN_IDS = {
  starter: import.meta.env.VITE_MP_PLAN_ID_STARTER || '',
  growth: import.meta.env.VITE_MP_PLAN_ID_GROWTH || '',
}

const MP_CHECKOUT_BASE = 'https://www.mercadopago.com.ar/subscriptions/checkout'

export function mercadoPagoPlanUrl(tierId) {
  const direct = LINKS[tierId]
  if (direct && String(direct).trim()) return String(direct).trim()

  const planId = PLAN_IDS[tierId]
  if (planId && String(planId).trim()) {
    return `${MP_CHECKOUT_BASE}?preapproval_plan_id=${String(planId).trim()}`
  }
  return null
}

export function hasMercadoPagoPlanLinks() {
  return Boolean(mercadoPagoPlanUrl('starter') || mercadoPagoPlanUrl('growth'))
}
