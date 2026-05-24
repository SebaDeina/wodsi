import { useState, useEffect, useCallback, useMemo } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { useCoachAthletes } from './useCoachAthletes'
import {
  planById,
  planIncludesAthleteCount,
  recommendedPlanForAthleteCount,
  subscriptionIsActive,
} from '../lib/coachSubscriptionPlans'
import { mercadoPagoPlanUrl, hasMercadoPagoPlanLinks } from '../lib/mercadoPagoPlanLinks'
import {
  createCoachSubscriptionCheckout,
  registerCoachPlanIntent,
  syncCoachSubscription,
} from '../lib/billingApi'

export function useCoachSubscription() {
  const { user } = useAuth()
  const coachId = user?.uid
  const { athletes, loading: athletesLoading } = useCoachAthletes()
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [error, setError] = useState(null)

  const athleteCount = athletes.length
  const recommendedPlan = useMemo(
    () => recommendedPlanForAthleteCount(athleteCount),
    [athleteCount],
  )

  const activePlan = useMemo(() => {
    if (!subscription?.tierId) return null
    return planById(subscription.tierId)
  }, [subscription?.tierId])

  const isActive = subscriptionIsActive(subscription?.status)
  const needsUpgrade = isActive && activePlan && !planIncludesAthleteCount(activePlan, athleteCount)
  const billingConfigured = Boolean(
    hasMercadoPagoPlanLinks()
    || import.meta.env.VITE_BILLING_API_URL
    || import.meta.env.DEV,
  )
  const usesMercadoPagoLinks = hasMercadoPagoPlanLinks()

  useEffect(() => {
    if (!coachId) {
      setSubscription(null)
      setLoading(false)
      return undefined
    }
    setLoading(true)
    const ref = doc(db, 'coach_subscriptions', coachId)
    const unsub = onSnapshot(
      ref,
      snap => {
        setSubscription(snap.exists() ? { id: snap.id, ...snap.data() } : null)
        setLoading(false)
      },
      err => {
        setError(err.message)
        setLoading(false)
      },
    )
    return () => unsub()
  }, [coachId])

  const startCheckout = useCallback(async (tierId) => {
    if (!user) return
    setCheckoutLoading(true)
    setError(null)
    try {
      const idToken = await user.getIdToken()
      const mpLink = mercadoPagoPlanUrl(tierId)

      if (mpLink) {
        await registerCoachPlanIntent(idToken, tierId)
        window.open(mpLink, '_blank', 'noopener,noreferrer')
        setCheckoutLoading(false)
        return
      }

      const { initPoint } = await createCoachSubscriptionCheckout(idToken, tierId)
      if (!initPoint) throw new Error('Mercado Pago no devolvió link de pago')
      window.location.href = initPoint
    } catch (err) {
      setError(err.message)
      setCheckoutLoading(false)
    }
  }, [user])

  const syncFromMercadoPago = useCallback(async () => {
    if (!user) return null
    setError(null)
    try {
      const idToken = await user.getIdToken()
      return await syncCoachSubscription(idToken)
    } catch (err) {
      setError(err.message)
      return null
    }
  }, [user])

  return {
    subscription,
    athleteCount,
    recommendedPlan,
    activePlan,
    isActive,
    needsUpgrade,
    billingConfigured,
    usesMercadoPagoLinks,
    loading: loading || athletesLoading,
    checkoutLoading,
    error,
    startCheckout,
    syncFromMercadoPago,
  }
}
