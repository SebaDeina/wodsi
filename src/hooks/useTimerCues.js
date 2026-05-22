import { useEffect, useRef } from 'react'
import { playCueForSecond } from '../lib/timerSounds'
import { useAthleteTimerPrefs } from './useAthleteTimerPrefs'

/**
 * Dispara sonidos cuando cambia el segundo mostrado (evita repetir en el mismo tick).
 */
export function useTimerCues(secondsLeft, active, mode) {
  const lastPlayed = useRef(null)
  const { prefs } = useAthleteTimerPrefs()
  const beepsOn = prefs.beepsEnabled !== false

  useEffect(() => {
    if (!beepsOn || !active || secondsLeft == null) return
    const sec = Math.ceil(secondsLeft)
    if (sec === lastPlayed.current) return
    lastPlayed.current = sec
    playCueForSecond(sec, mode)
  }, [secondsLeft, active, mode, beepsOn])

  useEffect(() => {
    if (!active) lastPlayed.current = null
  }, [active])
}
