import { readFileSync, existsSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const workerRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const appRoot = resolve(workerRoot, '../..')

function parseEnvFile(path) {
  if (!existsSync(path)) return
  const text = readFileSync(path, 'utf8')
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let val = trimmed.slice(eq + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    if (process.env[key] == null || process.env[key] === '') {
      process.env[key] = val
    }
  }
}

export function loadEnv() {
  parseEnvFile(resolve(workerRoot, '.env'))
  parseEnvFile(resolve(appRoot, '.env.local'))
  parseEnvFile(resolve(appRoot, '.env'))

  if (!process.env.FIREBASE_PROJECT_ID && process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID) {
    process.env.FIREBASE_PROJECT_ID = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID
  }

  const cred = process.env.GOOGLE_APPLICATION_CREDENTIALS
  if (cred && !cred.startsWith('/')) {
    process.env.GOOGLE_APPLICATION_CREDENTIALS = resolve(workerRoot, cred)
  }
}
