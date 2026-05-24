import http from 'http'
import { initFirebase } from './firebaseAdmin.js'
import { readBearer, verifyCoach } from './auth.js'
import { planById, externalReference } from './plans.js'
import { createPreapproval, getPreapproval, getPayment, getAuthorizedPayment } from './mercadopago.js'
import {
  setCheckoutPending,
  writeSubscriptionFromPreapproval,
  recordSubscriptionPayment,
  resolveCoachForPayment,
} from './subscriptionStore.js'
import { loadEnv } from './loadEnv.js'

loadEnv()

const { db, auth } = initFirebase()
const PORT = Number(process.env.PORT) || 8788
const APP_URL = (process.env.APP_PUBLIC_URL || 'http://localhost:5173').replace(/\/$/, '')
const CORS_ORIGIN = process.env.CORS_ORIGIN || APP_URL

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': CORS_ORIGIN,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  }
}

function sendJson(res, code, body) {
  res.writeHead(code, { 'Content-Type': 'application/json', ...corsHeaders() })
  res.end(JSON.stringify(body))
}

async function readJson(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  if (!chunks.length) return {}
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    return {}
  }
}

async function handleCheckout(req, res, coach) {
  const body = await readJson(req)
  const plan = planById(body.tierId)
  if (!plan) {
    sendJson(res, 400, { error: 'Plan inválido' })
    return
  }

  const backUrl = `${APP_URL}/coach/planes?mp=return`
  const extRef = externalReference(coach.uid, plan.id)

  const preapproval = await createPreapproval({
    reason: plan.reason,
    amountARS: plan.amountARS,
    externalReference: extRef,
    payerEmail: coach.email,
    backUrl,
  })

  await setCheckoutPending(db, coach.uid, plan.id, preapproval.id, coach.email)

  sendJson(res, 200, {
    initPoint: preapproval.init_point,
    preapprovalId: preapproval.id,
  })
}

async function handleIntent(req, res, coach) {
  const body = await readJson(req)
  const plan = planById(body.tierId)
  if (!plan) {
    sendJson(res, 400, { error: 'Plan inválido' })
    return
  }

  await setCheckoutPending(db, coach.uid, plan.id, null, coach.email)
  sendJson(res, 200, { ok: true, tierId: plan.id })
}

async function handleMe(res, coachId) {
  const snap = await db.collection('coach_subscriptions').doc(coachId).get()
  sendJson(res, 200, { subscription: snap.exists ? { id: snap.id, ...snap.data() } : null })
}

async function handlePayments(res, coachId) {
  const snap = await db.collection('coach_subscription_payments')
    .where('coachId', '==', coachId)
    .orderBy('paidAt', 'desc')
    .limit(40)
    .get()
  sendJson(res, 200, {
    payments: snap.docs.map(d => ({ id: d.id, ...d.data() })),
  })
}

async function handleSync(res, coach) {
  const snap = await db.collection('coach_subscriptions').doc(coach.uid).get()
  if (!snap.exists || !snap.data()?.mpPreapprovalId) {
    sendJson(res, 200, { subscription: snap.exists ? { id: snap.id, ...snap.data() } : null })
    return
  }
  const preapproval = await getPreapproval(snap.data().mpPreapprovalId)
  const updated = await writeSubscriptionFromPreapproval(db, preapproval)
  sendJson(res, 200, { subscription: updated })
}

async function processPaymentNotification(paymentId) {
  const payment = await getPayment(paymentId)
  const payerEmail = payment.payer?.email
  const amount = payment.transaction_amount
  const resolved = await resolveCoachForPayment(db, {
    externalReference: payment.external_reference,
    payerEmail,
    amountARS: amount,
  })
  if (!resolved) {
    console.warn('[wodsi-billing] payment sin coach', paymentId, payerEmail)
    return
  }
  await recordSubscriptionPayment(db, {
    coachId: resolved.coachId,
    tierId: resolved.tierId,
    amountARS: amount,
    mpPaymentId: payment.id,
    status: payment.status,
    paidAtIso: payment.date_approved || payment.date_created,
  })
}

async function processAuthorizedPaymentNotification(authPaymentId) {
  const authPayment = await getAuthorizedPayment(authPaymentId)
  const paymentId = authPayment.payment?.id || authPayment.payment_id
  if (paymentId) {
    await processPaymentNotification(paymentId)
    return
  }
  const payerEmail = authPayment.payer?.email
  const amount = authPayment.transaction_amount
  const resolved = await resolveCoachForPayment(db, {
    externalReference: authPayment.external_reference,
    payerEmail,
    amountARS: amount,
  })
  if (!resolved) return
  await recordSubscriptionPayment(db, {
    coachId: resolved.coachId,
    tierId: resolved.tierId,
    amountARS: amount,
    mpPaymentId: authPaymentId,
    status: authPayment.status || 'approved',
    paidAtIso: authPayment.date_created,
  })
}

async function handleWebhook(req, res) {
  const body = await readJson(req)
  const topic = body.type || req.headers['x-topic'] || body.action || body.topic
  const dataId = body.data?.id || body.id

  console.log('[wodsi-billing] webhook', topic, dataId)

  try {
    if ((topic === 'subscription_preapproval' || topic === 'preapproval') && dataId) {
      const preapproval = await getPreapproval(dataId)
      await writeSubscriptionFromPreapproval(db, preapproval)
    }
    if (topic === 'payment' && dataId) {
      await processPaymentNotification(dataId)
    }
    if (topic === 'subscription_authorized_payment' && dataId) {
      await processAuthorizedPaymentNotification(dataId)
    }
  } catch (err) {
    console.error('[wodsi-billing] webhook error', err)
  }

  sendJson(res, 200, { ok: true })
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders())
    res.end()
    return
  }

  const url = new URL(req.url, `http://localhost:${PORT}`)
  const path = url.pathname

  try {
    if (req.method === 'GET' && path === '/health') {
      sendJson(res, 200, { ok: true, service: 'wodsi-billing-api' })
      return
    }

    if (req.method === 'POST' && path === '/api/mercadopago/webhook') {
      await handleWebhook(req, res)
      return
    }

    const token = readBearer(req)
    let coach = null
    if (path.startsWith('/api/subscription/')) {
      coach = await verifyCoach(auth, db, token)
    }

    if (req.method === 'GET' && path === '/api/subscription/me') {
      await handleMe(res, coach.uid)
      return
    }

    if (req.method === 'GET' && path === '/api/subscription/payments') {
      await handlePayments(res, coach.uid)
      return
    }

    if (req.method === 'POST' && path === '/api/subscription/checkout') {
      await handleCheckout(req, res, coach)
      return
    }

    if (req.method === 'POST' && path === '/api/subscription/intent') {
      await handleIntent(req, res, coach)
      return
    }

    if (req.method === 'POST' && path === '/api/subscription/sync') {
      await handleSync(res, coach)
      return
    }

    sendJson(res, 404, { error: 'Not found' })
  } catch (err) {
    console.error('[wodsi-billing]', err)
    const code = err.message === 'No autorizado' || err.message?.includes('Solo coaches') ? 401 : 500
    sendJson(res, code, { error: err.message || 'Error interno' })
  }
})

server.listen(PORT, () => {
  console.log(`[wodsi-billing] listening on :${PORT}`)
  console.log(`[wodsi-billing] APP_PUBLIC_URL=${APP_URL}`)
  if (!process.env.MP_ACCESS_TOKEN) {
    console.warn('[wodsi-billing] MP_ACCESS_TOKEN no configurado — checkout API deshabilitado')
  }
})
