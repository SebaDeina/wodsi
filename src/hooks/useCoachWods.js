import { useState, useEffect, useMemo } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { addDays, toDateKey } from '../lib/dates'

export function useCoachWods(weekStart) {
  const { user } = useAuth()
  const [wods, setWods] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user?.uid) {
      setWods([])
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    async function load() {
      try {
        const q = query(collection(db, 'wods'), where('coachId', '==', user.uid))
        const snap = await getDocs(q)
        if (!cancelled) {
          setWods(
            snap.docs
              .map(d => ({ id: d.id, ...d.data() }))
              .sort((a, b) => (a.date || '').localeCompare(b.date || '')),
          )
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

  const weekEnd = weekStart ? addDays(weekStart, 6) : null
  const weekStartKey = weekStart ? toDateKey(weekStart) : null
  const weekEndKey = weekEnd ? toDateKey(weekEnd) : null

  const weekWods = useMemo(() => {
    if (!weekStartKey || !weekEndKey) return wods
    return wods.filter(w => w.date >= weekStartKey && w.date <= weekEndKey)
  }, [wods, weekStartKey, weekEndKey])

  const wodsByDate = useMemo(() => {
    const map = {}
    for (const w of weekWods) {
      if (!w.date) continue
      if (!map[w.date]) map[w.date] = []
      map[w.date].push(w)
    }
    return map
  }, [weekWods])

  const todayKey = toDateKey(new Date())
  const todayWods = useMemo(() => wods.filter(w => w.date === todayKey), [wods, todayKey])

  return { wods, weekWods, wodsByDate, todayWods, loading, error }
}
