import { useState, useEffect, useMemo } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'

export function useCoachAthletes() {
  const { user } = useAuth()
  const [athletes, setAthletes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user?.uid) {
      setAthletes([])
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    async function load() {
      try {
        const q = query(
          collection(db, 'users'),
          where('coachId', '==', user.uid),
          where('role', '==', 'athlete'),
        )
        const snap = await getDocs(q)
        if (!cancelled) {
          setAthletes(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        }
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [user?.uid])

  const counts = useMemo(() => {
    return athletes.reduce((acc, a) => {
      const s = a.status || 'active'
      acc[s] = (acc[s] || 0) + 1
      acc.all = (acc.all || 0) + 1
      return acc
    }, { all: 0 })
  }, [athletes])

  const activeCount = useMemo(
    () => athletes.filter(a => (a.status || 'active') === 'active').length,
    [athletes],
  )

  return { athletes, loading, error, counts, activeCount }
}
