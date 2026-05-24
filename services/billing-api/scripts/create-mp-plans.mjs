#!/usr/bin/env node
/**
 * Crea los 2 planes de suscripción en Mercado Pago (sandbox).
 * Uso: npm run billing:create-plans
 * Lee MP_ACCESS_TOKEN de services/billing-api/.env o .env.local (raíz).
 */
import { readFileSync, existsSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const billingRoot = resolve(scriptDir, '..')
const repoRoot = resolve(billingRoot, '../..')

function loadEnvFile(path) {
  if (!existsSync(path)) return
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let val = trimmed.slice(eq + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    if (!(key in process.env)) process.env[key] = val
  }
}

loadEnvFile(resolve(billingRoot, '.env'))
loadEnvFile(resolve(repoRoot, '.env.local'))

const token = process.env.MP_ACCESS_TOKEN
  || process.env.Acces_token
  || process.env.ACCESS_TOKEN

if (!token) {
  console.error('\n❌ Falta MP_ACCESS_TOKEN en .env.local o services/billing-api/.env\n')
  process.exit(1)
}

const APP_URL = (process.env.APP_PUBLIC_URL || 'http://localhost:5173').replace(/\/$/, '')

function backUrlForMp() {
  if (process.env.MP_BACK_URL) return process.env.MP_BACK_URL
  const local = `${APP_URL}/coach/planes?mp=return`
  if (/localhost|127\.0\.0\.1/.test(APP_URL)) {
    return 'https://wodsi-47ffb.web.app/coach/planes?mp=return'
  }
  return local
}

const BACK_URL = backUrlForMp()

const PLANS = [
  {
    tierId: 'starter',
    envKey: 'VITE_MP_PLAN_ID_STARTER',
    body: {
      reason: 'Wodsi — hasta 20 atletas',
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: 12000,
        currency_id: 'ARS',
      },
      back_url: BACK_URL,
    },
  },
  {
    tierId: 'growth',
    envKey: 'VITE_MP_PLAN_ID_GROWTH',
    body: {
      reason: 'Wodsi — 21 a 80 atletas',
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: 28000,
        currency_id: 'ARS',
      },
      back_url: BACK_URL,
    },
  },
]

function checkoutUrl(planId) {
  return `https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=${planId}`
}

async function createPlan(plan) {
  const res = await fetch('https://api.mercadopago.com/preapproval_plan', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(plan.body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.message || data.error || JSON.stringify(data))
  }
  return data
}

console.log('\n🔧 Creando planes de suscripción en Mercado Pago (TEST)…\n')

const results = {}

for (const plan of PLANS) {
  try {
    const data = await createPlan(plan)
    const id = data.id
    results[plan.tierId] = { id, checkoutUrl: checkoutUrl(id) }
    console.log(`✅ ${plan.tierId}`)
    console.log(`   Plan ID: ${id}`)
    console.log(`   Checkout: ${checkoutUrl(id)}\n`)
  } catch (err) {
    console.error(`❌ ${plan.tierId}: ${err.message}\n`)
  }
}

const outPath = resolve(billingRoot, 'mp-plans.generated.json')
writeFileSync(outPath, JSON.stringify({ createdAt: new Date().toISOString(), plans: results }, null, 2))
console.log(`📄 Guardado en ${outPath}\n`)

console.log('Agregá esto a tu .env.local:\n')
if (results.starter?.id) {
  console.log(`VITE_MP_PLAN_ID_STARTER=${results.starter.id}`)
  console.log(`VITE_MP_LINK_STARTER=${results.starter.checkoutUrl}`)
}
if (results.growth?.id) {
  console.log(`VITE_MP_PLAN_ID_GROWTH=${results.growth.id}`)
  console.log(`VITE_MP_LINK_GROWTH=${results.growth.checkoutUrl}`)
}
console.log('\nY en services/billing-api/.env:\n')
console.log(`MP_ACCESS_TOKEN=${token.slice(0, 12)}…`)
console.log('APP_PUBLIC_URL=http://localhost:5173')
console.log('FIREBASE_PROJECT_ID=wodsi-47ffb')
console.log('GOOGLE_APPLICATION_CREDENTIALS=../whatsapp-worker/wodsi-47ffb-firebase-adminsdk-fbsvc-94ac17a419.json\n')
