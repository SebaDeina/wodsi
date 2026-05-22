import { useState, useEffect, useMemo } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { addDays, startOfWeek, toDateKey } from '../lib/dates'
import { filterWodsForAthlete, pickPrimaryWod } from '../lib/programAssign'
import { getCached, setCached, invalidateCached } from '../lib/queryCache'

function mapWodDocs(snap) {
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
}

function filterByWeek(all, weekStartKey, weekEndKey) {
  return all.filter(w => w.date && w.date >= weekStartKey && w.date <= weekEndKey)
}

async function fetchWeekWods(coachId, weekStartKey, weekEndKey) {
  try {
    const q = query(
      collection(db, 'wods'),
      where('coachId', '==', coachId),
      where('date', '>=', weekStartKey),
      where('date', '<=', weekEndKey),
    )
    const snap = await getDocs(q)
    return mapWodDocs(snap)
  } catch {
    const q = query(collection(db, 'wods'), where('coachId', '==', coachId))
    const snap = await getDocs(q)
    return filterByWeek(mapWodDocs(snap), weekStartKey, weekEndKey)
  }
}

export function useAthleteWods(coachId, weekStart) {
  const { user } = useAuth()
  const athleteId = user?.uid
  const todayKey = toDateKey(new Date())

  const weekAnchor = useMemo(() => {
    if (weekStart) {
      const d = new Date(weekStart)
      d.setHours(0, 0, 0, 0)
      return d
    }
    return startOfWeek()
  }, [weekStart ? toDateKey(new Date(weekStart)) : todayKey])

  const weekStartKey = toDateKey(weekAnchor)
  const weekEndKey = toDateKey(addDays(weekAnchor, 6))
  const cacheKey = coachId && athleteId
    ? `wods:${coachId}:${weekStartKey}:${weekEndKey}:${athleteId}`
    : null

  const [wods, setWods] = useState(() => (cacheKey ? getCached(cacheKey) : null) ?? [])
  const [loading, setLoading] = useState(() => !(cacheKey && getCached(cacheKey)))
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!coachId || !athleteId || !cacheKey) {
      setWods([])
      setLoading(false)
      return
    }

    const cached = getCached(cacheKey)
    if (cached) {
      setWods(cached)
      setLoading(false)
    } else {
      setLoading(true)
    }

    let cancelled = false

    async function load() {
      try {
        const weekRaw = await fetchWeekWods(coachId, weekStartKey, weekEndKey)
        if (cancelled) return
        const filtered = filterWodsForAthlete(weekRaw, athleteId)
        setWods(filtered)
        setCached(cacheKey, filtered)
        setError(null)
      } catch (err) {
        if (!cancelled) {
          setError(err.message)
          invalidateCached(cacheKey)
          if (!cached) setWods([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [coachId, athleteId, cacheKey, weekStartKey, weekEndKey])

  const weekWods = wods

  const wodsByDate = useMemo(() => {
    const map = {}
    for (const w of weekWods) {
      if (!w.date) continue
      if (!map[w.date]) map[w.date] = []
      map[w.date].push(w)
    }
    return map
  }, [weekWods])

  const todayWods = useMemo(() => wods.filter(w => w.date === todayKey), [wods, todayKey])
  const todayWod = useMemo(
    () => pickPrimaryWod(todayWods, athleteId),
    [todayWods, athleteId],
  )

  return { wods, weekWods, wodsByDate, todayWods, todayWod, loading, error }
}
