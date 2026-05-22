import { useState, useEffect } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { getCached, setCached } from '../lib/queryCache'

const GROUP_CACHE_TTL_MS = 30 * 60 * 1000

export function useAthleteProgramGroup(programGroupId) {
  const cacheKey = programGroupId ? `programGroup:${programGroupId}` : null
  const [group, setGroup] = useState(() => (cacheKey ? getCached(cacheKey, GROUP_CACHE_TTL_MS) : null))
  const [loading, setLoading] = useState(
    () => Boolean(programGroupId) && !(cacheKey && getCached(cacheKey, GROUP_CACHE_TTL_MS)),
  )

  useEffect(() => {
    if (!programGroupId) {
      setGroup(null)
      setLoading(false)
      return
    }

    const cached = getCached(cacheKey, GROUP_CACHE_TTL_MS)
    if (cached) {
      setGroup(cached)
      setLoading(false)
    } else {
      setLoading(true)
    }

    let cancelled = false
    getDoc(doc(db, 'program_groups', programGroupId))
      .then(snap => {
        if (cancelled) return
        const data = snap.exists() ? { id: snap.id, ...snap.data() } : null
        setGroup(data)
        if (data) setCached(cacheKey, data)
      })
      .catch(() => { if (!cancelled && !cached) setGroup(null) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [programGroupId, cacheKey])

  return { group, loading }
}
