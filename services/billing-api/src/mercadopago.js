const MP_BASE = 'https://api.mercadopago.com'

function token() {
  const t = process.env.MP_ACCESS_TOKEN
  if (!t) throw new Error('MP_ACCESS_TOKEN no configurado')
  return t
}

async function mpFetch(path, options = {}) {
  const res = await fetch(`${MP_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token()}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = data.message || data.error || JSON.stringify(data)
    throw new Error(`Mercado Pago: ${msg}`)
  }
  return data
}

export async function createPreapproval({ reason, amountARS, externalReference, payerEmail, backUrl }) {
  return mpFetch('/preapproval', {
    method: 'POST',
    body: JSON.stringify({
      reason,
      external_reference: externalReference,
      payer_email: payerEmail,
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: amountARS,
        currency_id: 'ARS',
      },
      back_url: backUrl,
      status: 'pending',
    }),
  })
}

export async function getPreapproval(id) {
  return mpFetch(`/preapproval/${id}`)
}

export async function getPayment(id) {
  return mpFetch(`/v1/payments/${id}`)
}

export async function getAuthorizedPayment(id) {
  return mpFetch(`/authorized_payments/${id}`)
}

export async function cancelPreapproval(id) {
  return mpFetch(`/preapproval/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ status: 'cancelled' }),
  })
}

export function mapMpStatus(mpStatus) {
  if (mpStatus === 'authorized') return 'active'
  if (mpStatus === 'paused') return 'paused'
  if (mpStatus === 'cancelled') return 'cancelled'
  if (mpStatus === 'pending') return 'pending'
  return mpStatus || 'pending'
}

export function formatNextPayment(iso) {
  if (!iso) return null
  try {
    return new Intl.DateTimeFormat('es-AR', {
      timeZone: 'America/Argentina/Buenos_Aires',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}
