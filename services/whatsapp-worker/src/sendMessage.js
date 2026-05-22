import { chatIdFromPhone } from './phone.js'
import { renderTemplate, varsForAthlete } from './templates.js'

const SEND_GAP_MS = Number(process.env.WSP_SEND_GAP_MS) || 2000
const MAX_ATTEMPTS = Number(process.env.WSP_SEND_MAX_ATTEMPTS) || 4

const RETRYABLE = /getChat|detached Frame|No LID|Execution context|Protocol error|Target closed/i

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

async function getBilling(db, coachId) {
  const snap = await db.collection('coaches_public').doc(coachId).get()
  return snap.exists ? snap.data() : {}
}

export async function resolveMessageBody(db, data) {
  let body = (data.body || '').trim()
  if (!/\{\{\w+\}\}/.test(body)) return body

  let athlete = { name: data.athleteName || '' }
  if (data.athleteId) {
    const snap = await db.collection('users').doc(data.athleteId).get()
    if (snap.exists) athlete = { id: snap.id, ...snap.data() }
  }
  const billing = await getBilling(db, data.coachId)
  return renderTemplate(body, varsForAthlete(athlete, billing))
}

/** Resuelve JID vía API de WhatsApp (evita errores LID / getChat). */
export async function resolveRecipientId(client, phone) {
  const chatId = chatIdFromPhone(phone)
  if (!chatId) return null

  const number = chatId.replace('@c.us', '')
  try {
    const wid = await client.getNumberId(number)
    if (wid?._serialized) return wid._serialized
    if (typeof wid === 'string') return wid
  } catch (err) {
    console.warn('[wsp] getNumberId', number, err.message)
  }
  return chatId
}

export function isRetryableError(message) {
  return RETRYABLE.test(message || '')
}

export async function sendWithRetries(client, recipientId, body, attempt = 1) {
  try {
    const msg = await client.sendMessage(recipientId, body)
    if (!msg) throw new Error('WhatsApp no devolvió el mensaje (¿número sin cuenta?)')
    await sleep(SEND_GAP_MS)
    return msg
  } catch (err) {
    const message = err.message || String(err)
    if (isRetryableError(message) && attempt < MAX_ATTEMPTS) {
      console.warn(`[wsp] reintento ${attempt + 1}/${MAX_ATTEMPTS}:`, message.slice(0, 80))
      await sleep(1500 * attempt)
      return sendWithRetries(client, recipientId, body, attempt + 1)
    }
    throw err
  }
}
