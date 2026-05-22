import { initFirebase } from './firebaseAdmin.js'
import { watchSessionCommands, shutdownAllSessions, restoreSessionsOnBoot } from './sessions.js'
import { watchOutbox, pollOutbox } from './outbox.js'
import { runScheduledRules, watchNewAthletes } from './scheduler.js'

const outboxMs = Number(process.env.OUTBOX_POLL_MS) || 15000
const schedulerMs = Number(process.env.SCHEDULER_POLL_MS) || 60000

/** @type {(() => void)[]} */
const unsubs = []
/** @type {NodeJS.Timeout[]} */
const intervals = []
let shuttingDown = false

async function shutdown(signal) {
  if (shuttingDown) return
  shuttingDown = true
  console.log(`[wodsi-wsp] ${signal} — cerrando sesiones y listeners…`)

  for (const id of intervals) clearInterval(id)
  intervals.length = 0

  for (const unsub of unsubs) {
    try { unsub() } catch { /* ignore */ }
  }
  unsubs.length = 0

  await shutdownAllSessions()
  console.log('[wodsi-wsp] listo')
  process.exit(0)
}

function registerShutdown() {
  const forceMs = Number(process.env.WSP_FORCE_EXIT_MS) || 8000
  const onSignal = (signal) => {
    const forceTimer = setTimeout(() => {
      console.warn('[wodsi-wsp] timeout de cierre — forzando salida')
      process.exit(0)
    }, forceMs)
    forceTimer.unref?.()
    shutdown(signal).catch(() => process.exit(1))
  }
  process.once('SIGTERM', () => onSignal('SIGTERM'))
  process.once('SIGINT', () => onSignal('SIGINT'))
}

async function main() {
  registerShutdown()
  console.log('[wodsi-wsp] starting worker…')
  const db = initFirebase()

  unsubs.push(watchSessionCommands(db))
  unsubs.push(watchOutbox(db))
  unsubs.push(watchNewAthletes(db))

  restoreSessionsOnBoot(db).catch(err => console.error('[wsp] restore boot', err.message))

  intervals.push(
    setInterval(() => pollOutbox(db).catch(e => console.error('[wsp] poll', e.message)), outboxMs),
  )
  intervals.push(
    setInterval(() => runScheduledRules(db).catch(e => console.error('[wsp] scheduler', e.message)), schedulerMs),
  )

  console.log('[wodsi-wsp] listening (sessions, outbox, signup, scheduler)')
}

main().catch(err => {
  console.error('[wodsi-wsp] fatal', err)
  process.exit(1)
})
