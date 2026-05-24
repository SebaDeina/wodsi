const BASE = (import.meta.env.VITE_BILLING_API_URL || '').replace(/\/$/, '')

function billingUrl(path) {
  if (BASE) return `${BASE}${path}`
  return path
}

async function parseJson(res) {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = data.error || data.message || res.statusText || 'Request failed'
    throw new Error(msg)
  }
  return data
}

export async function fetchCoachSubscription(idToken) {
  const res = await fetch(billingUrl('/api/subscription/me'), {
    headers: { Authorization: `Bearer ${idToken}` },
  })
  return parseJson(res)
}

export async function createCoachSubscriptionCheckout(idToken, tierId) {
  const res = await fetch(billingUrl('/api/subscription/checkout'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ tierId }),
  })
  return parseJson(res)
}

export async function syncCoachSubscription(idToken) {
  const res = await fetch(billingUrl('/api/subscription/sync'), {
    method: 'POST',
    headers: { Authorization: `Bearer ${idToken}` },
  })
  return parseJson(res)
}

/** Marca plan elegido antes de abrir el link fijo de Mercado Pago. */
export async function registerCoachPlanIntent(idToken, tierId) {
  const res = await fetch(billingUrl('/api/subscription/intent'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ tierId }),
  })
  return parseJson(res)
}
