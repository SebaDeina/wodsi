import { FieldValue } from './firebaseAdmin.js'
import { mapMpStatus, formatNextPayment } from './mercadopago.js'
import { planById, parseExternalReference } from './plans.js'

export async function writeSubscriptionFromPreapproval(db, preapproval) {
  const parsed = parseExternalReference(preapproval.external_reference)
  if (!parsed) return null

  const plan = planById(parsed.tierId)
  if (!plan) return null

  const coachId = parsed.coachId
  const status = mapMpStatus(preapproval.status)
  const amount = Number(preapproval.auto_recurring?.transaction_amount) || plan.amountARS

  const payload = {
    coachId,
    tierId: plan.id,
    status,
    amountARS: amount,
    athleteCountMin: plan.minAthletes,
    athleteCountMax: plan.maxAthletes,
    mpPreapprovalId: preapproval.id,
    payerEmail: preapproval.payer_email || null,
    nextPaymentDate: formatNextPayment(preapproval.next_payment_date),
    updatedAt: FieldValue.serverTimestamp(),
  }

  const ref = db.collection('coach_subscriptions').doc(coachId)
  const existing = await ref.get()
  if (!existing.exists) {
    payload.createdAt = FieldValue.serverTimestamp()
  }
  await ref.set(payload, { merge: true })

  await db.collection('users').doc(coachId).set({
    coachSubscriptionStatus: status,
    coachSubscriptionTierId: plan.id,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true })

  return { coachId, ...payload }
}

export async function setCheckoutPending(db, coachId, tierId, preapprovalId, payerEmail) {
  const plan = planById(tierId)
  if (!plan) throw new Error('Plan inválido')

  const ref = db.collection('coach_subscriptions').doc(coachId)
  const existing = await ref.get()
  const payload = {
    coachId,
    tierId: plan.id,
    status: 'pending',
    amountARS: plan.amountARS,
    athleteCountMin: plan.minAthletes,
    athleteCountMax: plan.maxAthletes,
    mpPreapprovalId: preapprovalId,
    payerEmail: payerEmail || null,
    updatedAt: FieldValue.serverTimestamp(),
  }
  if (!existing.exists) payload.createdAt = FieldValue.serverTimestamp()
  await ref.set(payload, { merge: true })
}

function inferTierFromAmount(amount) {
  const n = Number(amount) || 0
  if (n >= 25000) return 'growth'
  if (n >= 10000) return 'starter'
  return null
}

export async function resolveCoachForPayment(db, { externalReference, payerEmail, amountARS }) {
  const parsed = parseExternalReference(externalReference)
  if (parsed?.coachId) {
    return { coachId: parsed.coachId, tierId: parsed.tierId }
  }

  if (payerEmail) {
    const pendingSnap = await db.collection('coach_subscriptions')
      .where('payerEmail', '==', payerEmail)
      .where('status', 'in', ['pending', 'active'])
      .limit(3)
      .get()
    if (!pendingSnap.empty) {
      const doc = pendingSnap.docs[0]
      return { coachId: doc.id, tierId: doc.data().tierId || inferTierFromAmount(amountARS) }
    }

    const usersSnap = await db.collection('users')
      .where('email', '==', payerEmail)
      .where('role', '==', 'coach')
      .limit(1)
      .get()
    if (!usersSnap.empty) {
      const coachId = usersSnap.docs[0].id
      const sub = await db.collection('coach_subscriptions').doc(coachId).get()
      return {
        coachId,
        tierId: sub.data()?.tierId || inferTierFromAmount(amountARS),
      }
    }
  }

  return null
}

export async function recordSubscriptionPayment(db, {
  coachId,
  tierId,
  amountARS,
  mpPaymentId,
  status,
  paidAtIso,
}) {
  if (!coachId || !mpPaymentId) return null

  const statusNorm = status === 'approved' ? 'approved'
    : status === 'rejected' || status === 'cancelled' ? 'rejected'
      : 'pending'

  const paidAt = paidAtIso ? new Date(paidAtIso) : FieldValue.serverTimestamp()

  await db.collection('coach_subscription_payments').doc(String(mpPaymentId)).set({
    coachId,
    tierId: tierId || null,
    amountARS: Number(amountARS) || 0,
    status: statusNorm,
    mpPaymentId: String(mpPaymentId),
    paidAt,
    createdAt: FieldValue.serverTimestamp(),
  }, { merge: true })

  if (statusNorm === 'approved') {
    const plan = tierId ? planById(tierId) : null
    const subPatch = {
      coachId,
      status: 'active',
      tierId: tierId || inferTierFromAmount(amountARS),
      amountARS: Number(amountARS) || plan?.amountARS || 0,
      updatedAt: FieldValue.serverTimestamp(),
    }
    if (plan) {
      subPatch.athleteCountMin = plan.minAthletes
      subPatch.athleteCountMax = plan.maxAthletes
    }
    await db.collection('coach_subscriptions').doc(coachId).set(subPatch, { merge: true })
    await db.collection('users').doc(coachId).set({
      coachSubscriptionStatus: 'active',
      coachSubscriptionTierId: subPatch.tierId,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true })
  }

  return { coachId, mpPaymentId, status: statusNorm }
}
