import { useState, useEffect, useMemo, useCallback } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { membershipStatusFromAthlete } from '../lib/membership'

export function useCoachAthletes() {
  const { user } = useAuth()
  const [athletes, setAthletes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!user?.uid) {
      setAthletes([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const q = query(
        collection(db, 'users'),
        where('coachId', '==', user.uid),
        where('role', '==', 'athlete'),
      )
      const snap = await getDocs(q)
      setAthletes(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user?.uid])

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (!cancelled) await load()
    }

    run()
    return () => { cancelled = true }
  }, [load])

  const counts = useMemo(() => {
    return athletes.reduce((acc, a) => {
      const s = membershipStatusFromAthlete(a)
      acc[s] = (acc[s] || 0) + 1
      acc.all = (acc.all || 0) + 1
      return acc
    }, { all: 0 })
  }, [athletes])

  const activeCount = useMemo(
    () => athletes.filter(a => (a.status || 'active') === 'active').length,
    [athletes],
  )

  function optimisticPatch(athleteId, patch) {
    setAthletes(prev => prev.map(a => {
      if (a.id !== athleteId) return a
      const next = { ...a, ...patch }
      return { ...next, status: membershipStatusFromAthlete(next) }
    }))
  }

  return { athletes, loading, error, counts, activeCount, reload: load, optimisticPatch }
}
