#!/usr/bin/env node
/**
 * Crea app_config/admins en Firestore (una sola vez).
 * Uso: npm run admin:setup-firestore -- tu@email.com [otro@email.com]
 */
import { initFirebase } from '../src/firebaseAdmin.js'

const emails = process.argv.slice(2).map(e => e.trim().toLowerCase()).filter(Boolean)

if (!emails.length) {
  console.error('Uso: npm run admin:setup-firestore -- tu@email.com [otro@email.com]')
  process.exit(1)
}

const { db } = initFirebase()

await db.doc('app_config/admins').set({ emails }, { merge: true })

console.log('OK - app_config/admins:', emails.join(', '))
process.exit(0)
