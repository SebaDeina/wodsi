import { createRequire } from 'module'
import QRCode from 'qrcode'
import { FieldValue } from './firebaseAdmin.js'
import { buildPuppeteerOptions } from './puppeteerConfig.js'

const require = createRequire(import.meta.url)
const { Client, LocalAuth } = require('whatsapp-web.js')

const authPath = process.env.WWEBJS_AUTH_PATH || './.wwebjs_auth'

/** @type {Map<string, import('whatsapp-web.js').Client>} */
const clients = new Map()
/** @type {Map<string, Promise<void>>} */
const starting = new Map()

function settingsRef(db, coachId) {
  return db.collection('whatsapp_settings').doc(coachId)
}

async function patchSettings(db, coachId, data) {
  await settingsRef(db, coachId).set({ ...data, updatedAt: FieldValue.serverTimestamp() }, { merge: true })
}

export function getClient(coachId) {
  return clients.get(coachId) || null
}

const DESTROY_MS = Number(process.env.WSP_DESTROY_MS) || 4000

async function destroyClient(client) {
  try {
    await Promise.race([
      client.destroy(),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error('destroy timeout')), DESTROY_MS)
      }),
    ])
  } catch {
    try { await client.pupBrowser?.close?.() } catch { /* ignore */ }
  }
}

/** Cierra todas las sesiones WhatsApp (p. ej. al reiniciar node --watch). */
export async function shutdownAllSessions() {
  const ids = [...clients.keys()]
  await Promise.allSettled(ids.map(async (coachId) => {
    const client = clients.get(coachId)
    clients.delete(coachId)
    if (client) await destroyClient(client)
  }))
  starting.clear()
}

export async function destroySession(db, coachId) {
  const client = clients.get(coachId)
  if (client) {
    clients.delete(coachId)
    await destroyClient(client)
  }
  starting.delete(coachId)
  await patchSettings(db, coachId, {
    connected: false,
    connectionStatus: 'disconnected',
    qrDataUrl: null,
    sessionCommand: null,
    phone: '',
    sessionLabel: null,
    lastError: null,
  })
}

export async function startSession(db, coachId) {
  if (clients.has(coachId)) return
  if (starting.has(coachId)) return starting.get(coachId)

  const job = (async () => {
    await patchSettings(db, coachId, {
      connectionStatus: 'connecting',
      qrDataUrl: null,
      sessionCommand: null,
      connected: false,
      lastError: null,
    })

    const client = new Client({
      authStrategy: new LocalAuth({ clientId: coachId, dataPath: authPath }),
      puppeteer: buildPuppeteerOptions(),
    })

    clients.set(coachId, client)

    client.on('qr', async (qr) => {
      const qrDataUrl = await QRCode.toDataURL(qr, { margin: 1, width: 280 })
      await patchSettings(db, coachId, {
        connectionStatus: 'qr',
        qrDataUrl,
        connected: false,
        lastError: null,
      })
    })

    client.on('ready', async () => {
      const wid = client.info?.wid?.user || ''
      const phone = wid ? `+${wid}` : ''
      await patchSettings(db, coachId, {
        connectionStatus: 'ready',
        connected: true,
        qrDataUrl: null,
        lastError: null,
        phone,
        sessionLabel: 'SESIÓN ACTIVA',
        sessionSince: new Date().toLocaleString('es-AR', { timeZone: process.env.TZ || 'America/Argentina/Buenos_Aires' }),
      })
      console.log(`[wsp] coach ${coachId} ready ${phone}`)
      try {
        const { pollCoachOutbox } = await import('./outbox.js')
        await pollCoachOutbox(db, coachId)
      } catch (err) {
        console.error('[wsp] poll after ready', coachId, err.message)
      }
    })

    client.on('disconnected', async (reason) => {
      console.log(`[wsp] coach ${coachId} disconnected`, reason)
      clients.delete(coachId)
      await patchSettings(db, coachId, {
        connected: false,
        connectionStatus: 'disconnected',
        qrDataUrl: null,
      })
    })

    client.on('auth_failure', async () => {
      clients.delete(coachId)
      await patchSettings(db, coachId, {
        connected: false,
        connectionStatus: 'auth_failure',
        qrDataUrl: null,
      })
    })

    try {
      await client.initialize()
    } catch (err) {
      console.error(`[wsp] init failed ${coachId}`, err.message)
      clients.delete(coachId)
      await patchSettings(db, coachId, {
        connected: false,
        connectionStatus: 'error',
        qrDataUrl: null,
        lastError: err.message,
      })
    }
  })()

  starting.set(coachId, job)
  try {
    await job
  } finally {
    starting.delete(coachId)
  }
}

/** Tras reiniciar el worker, reabre sesiones que en Firestore siguen como conectadas. */
export async function restoreSessionsOnBoot(db) {
  const snap = await db.collection('whatsapp_settings').where('connected', '==', true).get()
  for (const doc of snap.docs) {
    const coachId = doc.id
    if (clients.has(coachId) || starting.has(coachId)) continue
    console.log(`[wsp] restaurando sesión ${coachId}`)
    startSession(db, coachId).catch(err => console.error('[wsp] restore', coachId, err.message))
  }
}

/** Si Firestore dice conectado pero no hay cliente en memoria, inicia sesión (LocalAuth). */
export async function ensureSessionForCoach(db, coachId) {
  if (clients.has(coachId)) return clients.get(coachId)
  if (starting.has(coachId)) {
    try { await starting.get(coachId) } catch { /* ignore */ }
    return clients.get(coachId) || null
  }
  const snap = await settingsRef(db, coachId).get()
  const data = snap.data()
  if (!data?.connected) return null
  console.log(`[wsp] reactivando sesión ${coachId} para envío`)
  try {
    await startSession(db, coachId)
  } catch { /* logged in startSession */ }
  return clients.get(coachId) || null
}

export function watchSessionCommands(db) {
  return db.collection('whatsapp_settings').onSnapshot(async (snap) => {
    for (const change of snap.docChanges()) {
      if (change.type !== 'modified' && change.type !== 'added') continue
      const coachId = change.doc.id
      const data = change.doc.data()
      const cmd = data.sessionCommand
      if (cmd === 'connect' && !clients.has(coachId) && !starting.has(coachId)) {
        startSession(db, coachId).catch(err => console.error('[wsp] start', coachId, err.message))
      }
      if (cmd === 'disconnect') {
        await destroySession(db, coachId)
      }
    }
  })
}
