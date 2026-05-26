import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { recordPageView, recordUserActivity } from '../lib/appAnalytics'

const PING_MS = 60_000

export function PageViewTracker() {
  const location = useLocation()
  const { user } = useAuth()
  const lastPath = useRef(null)
  const pingRef = useRef(null)

  useEffect(() => {
    const path = location.pathname + location.search
    if (lastPath.current === path) return
    lastPath.current = path
    recordPageView()
  }, [location.pathname, location.search])

  useEffect(() => {
    if (!user?.uid) return undefined

    recordUserActivity(user.uid)

    function tick() {
      if (document.visibilityState !== 'visible') return
      recordUserActivity(user.uid, { addMinutes: 1 })
    }

    pingRef.current = setInterval(tick, PING_MS)

    function onVisible() {
      if (document.visibilityState === 'visible') recordUserActivity(user.uid)
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      clearInterval(pingRef.current)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [user?.uid])

  return null
}
