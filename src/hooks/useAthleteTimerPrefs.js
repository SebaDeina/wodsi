import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  DEFAULT_ATHLETE_TIMER_PREFS,
  loadAthleteTimerPrefs,
  saveAthleteTimerPrefs,
} from '../lib/athleteTimerPrefs'

export function useAthleteTimerPrefs() {
  const { user } = useAuth()
  const uid = user?.uid
  const [prefs, setPrefs] = useState(() => loadAthleteTimerPrefs(uid))

  useEffect(() => {
    setPrefs(loadAthleteTimerPrefs(uid))
  }, [uid])

  const updatePrefs = useCallback((mode, patch) => {
    setPrefs(prev => {
      const next = {
        ...prev,
        [mode]: { ...prev[mode], ...patch },
      }
      saveAthleteTimerPrefs(uid, next)
      return next
    })
  }, [uid])

  const setBeepsEnabled = useCallback((enabled) => {
    setPrefs(prev => {
      const next = { ...prev, beepsEnabled: enabled }
      saveAthleteTimerPrefs(uid, next)
      return next
    })
  }, [uid])

  const resetPrefs = useCallback(() => {
    const defaults = JSON.parse(JSON.stringify(DEFAULT_ATHLETE_TIMER_PREFS))
    setPrefs(defaults)
    saveAthleteTimerPrefs(uid, defaults)
  }, [uid])

  return { prefs, updatePrefs, setBeepsEnabled, resetPrefs }
}
