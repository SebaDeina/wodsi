import { useState, useEffect, useCallback, useMemo } from 'react'
import { collection, doc, getDocs, query, setDoc, where } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { addDays, toDateKey } from '../lib/dates'
import { sessionLogDocId } from '../lib/athleteSessionLog'

export function useAthleteSessionLogs({ fromKey: fromParam, toKey: toParam } = {}) {
  const { user } = useAuth()
  const [logsByDate, setLogsByDate] = useState({})
  const [loading, setLoading] = useState(true)

  const range = useMemo(() => {
    const to = toParam || toDateKey(new Date())
    const from = fromParam || toDateKey(addDays(new Date(), -27))
    return { from, to }
  }, [fromParam, toParam])

  const load = useCallback(async () => {
    if (!user?.uid) {
      setLogsByDate({})
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const q = query(
        collection(db, 'athlete_session_logs'),
        where('athleteId', '==', user.uid),
        where('date', '>=', range.from),
        where('date', '<=', range.to),
      )
      const snap = await getDocs(q)
      const map = {}
      snap.docs.forEach(d => {
        const data = d.data()
        if (data.date) map[data.date] = { id: d.id, ...data }
      })
      setLogsByDate(map)
    } catch {
      setLogsByDate({})
    } finally {
      setLoading(false)
    }
  }, [user?.uid, range.from, range.to])

  useEffect(() => { load() }, [load])

  const setCompleted = useCallback(async (dateKey, wod, completed = true) => {
    if (!user?.uid || !dateKey) return
    const ref = doc(db, 'athlete_session_logs', sessionLogDocId(user.uid, dateKey))
    const payload = {
      athleteId: user.uid,
      date: dateKey,
      wodId: wod?.id || null,
      wodTitle: wod?.title || null,
      completed: Boolean(completed),
      completedAt: completed ? new Date().toISOString() : null,
    }
    await setDoc(ref, payload, { merge: true })
    setLogsByDate(prev => ({
      ...prev,
      [dateKey]: { ...prev[dateKey], ...payload, id: sessionLogDocId(user.uid, dateKey) },
    }))
  }, [user?.uid])

  const toggleCompleted = useCallback(async (dateKey, wod) => {
    const current = logsByDate[dateKey]?.completed
    await setCompleted(dateKey, wod, !current)
  }, [logsByDate, setCompleted])

  const isCompleted = useCallback(
    (dateKey) => Boolean(logsByDate[dateKey]?.completed),
    [logsByDate],
  )

  const completedCount = useMemo(
    () => Object.values(logsByDate).filter(l => l.completed).length,
    [logsByDate],
  )

  return {
    logsByDate,
    loading,
    reload: load,
    setCompleted,
    toggleCompleted,
    isCompleted,
    completedCount,
  }
}
