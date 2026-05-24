import { useState, useEffect } from 'react'
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'

export function useCoachSubscriptionPayments(max = 40) {
  const { user } = useAuth()
  const coachId = user?.uid
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!coachId) {
      setPayments([])
      setLoading(false)
      return undefined
    }
    setLoading(true)
    const q = query(
      collection(db, 'coach_subscription_payments'),
      where('coachId', '==', coachId),
      orderBy('paidAt', 'desc'),
      limit(max),
    )
    const unsub = onSnapshot(
      q,
      snap => {
        setPayments(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        setLoading(false)
      },
      err => {
        setError(err.message)
        setLoading(false)
      },
    )
    return () => unsub()
  }, [coachId, max])

  return { payments, loading, error }
}
