import { useState, useEffect } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { getCached, setCached } from '../lib/queryCache'

const COACH_CACHE_TTL_MS = 30 * 60 * 1000

export function useAthleteCoach(coachId) {
  const cacheKey = coachId ? `coach:${coachId}` : null
  const [coach, setCoach] = useState(() => (cacheKey ? getCached(cacheKey, COACH_CACHE_TTL_MS) : null))
  const [loading, setLoading] = useState(() => Boolean(coachId) && !(cacheKey && getCached(cacheKey, COACH_CACHE_TTL_MS)))

  useEffect(() => {
    if (!coachId) {
      setCoach(null)
      setLoading(false)
      return
    }

    const cached = getCached(cacheKey, COACH_CACHE_TTL_MS)
    if (cached) {
      setCoach(cached)
      setLoading(false)
    } else {
      setLoading(true)
    }

    let cancelled = false

    async function load() {
      try {
        const pub = await getDoc(doc(db, 'coaches_public', coachId))
        if (pub.exists()) {
          const data = { id: coachId, ...pub.data() }
          if (!cancelled) {
            setCoach(data)
            setCached(cacheKey, data)
          }
          return
        }
        const userSnap = await getDoc(doc(db, 'users', coachId))
        if (!cancelled) {
          if (userSnap.exists()) {
            const d = userSnap.data()
            const data = { id: coachId, name: d.name, boxName: d.boxName || d.name }
            setCoach(data)
            setCached(cacheKey, data)
          } else {
            setCoach(null)
          }
        }
      } catch {
        if (!cancelled && !cached) setCoach(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [coachId, cacheKey])

  return { coach, loading }
}
