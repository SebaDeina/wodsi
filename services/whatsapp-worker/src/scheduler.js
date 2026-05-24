import { FieldValue } from './firebaseAdmin.js'
import { renderTemplate, varsForAthlete } from './templates.js'
import { daysOverdue, isDueToday } from './membership.js'

function nowLocalHM() {
  const tz = process.env.TZ || 'America/Argentina/Buenos_Aires'
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date())
  const hour = parts.find(p => p.type === 'hour')?.value || '00'
  const minute = parts.find(p => p.type === 'minute')?.value || '00'
  return `${hour}:${minute}`
}

function todayKey() {
  const tz = process.env.TZ || 'America/Argentina/Buenos_Aires'
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
}

async function getBilling(db, coachId) {
  const snap = await db.collection('coaches_public').doc(coachId).get()
  return snap.exists ? snap.data() : {}
}

async function athletesForCoach(db, coachId) {
  const snap = await db.collection('users')
    .where('coachId', '==', coachId)
    .where('role', '==', 'athlete')
    .get()
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

async function alreadyQueuedToday(db, coachId, athleteId, ruleId) {
  const key = `${coachId}_${athleteId}_${ruleId}_${todayKey()}`
  const ref = db.collection('whatsapp_send_log').doc(key)
  const snap = await ref.get()
  return snap.exists
}

async function markQueued(db, coachId, athleteId, ruleId) {
  const key = `${coachId}_${athleteId}_${ruleId}_${todayKey()}`
  await db.collection('whatsapp_send_log').doc(key).set({
    coachId, athleteId, ruleId, date: todayKey(),
    createdAt: FieldValue.serverTimestamp(),
  })
}

async function queueAutomated(db, coachId, athlete, rule, billing) {
  if (!athlete.whatsappPhone) return
  if (await alreadyQueuedToday(db, coachId, athlete.id, rule.id)) return

  const body = renderTemplate(rule.template, varsForAthlete(athlete, billing))
  await db.collection('whatsapp_outbox').add({
    coachId,
    athleteId: athlete.id,
    athleteName: athlete.name || '',
    whatsappPhone: athlete.whatsappPhone,
    body,
    ruleId: rule.id,
    source: 'automation',
    status: 'pending',
    createdAt: FieldValue.serverTimestamp(),
  })
  await markQueued(db, coachId, athlete.id, rule.id)
}

function matchesRule(athlete, rule) {
  const status = athlete.status || 'active'
  const key = rule.triggerKey
  const overdue = daysOverdue(athlete.paidUntil)

  if (key === 'plan_due_day') {
    if (status === 'paused') return false
    return isDueToday(athlete.paidUntil) || (!athlete.paidUntil && status === 'active')
  }
  if (key === 'overdue_days') {
    const need = rule.triggerDays ?? 3
    if (overdue != null) return overdue >= need && overdue < need + 1
    return status === 'overdue' && need === 3
  }
  if (key === 'overdue_pause') {
    const need = rule.triggerDays ?? 7
    if (overdue != null) return overdue >= need
    return status === 'overdue' || (status === 'paused' && need >= 7)
  }
  if (key === 'inactive_session') {
    return status === 'active'
  }
  return false
}

export async function runScheduledRules(db) {
  const hm = nowLocalHM()
  const settingsSnap = await db.collection('whatsapp_settings')
    .where('connected', '==', true)
    .get()

  for (const settingsDoc of settingsSnap.docs) {
    const coachId = settingsDoc.id
    const rulesSnap = await db.collection('whatsapp_rules')
      .where('coachId', '==', coachId)
      .where('active', '==', true)
      .get()

    const timedRules = rulesSnap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(r => r.sendTime === hm && (r.category || 'box') === 'box')

    if (!timedRules.length) continue

    const billing = await getBilling(db, coachId)
    const athletes = await athletesForCoach(db, coachId)

    for (const rule of timedRules) {
      for (const athlete of athletes) {
        if (!matchesRule(athlete, rule)) continue
        await queueAutomated(db, coachId, athlete, rule, billing)
      }
    }
  }
}

async function welcomeAlreadyQueued(db, athleteId) {
  const snap = await db.collection('whatsapp_outbox')
    .where('athleteId', '==', athleteId)
    .where('source', '==', 'signup')
    .limit(1)
    .get()
  return !snap.empty
}

async function tryQueueSignupWelcome(db, athlete) {
  const coachId = athlete.coachId
  if (!coachId || !athlete.whatsappPhone) return

  const settings = await db.collection('whatsapp_settings').doc(coachId).get()
  if (!settings.exists || !settings.data()?.connected) return

  if (await welcomeAlreadyQueued(db, athlete.id)) return

  const rulesSnap = await db.collection('whatsapp_rules')
    .where('coachId', '==', coachId)
    .where('active', '==', true)
    .where('triggerKey', '==', 'on_signup')
    .limit(1)
    .get()
  if (rulesSnap.empty) return

  const rule = { id: rulesSnap.docs[0].id, ...rulesSnap.docs[0].data() }
  const billing = await getBilling(db, coachId)
  await queueAutomated(db, coachId, athlete, rule, billing)
}

export function watchNewAthletes(db) {
  return db.collection('users')
    .where('role', '==', 'athlete')
    .onSnapshot(async (snap) => {
      for (const change of snap.docChanges()) {
        const athlete = { id: change.doc.id, ...change.doc.data() }
        if (change.type === 'added') {
          const createdMs = athlete.createdAt?.toMillis?.() ?? 0
          if (!createdMs || Date.now() - createdMs > 5 * 60 * 1000) continue
          await tryQueueSignupWelcome(db, athlete)
          continue
        }
        if (change.type === 'modified') {
          await tryQueueSignupWelcome(db, athlete)
        }
      }
    })
}
