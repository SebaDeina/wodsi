import { useState, useEffect, useCallback } from 'react'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'

const DEFAULTS = {
  athletePaymentMode: 'both',
  paymentAlias: '',
  paymentHolder: '',
  membershipAmount: '',
  paymentNotes: '',
  cashInstructions: '',
}

export function useCoachBilling() {
  const { user, profile, syncCoachPublic } = useAuth()
  const coachId = user?.uid
  const [billing, setBilling] = useState(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!coachId) {
      setBilling(DEFAULTS)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const snap = await getDoc(doc(db, 'coaches_public', coachId))
      const data = snap.exists() ? snap.data() : {}
      setBilling({
        athletePaymentMode: data.athletePaymentMode || DEFAULTS.athletePaymentMode,
        paymentAlias: data.paymentAlias || '',
        paymentHolder: data.paymentHolder || '',
        membershipAmount: data.membershipAmount || '',
        paymentNotes: data.paymentNotes || '',
        cashInstructions: data.cashInstructions || '',
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [coachId])

  useEffect(() => { load() }, [load])

  async function saveBilling(patch) {
    if (!coachId) return
    setSaving(true)
    setError(null)
    try {
      const next = { ...billing, ...patch }
      await setDoc(doc(db, 'coaches_public', coachId), {
        ...next,
        name: profile?.name,
        boxName: profile?.boxName || profile?.name,
        updatedAt: serverTimestamp(),
      }, { merge: true })
      await syncCoachPublic(coachId, profile?.name, profile?.boxName || profile?.name)
      setBilling(next)
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setSaving(false)
    }
  }

  return { billing, loading, saving, error, saveBilling, reload: load }
}

export function coachBillingTemplateVars(billing) {
  return {
    monto: billing?.membershipAmount || '',
    alias: billing?.paymentAlias || '',
  }
}
