import { FieldValue } from './firebaseAdmin.js'
import { chatIdFromPhone } from './phone.js'
import { getClient, ensureSessionForCoach } from './sessions.js'
import {
  resolveMessageBody,
  resolveRecipientId,
  sendWithRetries,
  isRetryableError,
} from './sendMessage.js'

/** Una cola por coach: evita envíos en paralelo que rompen Puppeteer. */
const coachChains = new Map()

function enqueueForCoach(coachId, task) {
  const prev = coachChains.get(coachId) || Promise.resolve()
  const next = prev.then(task).catch(() => {})
  coachChains.set(coachId, next)
  return next
}

async function bumpStats(db, coachId, field) {
  const ref = db.collection('whatsapp_settings').doc(coachId)
  await ref.update({
    [`stats.${field}`]: FieldValue.increment(1),
    updatedAt: FieldValue.serverTimestamp(),
  }).catch(async () => {
    await ref.set({
      stats: { sent: 0, failed: 0, [field]: 1 },
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true })
  })
}

async function markFailed(db, docSnap, coachId, message) {
  console.error(`[wsp] outbox failed ${docSnap.id}`, message)
  await docSnap.ref.update({
    status: 'failed',
    error: message,
    failedAt: FieldValue.serverTimestamp(),
  })
  if (coachId) await bumpStats(db, coachId, 'failed')
}

function sendAfterMs(data) {
  const raw = data.sendAfter
  if (!raw) return 0
  if (typeof raw.toMillis === 'function') return raw.toMillis()
  if (raw instanceof Date) return raw.getTime()
  if (typeof raw === 'number') return raw
  return 0
}

async function processOutboxItemInner(db, docSnap) {
  const data = docSnap.data()
  if (data.status !== 'pending') return false

  const notBefore = sendAfterMs(data)
  if (notBefore > Date.now()) return false

  const coachId = data.coachId
  const attempts = data.attempts || 0

  if (!data.whatsappPhone || !data.body) {
    await markFailed(db, docSnap, coachId, 'Faltan teléfono o mensaje')
    return false
  }

  if (!chatIdFromPhone(data.whatsappPhone)) {
    await markFailed(db, docSnap, coachId, 'Número de WhatsApp inválido')
    return false
  }

  let client = getClient(coachId)
  if (!client) client = await ensureSessionForCoach(db, coachId)
  if (!client) {
    console.log(`[wsp] outbox ${docSnap.id}: sin sesión activa (coach ${coachId})`)
    return false
  }

  try {
    const state = await client.getState()
    if (state !== 'CONNECTED') {
      console.log(`[wsp] outbox ${docSnap.id}: WhatsApp no listo (${state})`)
      return false
    }
  } catch {
    return false
  }

  const body = await resolveMessageBody(db, data)
  const recipientId = await resolveRecipientId(client, data.whatsappPhone)
  if (!recipientId) {
    await markFailed(db, docSnap, coachId, 'Ese número no tiene WhatsApp activo')
    return false
  }

  try {
    await sendWithRetries(client, recipientId, body)
    await docSnap.ref.update({
      status: 'sent',
      body,
      sentAt: FieldValue.serverTimestamp(),
      error: null,
      attempts: null,
    })
    await bumpStats(db, coachId, 'sent')
    console.log(`[wsp] sent ${docSnap.id} → ${recipientId}`)
    return true
  } catch (err) {
    const message = err.message || 'Error al enviar'
    if (isRetryableError(message) && attempts < 4) {
      await docSnap.ref.update({
        attempts: attempts + 1,
        lastAttemptAt: FieldValue.serverTimestamp(),
        error: message,
      })
      console.warn(`[wsp] outbox ${docSnap.id} pendiente reintento (${attempts + 1}):`, message.slice(0, 100))
      return false
    }
    await markFailed(db, docSnap, coachId, message)
    return false
  }
}

export function processOutboxItem(db, docSnap) {
  const coachId = docSnap.data()?.coachId
  if (!coachId) return Promise.resolve(false)
  return enqueueForCoach(coachId, () => processOutboxItemInner(db, docSnap))
}

export async function pollCoachOutbox(db, coachId) {
  const snap = await db.collection('whatsapp_outbox')
    .where('coachId', '==', coachId)
    .where('status', '==', 'pending')
    .limit(30)
    .get()
  for (const doc of snap.docs) {
    await processOutboxItem(db, doc)
  }
}

export function watchOutbox(db) {
  return db.collection('whatsapp_outbox')
    .where('status', '==', 'pending')
    .onSnapshot(async (snap) => {
      for (const change of snap.docChanges()) {
        if (change.type === 'added' || change.type === 'modified') {
          await processOutboxItem(db, change.doc)
        }
      }
    }, err => console.error('[wsp] outbox listener', err.message))
}

export async function pollOutbox(db) {
  const snap = await db.collection('whatsapp_outbox')
    .where('status', '==', 'pending')
    .limit(30)
    .get()
  for (const doc of snap.docs) {
    await processOutboxItem(db, doc)
  }
}
