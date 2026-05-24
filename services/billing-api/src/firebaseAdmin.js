import { readFileSync, existsSync, readdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
import { loadEnv } from './loadEnv.js'

loadEnv()

const apiRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function resolveCredentialPath() {
  const fromEnv = process.env.GOOGLE_APPLICATION_CREDENTIALS
  const candidates = [
    fromEnv ? resolve(apiRoot, fromEnv) : null,
    resolve(apiRoot, 'serviceAccount.json'),
    resolve(apiRoot, '../whatsapp-worker/wodsi-47ffb-firebase-adminsdk-fbsvc-94ac17a419.json'),
  ].filter(Boolean)

  for (const p of candidates) {
    if (existsSync(p)) return p
  }

  const auto = existsSync(apiRoot)
    ? readdirSync(apiRoot).find(f => f.endsWith('.json') && f.includes('firebase-adminsdk'))
    : null
  if (auto) return resolve(apiRoot, auto)
  return resolve(apiRoot, 'serviceAccount.json')
}

export function initFirebase() {
  if (getApps().length) {
    return { db: getFirestore(), auth: getAuth() }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID
  const credPath = resolveCredentialPath()

  if (!projectId) {
    throw new Error('Falta FIREBASE_PROJECT_ID en services/billing-api/.env')
  }

  let credential
  if (existsSync(credPath)) {
    credential = cert(JSON.parse(readFileSync(credPath, 'utf8')))
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    credential = cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON))
  } else {
    throw new Error(`Falta cuenta de servicio Firebase en ${credPath}`)
  }

  initializeApp({ credential, projectId })
  console.log(`[wodsi-billing] Firebase Admin OK · ${projectId}`)
  return { db: getFirestore(), auth: getAuth() }
}

export { FieldValue }
