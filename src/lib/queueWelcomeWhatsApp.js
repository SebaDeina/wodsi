import { addDoc, collection, getDocs, query, serverTimestamp, where } from 'firebase/firestore'
import { db } from '../firebase'
import { renderWhatsAppTemplate, athleteTemplateVars } from './whatsappTemplate'

/** Encola mensaje de bienvenida si hay regla activa y aún no se envió. */
export async function queueWelcomeWhatsApp({ athleteId, coachId, profile, phoneE164, lang = 'es' }) {
  if (!athleteId || !coachId || !phoneE164) return false

  const rulesSnap = await getDocs(query(
    collection(db, 'whatsapp_rules'),
    where('coachId', '==', coachId),
    where('triggerKey', '==', 'on_signup'),
    where('active', '==', true),
  ))
  if (rulesSnap.empty) return false

  const rule = { id: rulesSnap.docs[0].id, ...rulesSnap.docs[0].data() }
  const body = renderWhatsAppTemplate(
    rule.template,
    athleteTemplateVars({ ...profile, name: profile?.name || '' }, {}, null, lang),
  )

  await addDoc(collection(db, 'whatsapp_outbox'), {
    coachId,
    athleteId,
    athleteName: profile?.name || '',
    whatsappPhone: phoneE164,
    body,
    ruleId: rule.id,
    source: 'signup',
    status: 'pending',
    createdAt: serverTimestamp(),
  })
  return true
}
