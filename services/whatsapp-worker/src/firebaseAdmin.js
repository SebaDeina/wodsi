import { readFileSync, existsSync, readdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { loadEnv } from './loadEnv.js'

loadEnv()

const workerRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function resolveCredentialPath() {
  const fromEnv = process.env.GOOGLE_APPLICATION_CREDENTIALS
  const candidates = [
    fromEnv ? resolve(workerRoot, fromEnv) : null,
    resolve(workerRoot, 'serviceAccount.json'),
  ].filter(Boolean)

  for (const p of candidates) {
    if (existsSync(p)) return p
  }

  const auto = readdirSync(workerRoot).find(
    f => f.endsWith('.json') && f.includes('firebase-adminsdk'),
  )
  if (auto) return resolve(workerRoot, auto)

  return resolve(workerRoot, 'serviceAccount.json')
}

export function initFirebase() {
  if (getApps().length) return getFirestore()

  const projectId = process.env.FIREBASE_PROJECT_ID
  const credPath = resolveCredentialPath()

  if (!projectId) {
    throw new Error(
      'Falta FIREBASE_PROJECT_ID.\n'
      + 'Creá services/whatsapp-worker/.env con FIREBASE_PROJECT_ID=wodsi-47ffb',
    )
  }

  let credential
  if (existsSync(credPath)) {
    const serviceAccount = JSON.parse(readFileSync(credPath, 'utf8'))
    credential = cert(serviceAccount)
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
    credential = cert(serviceAccount)
  } else {
    throw new Error(
      'Falta la clave de cuenta de servicio de Firebase.\n\n'
      + '1. Firebase Console → wodsi-47ffb → Configuración → Cuentas de servicio\n'
      + '2. "Generar nueva clave privada" (JSON)\n'
      + '3. Guardalo como:\n'
      + `   ${resolve(workerRoot, 'serviceAccount.json')}\n\n`
      + '4. Reiniciá: npm run whatsapp:dev',
    )
  }

  initializeApp({ credential, projectId })
  console.log(`[wodsi-wsp] Firebase Admin OK · proyecto ${projectId}`)

  return getFirestore()
}

export { FieldValue }
