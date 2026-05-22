import { useState, useEffect, useRef, useCallback } from 'react'
import { PRESTART_SECONDS, unlockTimerAudio } from '../lib/timerSounds'
import { useTimerCues } from './useTimerCues'

/**
 * Cuenta regresiva 10s antes del trabajo; luego phase === 'active'.
 */
export function usePrestartGate() {
  const [phase, setPhase] = useState('idle') // idle | prestart | active
  const [prestartLeft, setPrestartLeft] = useState(PRESTART_SECONDS)
  const [prestartRunning, setPrestartRunning] = useState(false)
  const intervalRef = useRef(null)

  useTimerCues(prestartLeft, phase === 'prestart' && prestartRunning, 'prestart')

  useEffect(() => {
    if (phase !== 'prestart' || !prestartRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return undefined
    }
    intervalRef.current = setInterval(() => {
      setPrestartLeft(s => {
        if (s <= 1) {
          setPrestartRunning(false)
          setPhase('active')
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [phase, prestartRunning])

  const requestStart = useCallback(async () => {
    await unlockTimerAudio()
    if (phase === 'idle') {
      setPrestartLeft(PRESTART_SECONDS)
      setPhase('prestart')
      setPrestartRunning(true)
      return
    }
    if (phase === 'prestart') {
      setPrestartRunning(r => !r)
      return
    }
  }, [phase])

  const fullReset = useCallback(() => {
    setPrestartRunning(false)
    setPhase('idle')
    setPrestartLeft(PRESTART_SECONDS)
  }, [])

  return {
    phase,
    prestartLeft,
    prestartRunning,
    isIdle: phase === 'idle',
    isPrestart: phase === 'prestart',
    isActive: phase === 'active',
    requestStart,
    fullReset,
    pausePrestart: () => setPrestartRunning(false),
    resumePrestart: () => setPrestartRunning(true),
  }
}
