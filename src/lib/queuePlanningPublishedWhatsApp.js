import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  where,
} from 'firebase/firestore'
import { db } from '../firebase'
import { startOfWeek, parseDateKey, toDateKey, formatWeekRangeFromStartKey } from './dates'
import { computePlanningSendAfter } from './planningNotifyWindow'
import { renderWhatsAppTemplate, athleteTemplateVars } from './whatsappTemplate'

/**
 * Avisa a cada atleta del público del WOD que ya puede ver la planificación de esa semana.
 * Una vez por atleta y semana; fuera de 9:00–20:00 (AR) queda programado con sendAfter.
 */
export async function queuePlanningPublishedWhatsApp({
  coachId,
  wodDateKey,
  audienceAthleteIds,
  athletes = [],
  lang = 'es',
}) {
  if (!coachId || !wodDateKey || !audienceAthleteIds?.length) return { queued: 0 }

  const rulesSnap = await getDocs(query(
    collection(db, 'whatsapp_rules'),
    where('coachId', '==', coachId),
    where('triggerKey', '==', 'week_planning_published'),
    where('active', '==', true),
  ))
  if (rulesSnap.empty) return { queued: 0 }

  const rule = { id: rulesSnap.docs[0].id, ...rulesSnap.docs[0].data() }

  const billingSnap = await getDoc(doc(db, 'coaches_public', coachId))
  const billing = billingSnap.exists() ? billingSnap.data() : {}

  const weekStart = toDateKey(startOfWeek(parseDateKey(wodDateKey)))
  const weekLabel = formatWeekRangeFromStartKey(weekStart, lang)
  const sendAfterDate = computePlanningSendAfter()
  const sendAfter = sendAfterDate ? Timestamp.fromDate(sendAfterDate) : null

  const athleteById = new Map(athletes.map(a => [a.id, a]))
  let queued = 0

  for (const athleteId of audienceAthleteIds) {
    const athlete = athleteById.get(athleteId)
    if (!athlete?.whatsappPhone) continue

    const logId = `${coachId}_${athleteId}_${weekStart}`
    const logRef = doc(db, 'planning_week_notified', logId)

    const body = renderWhatsAppTemplate(
      rule.template,
      athleteTemplateVars(athlete, { semana: weekLabel }, billing, lang),
    )

    try {
      const didQueue = await runTransaction(db, async (tx) => {
        const logSnap = await tx.get(logRef)
        if (logSnap.exists()) return false

        const outboxRef = doc(collection(db, 'whatsapp_outbox'))
        const outboxData = {
          coachId,
          athleteId,
          athleteName: athlete.name || '',
          whatsappPhone: athlete.whatsappPhone,
          body,
          ruleId: rule.id,
          source: 'planning',
          weekStart,
          status: 'pending',
          createdAt: serverTimestamp(),
        }
        if (sendAfter) outboxData.sendAfter = sendAfter

        tx.set(logRef, {
          coachId,
          athleteId,
          weekStart,
          wodDate: wodDateKey,
          notifiedAt: serverTimestamp(),
        })
        tx.set(outboxRef, outboxData)
        return true
      })
      if (didQueue) queued += 1
    } catch {
      // Transacción abortada (p. ej. ya notificado en paralelo)
    }
  }

  return { queued }
}
